/**
 * State fee-rule context — a conservative, buyer-side reference for the kinds of
 * fees a dealer charges and how they're regulated by state.
 *
 * COMPLIANCE: this is NOT legal advice and NOT a legal determination. Cap values
 * are documented PLACEHOLDERS — known/approximate figures that must be verified
 * before any real reliance. Every buyer-facing message built on this data asks
 * the buyer to *confirm with the dealer in writing*, so no value here is asserted
 * as a legal fact. Unknown states fall back to a safe "unknown" rule set.
 *
 * Seeded for a handful of states today; the shape supports filling all 50 later
 * with no API changes. Pure + deterministic — no network, no scoring impact.
 */

export type DocFeeCapType = "hard_cap" | "regulated" | "uncapped" | "unknown";

export interface FeeRuleContext {
  /** 2-letter state, or "UNKNOWN" when the buyer's state isn't known. */
  state: string;
  /** Known/approximate doc-fee ceiling in dollars, or null when not known. */
  docFeeCap: number | null;
  docFeeCapType: DocFeeCapType;
  /** Whether the doc fee is typically taxable; null when not known. */
  taxableDocFee: boolean | null;
  /** How confident we are about this state's registration/title rules. */
  registrationRuleConfidence: "low" | "medium" | "high";
  /** Disclosures a buyer can reasonably ask the dealer to make in writing. */
  requiredDisclosures: string[];
  /** Labels that commonly indicate dealer-padded / negotiable charges. */
  suspiciousFeeLabels: string[];
}

// Common dealer-padded labels surfaced regardless of state.
const COMMON_SUSPICIOUS = [
  "dealer prep",
  "prep fee",
  "reconditioning",
  "nitrogen",
  "vin etch",
  "etching",
  "paint protection",
  "fabric protection",
  "market adjustment",
  "procurement",
  "appearance",
];

const BASE_DISCLOSURES = [
  "An itemized out-the-door price separating government fees from dealer fees.",
  "Whether each fee is optional, taxable, and negotiable — in writing.",
];

/**
 * Per-state seed. PLACEHOLDER caps — known/approximate, framed for "confirm,"
 * never asserted as legal fact. Partial values merge over the safe default.
 */
const STATE_FEE_RULES: Record<string, Partial<FeeRuleContext>> = {
  // Hard statutory doc-fee caps (approximate; verify before real reliance).
  CA: { docFeeCap: 85, docFeeCapType: "hard_cap", taxableDocFee: false, registrationRuleConfidence: "medium" },
  NY: { docFeeCap: 175, docFeeCapType: "hard_cap", taxableDocFee: true, registrationRuleConfidence: "medium" },
  // Regulated / "reasonable" doc fee — not a single hard number.
  TX: { docFeeCap: 150, docFeeCapType: "regulated", taxableDocFee: false, registrationRuleConfidence: "medium" },
  OH: { docFeeCap: 250, docFeeCapType: "regulated", taxableDocFee: false, registrationRuleConfidence: "low" },
  // Explicitly uncapped — doc fee varies widely; nothing to flag against a cap.
  FL: { docFeeCap: null, docFeeCapType: "uncapped", taxableDocFee: true, registrationRuleConfidence: "low" },
  VA: { docFeeCap: null, docFeeCapType: "uncapped", taxableDocFee: true, registrationRuleConfidence: "low" },
};

/** Safe default for unknown / unseeded states. */
function defaultRules(state: string): FeeRuleContext {
  return {
    state,
    docFeeCap: null,
    docFeeCapType: "unknown",
    taxableDocFee: null,
    registrationRuleConfidence: "low",
    requiredDisclosures: [...BASE_DISCLOSURES],
    suspiciousFeeLabels: [...COMMON_SUSPICIOUS],
  };
}

/**
 * Resolve the fee-rule context for a state (case-insensitive 2-letter code).
 * Null/unknown → the safe "UNKNOWN" default.
 */
export function getFeeRules(state: string | null | undefined): FeeRuleContext {
  const code = (state ?? "").trim().toUpperCase();
  if (!code) return defaultRules("UNKNOWN");
  const seed = STATE_FEE_RULES[code];
  if (!seed) return defaultRules(code);
  return { ...defaultRules(code), ...seed, state: code };
}
