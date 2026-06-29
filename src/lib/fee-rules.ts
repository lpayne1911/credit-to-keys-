/**
 * State fee-rule registry — a conservative, buyer-side reference for how dealer
 * fees are regulated by state, with an explicit verification/confidence model.
 *
 * COMPLIANCE: NOT legal advice and NOT a legal determination. We never assert a
 * state's law. Cap values present today are SEEDED ESTIMATES (not source-
 * verified); every buyer-facing message frames them as "known/approximate —
 * confirm in writing." States without a seed are marked `needs_research` and
 * produce conservative, review-only guidance — we do NOT invent caps, legal
 * rules, or source URLs.
 *
 * Coverage: all 50 states + DC. Pure + deterministic — no network, no scoring.
 */

export type RuleVerificationStatus = "verified" | "seeded" | "needs_research" | "unknown";
export type RuleConfidence = "low" | "medium" | "high";
export type DocFeeCapType = "hard_cap" | "regulated" | "uncapped" | "unknown";

export interface DocFeePolicy {
  capType: DocFeeCapType;
  capAmount: number | null;
  capFormula: string | null;
  taxable: boolean | null;
  mustBeDisclosed: boolean | null;
  negotiabilityGuidance: string;
  customerLanguage: string;
}

export interface GovernmentFeePolicy {
  customerLanguage: string;
  confidence: RuleConfidence;
}

export interface RuleSource {
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  verificationStatus: RuleVerificationStatus;
  notes: string;
}

