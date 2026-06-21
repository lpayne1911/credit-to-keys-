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

export interface ExtractedFields {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: string;
  vin?: string;
  vehiclePrice?: string;
  apr?: string;
  termMonths?: string;
  monthlyPayment?: string;
  warrantyPrice?: string;
  fees?: { label: string; amount: number }[];
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
 * Runs server-side only (the API key never reaches the browser). On any failure
 * it returns {} so the upload path degrades gracefully to manual confirmation.
 */
const anthropicExtractor: QuoteExtractor = {
  name: "anthropic",
  async extract(input: ParseInput): Promise<ExtractedFields> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return {};

    // Lazy import so the SDK never ends up in a client/edge bundle.
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const model = process.env.PARSE_MODEL || "claude-opus-4-8";

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
  "vehiclePrice": number,            // the vehicle sale/selling price before fees
  "apr": number,                     // financing APR as a percent, e.g. 9.9
  "termMonths": number,
  "monthlyPayment": number,
  "warrantyPrice": number,           // price of any extended warranty / VSC / service contract
  "fees": [ { "label": string, "amount": number } ]  // every dealer fee & add-on line item: doc fee, nitrogen, VIN etch, paint/fabric protection, dealer prep, market adjustment, title/registration, etc.
}
Strip "$" and commas from all numbers. If the document is not a car quote, return {}.`;

    try {
      const res = await client.messages.create(
        {
          model,
          max_tokens: 1500,
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
    } catch {
      // Network/auth/model error — fall back to manual confirmation.
      return {};
    }
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
function normalize(raw: Record<string, unknown>): ExtractedFields {
  const s = (v: unknown): string | undefined => {
    if (v === null || v === undefined || v === "") return undefined;
    return String(v).trim() || undefined;
  };
  const out: ExtractedFields = {
    year: s(raw.year),
    make: s(raw.make),
    model: s(raw.model),
    trim: s(raw.trim),
    mileage: s(raw.mileage),
    vin: s(raw.vin),
    vehiclePrice: s(raw.vehiclePrice),
    apr: s(raw.apr),
    termMonths: s(raw.termMonths),
    monthlyPayment: s(raw.monthlyPayment),
    warrantyPrice: s(raw.warrantyPrice),
  };
  if (Array.isArray(raw.fees)) {
    const fees = raw.fees
      .map((f) => {
        const row = (f ?? {}) as Record<string, unknown>;
        const label = s(row.label) ?? "";
        const amount = Number(String(row.amount ?? "").replace(/[^0-9.\-]/g, ""));
        return { label, amount: Number.isFinite(amount) ? amount : 0 };
      })
      .filter((f) => f.label || f.amount);
    if (fees.length) out.fees = fees;
  }
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
