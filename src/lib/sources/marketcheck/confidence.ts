/**
 * Market confidence from comp depth. Every snapshot carries a confidence level
 * with a buyer-facing reason — a benchmark, never an exact appraisal.
 */
import type { ComparableListing, MarketConfidence } from "./types";

export function getMarketConfidence(comps: ComparableListing[]): MarketConfidence {
  const strong = comps.filter((c) => c.matchScore >= 80).length; // excellent / very good
  const good = comps.filter((c) => c.matchScore >= 70).length; // good+
  if (strong >= 15 || good >= 25) {
    return { level: "high", reasons: [`${good} strong comparable listings found nearby.`] };
  }
  // Medium when we have a solid block of strong comps OR plenty of good-enough
  // ones — a deep same-model set shouldn't read "low" just for trim spread.
  if (strong >= 5 || good >= 10) {
    return {
      level: "medium",
      reasons: [`${good} comparable listings found. Use this as a negotiation benchmark, not an exact appraisal.`],
    };
  }
  return {
    level: "low",
    reasons: [
      comps.length > 0
        ? "Limited comparable inventory found. Use this as a directional estimate."
        : "Not enough comparable listings to build a reliable range.",
    ],
  };
}
