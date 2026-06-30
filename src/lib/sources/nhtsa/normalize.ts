/**
 * NHTSA normalizers — pure, unit-tested mappers from raw NHTSA JSON to the
 * normalized {@link Recall} / {@link SafetyRating} shapes. No network here.
 */
import type {
  RawRatingDetail,
  RawRecall,
  RawRecallsResponse,
} from "./connector";
import type { Recall, SafetyRating, SafetySignals } from "./types";

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

/** NHTSA report dates are DD/MM/YYYY. Parse to a sortable timestamp; unparseable
 *  dates sort last (0). */
function recallDateValue(date: string | null): number {
  if (!date) return 0;
  const parts = date.split("/");
  if (parts.length !== 3) return 0;
  const [dd, mm, yyyy] = parts.map((p) => Number(p));
  if (!yyyy || !mm || mm > 12) return 0;
  return new Date(yyyy, mm - 1, dd || 1).getTime();
}

/** Map the recalls response to a clean list, newest first. Empty array when
 *  none/failed — an honest "no recalls on record", never fabricated. The order
 *  matters because the card caps the list, so the most recent should win. */
export function parseRecalls(raw: RawRecallsResponse | null): Recall[] {
  const rows = raw?.results ?? raw?.Results ?? [];
  if (!rows.length) return [];
  return rows
    .map(parseRecall)
    .filter((r) => r.campaignId || r.component || r.summary)
    .sort((a, b) => recallDateValue(b.reportDate) - recallDateValue(a.reportDate));
}

function count(n: number | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : null;
}

function equip(s: string | undefined): string | null {
  const v = clean(s);
  return v ? v : null;
}

/** Map the vehicle-level signals (complaints, investigations, driver-assist
 *  equipment) from the same NCAP detail. Null when nothing is reported — an
 *  honest blank, never fabricated. */
export function parseSignals(raw: RawRatingDetail | null): SafetySignals | null {
  if (!raw) return null;
  const signals: SafetySignals = {
    complaints: count(raw.ComplaintsCount),
    investigations: count(raw.InvestigationCount),
    forwardCollisionWarning: equip(raw.NHTSAForwardCollisionWarning),
    laneDepartureWarning: equip(raw.NHTSALaneDepartureWarning),
    electronicStabilityControl: equip(raw.NHTSAElectronicStabilityControl),
  };
  const hasAny =
    signals.complaints != null ||
    signals.investigations != null ||
    signals.forwardCollisionWarning != null ||
    signals.laneDepartureWarning != null ||
    signals.electronicStabilityControl != null;
  return hasAny ? signals : null;
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
