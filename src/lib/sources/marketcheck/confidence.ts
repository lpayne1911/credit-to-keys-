/**
 * Market confidence from comp depth. Every snapshot carries a confidence level
 * with a buyer-facing reason — a benchmark, never an exact appraisal.
 */
import type { ComparableListing, MarketConfidence } from "./types";

export function getMarketConfidence(comps: ComparableListing[]): MarketConfidence {
  const strong = comps.filter((c) => c.matchScore >= 80).length;
  if (strong >= 15) {
    return { level: "high", reasons: [`${strong} strong comparable listings found nearby.`] };
  }
  if (strong >= 5) {
    return {
      level: "medium",
      reasons: [`${strong} strong comparable listings found. Use this as a negotiation benchmark, not an exact appraisal.`],
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
