/**
 * ============================================================================
 *  Output Contract — canonical confidence scale
 * ============================================================================
 *
 * The single confidence scale for the whole program. Every estimate,
 * classification, and verdict uses these three levels. Do NOT redefine this
 * locally — engines alias it (e.g. `FieldConfidence`) so there is exactly one
 * definition behind every name.
 */
export type Confidence = "low" | "medium" | "high";

const RANK: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

/** The more cautious of two confidence levels (low < medium < high). */
export function minConfidence(a: Confidence, b: Confidence): Confidence {
  return RANK[a] <= RANK[b] ? a : b;
}