export interface StateFeeRule {
  stateCode: string;
  stateName: string;
  docFeePolicy: DocFeePolicy;
  governmentFeePolicy: GovernmentFeePolicy;
  suspiciousFeeLabels: string[];
  source: RuleSource;
  confidenceLevel: RuleConfidence;
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

const NEGOTIABILITY =
  "Dealer-created fees can often be questioned — ask whether each is optional, taxable, and negotiable, and get the answer in writing.";

const GOV_LANGUAGE =
  "Ask for the itemized out-the-door price so government charges (tax, title, registration) are separated from dealer-created fees.";

function unknownDocLanguage(name: string): string {
  return `Driveway Advocate does not yet have a verified doc-fee cap for ${name}. Treat dealer-created fees as review items and ask the dealer to identify which charges are government-required, dealer-retained, optional, taxable, and negotiable.`;
}

const NO_LOCATION_DOC_LANGUAGE =
  "Add your ZIP or the dealer's state and we'll check these fees against that state's known rules. Until then, treat dealer-created fees as review items to confirm in writing.";

function money(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/** All 50 states + DC. */
const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

interface Seed {
  capType: DocFeeCapType;
  capAmount: number | null;
  taxable: boolean | null;
  mustBeDisclosed: boolean | null;
  confidenceLevel: RuleConfidence;
  notes: string;
}

/**
 * SEEDED estimates only — approximate, NOT source-verified, no source URLs.
 * They drive the "appears above the known cap — confirm" behavior; they are
 * never presented to the buyer as the legal cap.
 */
const SEED: Record<string, Seed> = {
  CA: { capType: "hard_cap", capAmount: 85, taxable: false, mustBeDisclosed: true, confidenceLevel: "medium", notes: "Approximate documentary fee cap; seeded estimate, not source-verified." },
  NY: { capType: "hard_cap", capAmount: 175, taxable: true, mustBeDisclosed: true, confidenceLevel: "medium", notes: "Approximate documentary fee cap; seeded estimate, not source-verified." },
  TX: { capType: "regulated", capAmount: 150, taxable: false, mustBeDisclosed: true, confidenceLevel: "medium", notes: "Documentary fee is regulated/'reasonable'; seeded estimate, not source-verified." },
  OH: { capType: "regulated", capAmount: 250, taxable: false, mustBeDisclosed: true, confidenceLevel: "low", notes: "Documentary fee guideline; seeded estimate, not source-verified." },
  FL: { capType: "uncapped", capAmount: null, taxable: true, mustBeDisclosed: true, confidenceLevel: "low", notes: "No known statutory doc-fee cap; must be disclosed. Seeded, not source-verified." },
  VA: { capType: "uncapped", capAmount: null, taxable: true, mustBeDisclosed: true, confidenceLevel: "low", notes: "No known statutory doc-fee cap. Seeded, not source-verified." },
};

function seededDocLanguage(name: string, seed: Seed): string {
  if ((seed.capType === "hard_cap" || seed.capType === "regulated") && seed.capAmount != null) {
    const word = seed.capType === "hard_cap" ? "limit" : "guideline";
    return `${name} has a known doc-fee ${word} of about ${money(seed.capAmount)} on file (a seeded estimate, not yet source-verified). If the doc/processing fee is higher, treat it as a review item and confirm the amount with the dealer in writing.`;
  }
  return `${name} is not known to cap dealer doc/processing fees, so the amount can vary. It is a dealer-retained charge — ask whether it is negotiable and confirm it in writing.`;
}

function fallbackRule(
  code: string,
  name: string,
  status: RuleVerificationStatus,
): StateFeeRule {
  const docLang =
    status === "unknown" && code === "UNKNOWN" ? NO_LOCATION_DOC_LANGUAGE : unknownDocLanguage(name);
  return {
    stateCode: code,
    stateName: name,
    docFeePolicy: {
      capType: "unknown",
      capAmount: null,
      capFormula: null,
      taxable: null,
      mustBeDisclosed: null,
      negotiabilityGuidance: NEGOTIABILITY,
      customerLanguage: docLang,
    },
    governmentFeePolicy: { customerLanguage: GOV_LANGUAGE, confidence: "low" },
    suspiciousFeeLabels: [...COMMON_SUSPICIOUS],
    source: {
      sourceName: null,
      sourceUrl: null,
      lastVerifiedAt: null,
      verificationStatus: status,
      notes:
        status === "needs_research"
          ? "No verified doc-fee cap on file yet for this state."
          : "State not recognized or not provided.",
    },
    confidenceLevel: "low",
  };
}

function buildRule(code: string): StateFeeRule {
  const stateName = STATE_NAMES[code] ?? code;
  const seed = SEED[code];
  if (!seed) return fallbackRule(code, stateName, "needs_research");
  return {
    stateCode: code,
    stateName,
    docFeePolicy: {
      capType: seed.capType,
      capAmount: seed.capAmount,
      capFormula: null,
      taxable: seed.taxable,
      mustBeDisclosed: seed.mustBeDisclosed,
      negotiabilityGuidance: NEGOTIABILITY,
      customerLanguage: seededDocLanguage(stateName, seed),
    },
    governmentFeePolicy: { customerLanguage: GOV_LANGUAGE, confidence: seed.confidenceLevel },
    suspiciousFeeLabels: [...COMMON_SUSPICIOUS],
    source: {
      sourceName: null,
      sourceUrl: null,
      lastVerifiedAt: null,
      verificationStatus: "seeded",
      notes: seed.notes,
    },
    confidenceLevel: seed.confidenceLevel,
  };
}

/** Every supported 2-letter code (50 states + DC). */
export const ALL_STATE_CODES: string[] = Object.keys(STATE_NAMES);

/** Prebuilt registry for every supported state. */
export const STATE_FEE_RULES: Record<string, StateFeeRule> = Object.fromEntries(
  ALL_STATE_CODES.map((c) => [c, buildRule(c)]),
);

/**
 * Resolve a state's fee rule (case-insensitive 2-letter code). Always returns a
 * rule object. Null/empty → an "UNKNOWN" location fallback; an unrecognized code
 * → an "unknown" fallback. Never throws, never makes a legal claim.
 */
export function getStateFeeRule(state: string | null | undefined): StateFeeRule {
  const code = (state ?? "").trim().toUpperCase();
  if (!code) return fallbackRule("UNKNOWN", "your state", "unknown");
  return STATE_FEE_RULES[code] ?? fallbackRule(code, code, "unknown");
}
