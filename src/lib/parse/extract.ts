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
 * PLACEHOLDER provider — performs no extraction. This is the honest v1 default:
 * we keep the uploaded file and let the buyer confirm/enter fields. Replace by
 * implementing a real `QuoteExtractor` (e.g. a Claude vision / document model or
 * an OCR service) and selecting it via PARSE_PROVIDER.
 */
const noneExtractor: QuoteExtractor = {
  name: "none",
  // PLACEHOLDER — no extraction performed in v1.
  async extract(): Promise<ExtractedFields> {
    return {};
  },
};

/**
 * Select the configured extractor. Add real providers here, keyed by
 * PARSE_PROVIDER, as they're implemented. Falling back to `none` keeps the app
 * honest and functional when nothing is configured.
 */
export function getExtractor(): QuoteExtractor {
  const provider = (process.env.PARSE_PROVIDER ?? "none").toLowerCase();
  switch (provider) {
    // case "anthropic":   return anthropicExtractor;   // real provider goes here
    // case "ocr":         return ocrExtractor;
    case "none":
    default:
      return noneExtractor;
  }
}

/** Convenience: run the configured extractor over an upload. */
export async function extractFields(input: ParseInput): Promise<ExtractedFields> {
  return getExtractor().extract(input);
}
