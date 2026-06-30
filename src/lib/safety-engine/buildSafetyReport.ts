/**
 * safety-engine — buildSafetyReport
 *
 * The single entry point for the NHTSA safety layer. Given a resolved vehicle
 * (year/make/model), fetches open recalls + NCAP crash ratings in parallel and
 * returns a normalized {@link SafetyReport}.
 *
 * REAL-OR-HIDDEN: returns null when there's nothing real to show (no recalls
 * AND no ratings, or the lookups failed). There is deliberately NO mock — unlike
 * pricing, fabricated safety data would be dangerous and misleading. Callers
 * render the card only when this returns a report.
 */
import {
  fetchRatingDetail,
  fetchRecalls,
  fetchSafetyVariants,
} from "@/lib/sources/nhtsa/connector";
import { parseRating, parseRecalls } from "@/lib/sources/nhtsa/normalize";
import type { SafetyRating, SafetyReport } from "@/lib/sources/nhtsa/types";

export async function buildSafetyReport(
  year: number | null | undefined,
  make: string | null | undefined,
  model: string | null | undefined,
): Promise<SafetyReport | null> {
  if (!year || !make || !model) return null;

  const [recallsRaw, variants] = await Promise.all([
    fetchRecalls(year, make, model),
    fetchSafetyVariants(year, make, model),
  ]);

  const recalls = parseRecalls(recallsRaw);

  let ratings: SafetyRating | null = null;
  const vehicleId = variants?.find((v) => typeof v.VehicleId === "number")?.VehicleId;
  if (typeof vehicleId === "number") {
    ratings = parseRating(await fetchRatingDetail(vehicleId));
  }

  // Nothing real to show → hide the card entirely (no fabricated fallback).
  if (recalls.length === 0 && !ratings) return null;

  return {
    recalls,
    ratings,
    source: { provider: "nhtsa", fetchedAt: new Date().toISOString() },
  };
}
