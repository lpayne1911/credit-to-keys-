/**
 * ============================================================================
 *  Upload parsing seam — pluggable quote extractor
 * ============================================================================
 *
 * The upload path is deliberately NOT instant: a quote (photo/PDF) is stored,
 * fields are extracted here, and the buyer CONFIRMS/fills the rest before
 * scoring. This module is the single seam where a real OCR / document-LLM
 * extractor drops in. The `/api/parse` route depends ONLY on `extractFields`
 * and `ExtractedFields` — swapping the provider changes nothing else.
 *
 * v1 ships the `none` provider (returns {}), which is honest: we store the file
 * and ask the buyer to type the numbers. Set PARSE_PROVIDER + the provider's
 * own env (e.g. an API key) to enable a real extractor without touching the UI.
 */

import { isWarrantyLineItem } from "../warranty/detect-warranty-line-item";
import { isFinanceAddOnProduct } from "../add-on-engine/classifyAddOns";

export interface ExtractedFields {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: string;
  vin?: string;
  /** Condition as stated: new / used / cpo / demo / rental. */
  condition?: string;
  /** Exterior color. */
  color?: string;
  vehiclePrice?: string;
  apr?: string;
  termMonths?: string;
  monthlyPayment?: string;
  warrantyPrice?: string;
  /** Dealer-stated "total vehicle price" line (for math cross-check). */
  totalVehiclePrice?: string;
  /** Dealer-stated "balance due on delivery" (for math cross-check). */
  balanceDue?: string;
  /** The dealership's name. */
  dealerName?: string;
  /** The dealership's street address. */
  dealerAddress?: string;
  /** The dealership's phone number. */
  dealerPhone?: string;
  /** The salesperson named on the order. */
  salesperson?: string;
  /** The dealer stock number for the vehicle. */
  stockNumber?: string;
  /** The buyer's auto-insurance carrier NAME only (never a policy number). */
  insuranceCarrier?: string;
  /** The dealership's ZIP code, used as a fallback to resolve the deal's state. */
  dealerZip?: string;
  /** Two-letter state of the dealer/sale, used to resolve tax & doc-fee rules. */
  dealerState?: string;
  /** A deposit / down payment already submitted with the order. */
  deposit?: string;
  /** Trade-in vehicle identity, when a trade is on the order. */
  tradeYear?: string;
  tradeMake?: string;
  tradeModel?: string;
  tradeMileage?: string;
  fees?: { label: string; amount: number }[];
  /** Optional F&I products (GAP, maintenance, tire & wheel, …) listed on the
   *  paperwork. Separated from fees so they land in the add-ons section. */
  addOns?: { label: string; amount: number }[];
}

export interface ParseInput {
  bytes: Uint8Array;
  contentType: string;
  filename: string;
}

export interface QuoteExtractor {
  name: string;
  extract(input: ParseInput): Promise<ExtractedFields>;
}

/**
 * PLACEHOLDER provider — performs no extraction. The honest fallback: we keep
 * the uploaded file and let the buyer confirm/enter fields. Used when no
 * extractor is configured (no ANTHROPIC_API_KEY and PARSE_PROVIDER unset/none).
 */
const noneExtractor: QuoteExtractor = {
  name: "none",
  async extract(): Promise<ExtractedFields> {
    return {};
  },
};

/**
 * Real extractor: reads the uploaded quote (PDF or photo) with a Claude
 * document/vision model and returns structured fields. Both PDFs and phone
 * photos work, across any dealer layout. Buyer-side only — the prompt extracts
 * verbatim figures and never invents a "fair price"; the fairness engine scores.
 *
 * Runs server-side only (the API key never reaches the browser). Tries the
 * configured model then a fallback; if all fail it throws the last error so the
 * route can surface a concise reason and degrade to manual confirmation.
 */
