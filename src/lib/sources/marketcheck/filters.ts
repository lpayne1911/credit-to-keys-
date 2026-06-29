/**
 * Comparable-listing match scoring. Not every listing is a valid comp — scoring
 * keeps the market range honest. Pure + unit-tested.
 */
import type { ComparableListing, MatchQuality, VehicleIdentity } from "./types";

export interface ScorableListing {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  distanceMiles?: number | null;
}

export interface CompScore {
  score: number;
  quality: MatchQuality;
  reasons: string[];
}

function eqi(a?: string | null, b?: string | null): boolean {
  return (a ?? "").trim().toLowerCase() === (b ?? "").trim().toLowerCase();
}

/** Score one listing against the target vehicle (0–100 → match quality). */
export function scoreComparableListing(
  target: Pick<VehicleIdentity, "year" | "make" | "model" | "trim" | "mileage">,
  listing: ScorableListing,
): CompScore {
  let score = 100;
  const reasons: string[] = [];

  if (listing.year !== target.year) {
    score -= 15;
    reasons.push("different model year");
  }
  if (!eqi(listing.make, target.make)) {
    score -= 30;
    reasons.push("different make");
  }
  if (!eqi(listing.model, target.model)) {
    score -= 30;
    reasons.push("different model");
  }
  if (target.trim && listing.trim && !eqi(listing.trim, target.trim)) {
    score -= 20;
    reasons.push("different trim");
  }
  if (target.mileage && listing.mileage) {
    const delta = Math.abs(listing.mileage - target.mileage);
    if (delta > 30_000) {
      score -= 25;
      reasons.push("mileage far from yours");
    } else if (delta > 15_000) {
      score -= 15;
      reasons.push("mileage moderately different");
    } else if (delta > 7_500) {
      score -= 8;
      reasons.push("mileage slightly different");
    }
  }
  if (listing.distanceMiles && listing.distanceMiles > 100) {
    score -= 10;
    reasons.push("outside the local radius");
  }

  score = Math.max(0, Math.min(100, score));
  const quality: MatchQuality =
    score >= 90 ? "excellent" : score >= 80 ? "very_good" : score >= 70 ? "good" : score >= 60 ? "fair" : "poor";
  if (reasons.length === 0) reasons.push("close match on year, trim, and mileage");
  return { score, quality, reasons };
}

/** Strong comps (score ≥ 80) used for the headline range — unless too few, in
 * which case fall back to good+ (≥70), then to all, so we always show something. */
export function selectBestComps(comps: ComparableListing[]): ComparableListing[] {
  const strong = comps.filter((c) => c.matchScore >= 80);
  if (strong.length >= 5) return strong;
  const good = comps.filter((c) => c.matchScore >= 70);
  if (good.length >= 3) return good;
  return comps;
}
