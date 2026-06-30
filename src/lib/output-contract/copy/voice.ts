/**
 * ============================================================================
 *  Output Contract — voice & compliance
 * ============================================================================
 *
 * The documented voice for ALL buyer-facing copy, plus the SINGLE banned-phrase
 * list enforced program-wide (see compliance.test.ts). Promotes the tone rules
 * that previously lived only in per-file header comments into one place.
 *
 * VOICE
 *  - Calm and buyer-side. We are decision support, never advice.
 *  - State facts, never accusations. Describe what a charge is and why it
 *    matters; never call it a "scam", "fraud", or a legal conclusion.
 *  - Every estimate is a RANGE with a confidence level and a basis — never a
 *    promise of savings and never a precise invented "fair price".
 *  - Actions are calm and imperative: "Ask for…", "Confirm…", "Decline…",
 *    "Request a revised buyer's order." Never "Demand", "Sue", or "Report".
 *  - The buyer always keeps the power to walk.
 */

/**
 * Phrases that must never appear in any buyer-facing output. Matched
 * case-insensitively as substrings across the fully-rendered result of every
 * engine. This is the single source of truth — tests import it, they do not
 * redefine it.
 */
export const BANNED_PHRASES = [
  "broke the law",
  "fraud",
  "illegal",
  "you are entitled",
  "guaranteed savings",
  "green · sign it",
  "contract & legal",
  "legal review",
  "the dealer lied",
] as const;

/** Recursively collect every string in a nested value (for scanning output). */
export function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

/** The first banned phrase found in `text` (case-insensitive), or null. */
export function findBannedPhrase(text: string): string | null {
  const haystack = text.toLowerCase();
  return BANNED_PHRASES.find((p) => haystack.includes(p)) ?? null;
}
