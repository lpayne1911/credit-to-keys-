/**
 * VinAudit normalizer — pure, unit-tested. Maps the raw NMVTIS response to the
 * normalized {@link TitleHistory}. No network here. Reads defensively so a shape
 * surprise degrades to a safe value rather than throwing.
 */
import type {
  RawBrand,
  RawTitleRecord,
  RawVinAuditResponse,
} from "./connector";
import type { TitleBrand, TitleHistory } from "./types";

/** Brand keywords that signal a damaged / compromised title. */
const NEGATIVE_BRAND =
  /salvage|junk|flood|water|rebuilt|reconstruct|lemon|fire|hail|total\s*loss|dismantl|non.?repairable|damage|scrap|odometer|not\s*actual/i;

function clean(s: string | undefined): string {
  return (s ?? "").trim();
}

function prettify(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function toNumber(v: number | string | undefined): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function isNegative(b: RawBrand): boolean {
  return NEGATIVE_BRAND.test(`${clean(b.label)} ${clean(b.code)}`);
}

function parseBrands(brands: RawBrand[] | undefined): TitleBrand[] {
  return (brands ?? [])
    .map((b) => {
      const raw = clean(b.label) || clean(b.code);
      return raw
        ? { label: prettify(raw), state: clean(b.state) || null, date: clean(b.date) || null }
        : null;
    })
    .filter((b): b is TitleBrand => b !== null);
}

/** Detect a likely odometer rollback: a later-dated reading materially lower
 *  than an earlier one. Best-effort; false when it can't be determined. */
function detectRollback(titles: RawTitleRecord[] | undefined): boolean {
  const readings = (titles ?? [])
    .map((t) => ({ date: clean(t.date), meter: toNumber(t.meter) }))
    .filter((r): r is { date: string; meter: number } => Boolean(r.date) && r.meter != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  let maxSoFar = 0;
  for (const r of readings) {
    if (r.meter + 500 < maxSoFar) return true; // dropped materially over time
    if (r.meter > maxSoFar) maxSoFar = r.meter;
  }
  return false;
}

/** Most recent odometer reading (prefer the `current` record, else latest date). */
function lastOdometer(titles: RawTitleRecord[] | undefined): number | null {
  const rows = (titles ?? []).filter((t) => toNumber(t.meter) != null);
  if (rows.length === 0) return null;
  const current = rows.find((t) => t.current);
  if (current) return toNumber(current.meter);
  const latest = [...rows].sort((a, b) => clean(b.date).localeCompare(clean(a.date)))[0];
  return toNumber(latest.meter);
}

/**
 * Map the raw VinAudit response to normalized title history. Returns null only
 * when the response is unusable (missing / API error) — a *successful* response
 * for a clean VIN returns a report with `branded: false` so the UI can show the
 * reassuring "clean title" state. Never fabricates.
 */
export function parseTitleHistory(
  raw: RawVinAuditResponse | null,
): Omit<TitleHistory, "source"> | null {
  if (!raw || raw.success === false || raw.error) return null;

  const brands = parseBrands(raw.brands);
  const jsi = raw.jsi ?? [];
  const jsiSalvage = jsi.some((r) => /salvage|junk/i.test(clean(r.type)));
  const totalLoss = jsi.some((r) => /insur|total/i.test(clean(r.type)));

  const branded = brands.some((b) => NEGATIVE_BRAND.test(b.label)) || jsiSalvage;
  const theftRecord = Array.isArray(raw.thefts) && raw.thefts.length > 0;

  return {
    branded,
    brands,
    totalLoss,
    theftRecord,
    odometerRollbackSuspected: detectRollback(raw.titles),
    titleRecordCount: Array.isArray(raw.titles) ? raw.titles.length : null,
    owners: typeof raw.owners === "number" ? raw.owners : null,
    lastOdometer: lastOdometer(raw.titles),
  };
}