const anthropicExtractor: QuoteExtractor = {
  name: "anthropic",
  async extract(input: ParseInput): Promise<ExtractedFields> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return {};

    // Lazy import so the SDK never ends up in a client/edge bundle.
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const primary = process.env.PARSE_MODEL || "claude-opus-4-8";
    // If the primary model isn't enabled for this account (e.g. model_not_found),
    // fall back to a broadly-available one that also supports PDF + vision.
    const FALLBACK = "claude-haiku-4-5-20251001";
    const models = primary === FALLBACK ? [primary] : [primary, FALLBACK];

    const base64 = Buffer.from(input.bytes).toString("base64");
    const isPdf = input.contentType.startsWith("application/pdf");

    // The document/image block goes BEFORE the instruction text.
    const fileBlock = isPdf
      ? ({
          type: "document" as const,
          source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
        })
      : ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: imageMediaType(input.contentType),
            data: base64,
          },
        });

    const instruction = `You are reading a car dealership's purchase order / quote for a BUYER who wants it fairness-checked. Extract ONLY values that actually appear on the document — never guess or compute a "fair" number.

Return a single JSON object (no prose, no code fences) with these keys, omitting any you can't find:
{
  "year": number, "make": string, "model": string, "trim": string,
  "mileage": number, "vin": string,
  "condition": string,               // "new", "used", "cpo", "demo", or "rental" — whichever box/word is marked
  "color": string,                   // exterior color, if shown
  "vehiclePrice": number,            // the vehicle sale/selling price before fees
  "apr": number,                     // financing APR as a percent, e.g. 9.9 — ONLY if a real rate is shown
  "termMonths": number,              // financing term in months — ONLY a real term (e.g. 36, 60, 72); ignore placeholder/blank values like 0 or 1
  "monthlyPayment": number,
  "deposit": number,                 // any deposit / down payment / cash submitted with the order
  "totalVehiclePrice": number,       // the document's stated "total vehicle price" subtotal (price + fees + taxes), if shown
  "balanceDue": number,              // the document's stated "balance due on delivery" / total balance, if shown
  "warrantyPrice": number,           // price of any vehicle service contract / extended warranty, under ANY name: VSC, extended service plan/contract (ESP/ESC), mechanical breakdown insurance (MBI), a manufacturer plan (e.g. Honda Care, Ford Protect/PremiumCARE, GM Protection Plan, Mopar MaxCare, Nissan Security+Plus, Subaru Added Security), or a provider plan (e.g. Endurance, Zurich, Ally Premier Protection, Fidelity, Assurant, CarShield). NOT GAP, tire & wheel, key, or paint/fabric protection.
  "dealerName": string,              // the dealership's name, from its letterhead/footer
  "dealerAddress": string,           // the dealership's street address (street, city, state ZIP)
  "dealerPhone": string,             // the dealership's phone number
  "salesperson": string,             // the salesperson named on the order
  "stockNumber": string,             // the dealer stock number (STOCK NO.) for the vehicle
  "insuranceCarrier": string,        // the buyer's auto-insurance company NAME ONLY (e.g. "USAA", "GEICO", "State Farm"). NEVER include the policy number or any account/ID number.
  "dealerZip": string,               // the dealership's 5-digit ZIP code, from its address/letterhead/footer — extract it whenever any address is shown
  "dealerState": string,             // the dealership's 2-letter state code (e.g. MD, CA), from its address/letterhead/footer
  "tradeYear": number, "tradeMake": string, "tradeModel": string, "tradeMileage": number,  // the TRADE-IN vehicle's identity, only if a trade-in is described
  "fees": [ { "label": string, "amount": number } ],   // dealer & government CHARGES only: doc/processing fee, freight/destination, applicable taxes, title/registration, tag, dealer prep, nitrogen, VIN etch, market adjustment, etc.
  "addOns": [ { "label": string, "amount": number } ]  // OPTIONAL F&I PRODUCTS sold separately: GAP / guaranteed asset protection, prepaid/scheduled maintenance or service-maintenance contract, tire & wheel / road hazard, key replacement, GPS/LoJack. Put these here, NOT in fees. Skip any line marked DECLINED or N/A.
}
Strip "$" and commas from all numbers. Only include a value that actually appears on the document; if a line says DECLINED or N/A, omit it. If the document is not a car quote, return {}.`;

    let lastError = "";
    for (const model of models) {
      try {
        const res = await client.messages.create(
          {
            model,
            max_tokens: 1500,
            // Deterministic read: temperature 0 so the same document extracts the
            // same figures every time (no run-to-run drift in what it pulls).
            temperature: 0,
            messages: [
              {
                role: "user",
                content: [fileBlock, { type: "text", text: instruction }],
              },
            ],
          },
          { timeout: 60_000 },
        );
        const text = res.content
          .map((b) => (b.type === "text" ? b.text : ""))
          .join("")
          .trim();
        return normalize(parseJsonObject(text));
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[parse] extract failed on ${model}: ${lastError}`);
        // try the next model
      }
    }
    // Every model failed — throw so the route can surface a concise reason; the
    // route catches it and the upload path still degrades to manual entry.
    throw new Error(lastError || "extraction failed");
  },
};

function imageMediaType(
  contentType: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const t = contentType.toLowerCase();
  if (t.includes("png")) return "image/png";
  if (t.includes("gif")) return "image/gif";
  if (t.includes("webp")) return "image/webp";
  return "image/jpeg";
}

/** Pull the first balanced JSON object out of the model's reply. */
function parseJsonObject(text: string): Record<string, unknown> {
  if (!text) return {};
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return {};
  try {
    const obj = JSON.parse(text.slice(start, end + 1));
    return obj && typeof obj === "object" ? (obj as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Coerce the model's JSON into ExtractedFields (all strings; fees typed). */
export function normalize(raw: Record<string, unknown>): ExtractedFields {
  const s = (v: unknown): string | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    return String(v).trim() || undefined;
  };
  // A financing term is only meaningful if it's a plausible auto-loan length.
  // Dealer worksheets sometimes carry a placeholder ("# OF MONTHS FINANCED 1"),
  // so reject anything outside ~6–120 months rather than show "1 mo".
  const plausibleTerm = (v: unknown): string | undefined => {
    const n = Number(String(v ?? "").replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n >= 6 && n <= 120 ? String(Math.round(n)) : undefined;
  };
  // Two-letter state code, upper-cased; ignore anything that isn't one.
  const stateCode = (v: unknown): string | undefined => {
    const t = s(v)?.toUpperCase();
    return t && /^[A-Z]{2}$/.test(t) ? t : undefined;
  };
  const toLine = (f: unknown): { label: string; amount: number } => {
    const row = (f ?? {}) as Record<string, unknown>;
    const label = s(row.label) ?? "";
    const amount = Number(String(row.amount ?? "").replace(/[^0-9.\-]/g, ""));
    return { label, amount: Number.isFinite(amount) ? amount : 0 };
  };

  const out: ExtractedFields = {
    year: s(raw.year),
    make: s(raw.make),
    model: s(raw.model),
    trim: s(raw.trim),
    mileage: s(raw.mileage),
    vin: s(raw.vin),
    condition: s(raw.condition)?.toLowerCase(),
    color: s(raw.color),
    vehiclePrice: s(raw.vehiclePrice),
    apr: s(raw.apr),
    termMonths: plausibleTerm(raw.termMonths),
    monthlyPayment: s(raw.monthlyPayment),
    deposit: s(raw.deposit),
    totalVehiclePrice: s(raw.totalVehiclePrice),
    balanceDue: s(raw.balanceDue),
    warrantyPrice: s(raw.warrantyPrice),
    dealerName: s(raw.dealerName),
    dealerAddress: s(raw.dealerAddress),
    dealerPhone: s(raw.dealerPhone),
    salesperson: s(raw.salesperson),
    stockNumber: s(raw.stockNumber),
    insuranceCarrier: s(raw.insuranceCarrier),
    dealerZip: s(raw.dealerZip),
    dealerState: stateCode(raw.dealerState),
    tradeYear: s(raw.tradeYear),
    tradeMake: s(raw.tradeMake),
    tradeModel: s(raw.tradeModel),
    tradeMileage: s(raw.tradeMileage),
  };

  // ---- Line items + vehicle-service-contract reconciliation ---------------
  // Document extraction can place the SAME product in a different bucket from
  // one upload to the next (fees vs. add-ons vs. the warrantyPrice field). To
  // keep the vehicle service contract STABLE and accurate, OUR warranty catalog
  // — not the model — decides what counts as a VSC, scanning every line item
  // regardless of where the model put it.
  let fees = Array.isArray(raw.fees)
    ? raw.fees.map(toLine).filter((f) => f.label || f.amount)
    : [];
  const addOns = Array.isArray(raw.addOns)
    ? raw.addOns.map(toLine).filter((f) => f.label || f.amount)
    : [];

  // Find a vehicle service contract among ALL line items (fees first, then
  // add-ons). The catalog distinguishes a true VSC from a prepaid / service-
  // maintenance contract, so the same paperwork always resolves the same way.
  const vscInFees = fees.findIndex((f) => f.amount > 0 && isWarrantyLineItem(f.label));
  const vscInAddOns = addOns.findIndex((a) => a.amount > 0 && isWarrantyLineItem(a.label));

  if (!out.warrantyPrice) {
    // No model-reported warranty price — take it from the detected line (a VSC
    // can land in either bucket) so the buyer's contract still gets
    // price-checked, then remove that line so it isn't also listed as a product.
    if (vscInFees !== -1) {
      out.warrantyPrice = String(fees[vscInFees].amount);
      fees.splice(vscInFees, 1);
    } else if (vscInAddOns !== -1) {
      out.warrantyPrice = String(addOns[vscInAddOns].amount);
      addOns.splice(vscInAddOns, 1);
    }
  } else {
    // Model already reported a warranty price — drop a duplicate VSC line ONLY
    // when the amount matches, so the same contract isn't counted twice while a
    // genuinely separate line (different amount) is preserved.
    const wp = Number(out.warrantyPrice);
    const dup = (amt: number) => Number.isFinite(wp) && Math.abs(amt - wp) < 0.005;
    if (vscInFees !== -1 && dup(fees[vscInFees].amount)) fees.splice(vscInFees, 1);
    else if (vscInAddOns !== -1 && dup(addOns[vscInAddOns].amount)) addOns.splice(vscInAddOns, 1);
  }

  // Other optional F&I products (GAP, prepaid/service-maintenance, tire & wheel,
  // key, GPS) sometimes land on the fee schedule. Move them to add-ons so they
  // are scored as optional products instead of inflating "total fees".
  const reclassified = fees.filter((f) => isFinanceAddOnProduct(f.label));
  if (reclassified.length) {
    addOns.push(...reclassified);
    fees = fees.filter((f) => !isFinanceAddOnProduct(f.label));
  }

  if (fees.length) out.fees = fees;
  if (addOns.length) out.addOns = addOns;

  // Drop undefined keys so the route's "got anything?" check is accurate.
  return Object.fromEntries(
    Object.entries(out).filter(([, v]) => v !== undefined),
  ) as ExtractedFields;
}

/**
 * Select the configured extractor. Defaults to the Anthropic extractor whenever
 * an ANTHROPIC_API_KEY is present (set PARSE_PROVIDER=none to force-disable, or
 * PARSE_MODEL to pick the model). Falls back to `none` when nothing is set, so
 * the app stays honest and functional with zero configuration.
 */
export function getExtractor(): QuoteExtractor {
  const provider = (
    process.env.PARSE_PROVIDER ?? (process.env.ANTHROPIC_API_KEY ? "anthropic" : "none")
  ).toLowerCase();
  switch (provider) {
    case "anthropic":
      return anthropicExtractor;
    case "none":
    default:
      return noneExtractor;
  }
}

/** Convenience: run the configured extractor over an upload. */
export async function extractFields(input: ParseInput): Promise<ExtractedFields> {
  return getExtractor().extract(input);
}
