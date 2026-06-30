/**
 * NHTSA normalizers — pure, unit-tested mappers from raw NHTSA JSON to the
 * normalized {@link Recall} / {@link SafetyRating} shapes. No network here.
 */
import type {
  RawRatingDetail,
  RawRecall,
  RawRecallsResponse,
} from "./connector";
import type { Recall, SafetyRating } from "./types";

function clean(s: string | undefined): string {
  return (s ?? "").trim();
}

/** NCAP ratings come back as strings like "5", "Not Rated", or "". Map to a
 *  1–5 number, or null when not rated / unparseable. */
export function parseStar(s: string | undefined): number | null {
  const n = Number(clean(s));
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}

/** Map one raw recall row to the normalized shape. */
function parseRecall(raw: RawRecall): Recall {
  const date = clean(raw.ReportReceivedDate);
  return {
    campaignId: clean(raw.NHTSACampaignNumber),
    component: clean(raw.Component),
    summary: clean(raw.Summary),
    consequence: clean(raw.Consequence),
    remedy: clean(raw.Remedy),
    reportDate: date || null,
  };
}

/** Map the recalls response to a clean list. Empty array when none/failed —
 *  an honest "no open recalls reported", never fabricated. */
export function parseRecalls(raw: RawRecallsResponse | null): Recall[] {
  const rows = raw?.results ?? raw?.Results ?? [];
  if (!rows.length) return [];
  return rows
    .map(parseRecall)
    .filter((r) => r.campaignId || r.component || r.summary);
}

/** Map the NCAP detail to stars, or null when nothing is actually rated. */
export function parseRating(raw: RawRatingDetail | null): SafetyRating | null {
  if (!raw) return null;
  const rating: SafetyRating = {
    overall: parseStar(raw.OverallRating),
    frontCrash: parseStar(raw.OverallFrontCrashRating),
    sideCrash: parseStar(raw.OverallSideCrashRating),
    rollover: parseStar(raw.RolloverRating),
  };
  const hasAny =
    rating.overall != null ||
    rating.frontCrash != null ||
    rating.sideCrash != null ||
    rating.rollover != null;
  return hasAny ? rating : null;
}
