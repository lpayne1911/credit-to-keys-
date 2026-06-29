/**
 * ============================================================================
 *  Deal Engine — normalizeDealInput
 * ============================================================================
 *
 * Merges manually-entered and/or extracted fields from the Quote Review intake
 * into a single canonical {@link NormalizedDeal}. Numeric fields may arrive as
 * strings ("$24,500") from the form, so every value is coerced defensively —
 * bad input becomes null, never NaN.
 *
 * Because document extraction is imperfect, the result carries per-field and
 * overall confidence and a list of missing fields the review still needs.
 *
 * Pure + deterministic. No network, no AI.
 * ============================================================================
 */
import type {
  DealSource,
  FieldConfidence,
  NormalizedAddOnLine,
  NormalizedDeal,
  NormalizedFeeLine,
} from "./types";

/** Loose wire shape from the intake form / parse step (numbers may be strings). */
export interface QuoteReviewInputRaw {
  vehicle?: {
    year?: string | number | null;
    make?: string | null;
    model?: string | null;
    trim?: string | null;
    mileage?: string | number | null;
    vin?: string | null;
  };
  pricing?: {
    vehiclePrice?: string | number | null;
    msrp?: string | number | null;
    dealerDiscount?: string | number | null;
    rebates?: string | number | null;
    outTheDoor?: string | number | null;
    downPayment?: string | number | null;
  };
  fees?: { label?: string | null; amount?: string | number | null }[];
  addOns?: {
    label?: string | null;
    amount?: string | number | null;
    financed?: boolean | null;
  }[];
  finance?: {
    apr?: string | number | null;
    termMonths?: string | number | null;
    monthlyPayment?: string | number | null;
    amountFinanced?: string | number | null;
    creditBand?: string | null;
  };
  trade?: {
    offer?: string | number | null;
    estimatedValue?: string | number | null;
    loanPayoff?: string | number | null;
  } | null;
  dealerName?: string | null;
  buyerState?: string | null;
  dealerZip?: string | null;
  registrationZip?: string | null;
  alreadySigned?: boolean | null;
  source?: DealSource | null;
  uploadedFilePath?: string | null;
  documentUploaded?: boolean | null;
}

/** Coerce a string/number to a finite number, or null. Strips $ , % and spaces. */
export function toNum(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/[$,%\s]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toStr(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function toState(v: unknown): string | null {
  const s = toStr(v);
  return s ? s.toUpperCase().slice(0, 2) : null;
}

/** Present → confidence by source; missing → "low". */
function confOf(present: boolean, source: DealSource): FieldConfidence {
  if (!present) return "low";
  // Manually typed (or buyer-confirmed) numbers are reliable; raw extraction is
  // a notch lower. Our upload flow routes into manual confirmation, so "upload"
  // here only marks figures the buyer hasn't re-typed.
  return source === "upload" ? "medium" : "high";
}

function aggregate(confidences: FieldConfidence[]): FieldConfidence {
  if (confidences.length === 0) return "low";
  const score = (c: FieldConfidence) => (c === "high" ? 2 : c === "medium" ? 1 : 0);
  const avg =
    confidences.reduce((s, c) => s + score(c), 0) / confidences.length;
  if (avg >= 1.5) return "high";
  if (avg >= 0.75) return "medium";
  return "low";
}

export function normalizeDealInput(
  raw: QuoteReviewInputRaw,
): NormalizedDeal {
  const source: DealSource = raw.source ?? "manual";
  const documentUploaded = Boolean(
    raw.documentUploaded ?? raw.uploadedFilePath ?? false,
  );

  const vehicle = {
    year: toNum(raw.vehicle?.year),
    make: toStr(raw.vehicle?.make),
    model: toStr(raw.vehicle?.model),
    trim: toStr(raw.vehicle?.trim),
    mileage: toNum(raw.vehicle?.mileage),
    vin: toStr(raw.vehicle?.vin),
  };

  const pricing = {
    vehiclePrice: toNum(raw.pricing?.vehiclePrice),
    msrp: toNum(raw.pricing?.msrp),
    dealerDiscount: toNum(raw.pricing?.dealerDiscount),
    rebates: toNum(raw.pricing?.rebates),
    outTheDoor: toNum(raw.pricing?.outTheDoor),
    downPayment: toNum(raw.pricing?.downPayment),
  };

  const finance = {
    apr: toNum(raw.finance?.apr),
    termMonths: toNum(raw.finance?.termMonths),
    monthlyPayment: toNum(raw.finance?.monthlyPayment),
    amountFinanced: toNum(raw.finance?.amountFinanced),
    creditBand: toStr(raw.finance?.creditBand),
  };

  const fees: NormalizedFeeLine[] = (raw.fees ?? [])
    .map((f) => ({ rawLabel: toStr(f?.label) ?? "", amount: toNum(f?.amount) ?? 0 }))
    .filter((f) => f.rawLabel !== "" || f.amount !== 0);

  const addOns: NormalizedAddOnLine[] = (raw.addOns ?? [])
    .map((a) => ({
      rawLabel: toStr(a?.label) ?? "",
      amount: toNum(a?.amount) ?? 0,
      financed: a?.financed ?? null,
    }))
    .filter((a) => a.rawLabel !== "" || a.amount !== 0);

  const tradeOffer = toNum(raw.trade?.offer);
  const tradeEstimated = toNum(raw.trade?.estimatedValue);
  const tradePayoff = toNum(raw.trade?.loanPayoff);
  const hasTrade =
    tradeOffer != null || tradeEstimated != null || tradePayoff != null;
  const trade = hasTrade
    ? { offer: tradeOffer, estimatedValue: tradeEstimated, loanPayoff: tradePayoff }
    : null;

  const fieldConfidence: Record<string, FieldConfidence> = {
    "vehicle.makeModel": confOf(Boolean(vehicle.make && vehicle.model), source),
    "vehicle.year": confOf(vehicle.year != null, source),
    "pricing.vehiclePrice": confOf(pricing.vehiclePrice != null, source),
    "pricing.outTheDoor": confOf(pricing.outTheDoor != null, source),
    "finance.apr": confOf(finance.apr != null, source),
    "finance.termMonths": confOf(finance.termMonths != null, source),
    "finance.monthlyPayment": confOf(finance.monthlyPayment != null, source),
    fees: confOf(fees.length > 0, source),
  };

  // Fields that materially improve the review when present.
  const missingFields: string[] = [];
  if (!(vehicle.make && vehicle.model)) missingFields.push("Vehicle make & model");
  if (vehicle.year == null) missingFields.push("Vehicle year");
  if (pricing.vehiclePrice == null) missingFields.push("Selling price");
  if (pricing.outTheDoor == null) missingFields.push("Out-the-door price");
  if (finance.apr == null) missingFields.push("APR");
  if (finance.termMonths == null) missingFields.push("Loan term");
  if (finance.monthlyPayment == null) missingFields.push("Monthly payment");
  if (fees.length === 0) missingFields.push("Itemized fees (buyer's order)");

  const confidence = aggregate(Object.values(fieldConfidence));

  return {
    vehicle,
    pricing,
    fees,
    addOns,
    finance,
    trade,
    sourceMetadata: {
      source,
      uploadedFilePath: toStr(raw.uploadedFilePath),
      documentUploaded,
      dealerName: toStr(raw.dealerName),
      buyerState: toState(raw.buyerState),
      dealerZip: toStr(raw.dealerZip),
      registrationZip: toStr(raw.registrationZip),
      alreadySigned: raw.alreadySigned ?? null,
    },
    confidence,
    fieldConfidence,
    missingFields,
  };
}
