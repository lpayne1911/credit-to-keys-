/**
 * FRED normalizer — pure, unit-tested. Turns the raw observations series into a
 * national-average low/high APR band. No network here.
 */
import type { RawObservationsResponse } from "./connector";
import type { AprBenchmark } from "./types";

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Build a benchmark band from the recent observations. The latest value is the
 * center; the band spans the recent-year low to high, with at least ~1.5pts of
 * headroom above center so a normal rate isn't flagged as an overcharge.
 * Returns null when there's no usable observation (FRED uses "." for missing).
 */
export function parseAprBenchmark(
  raw: RawObservationsResponse | null,
  termMonths: number,
): AprBenchmark | null {
  const obs = (raw?.observations ?? [])
    .map((o) => ({ date: (o.date ?? "").trim(), value: Number(o.value) }))
    .filter((o) => o.date && Number.isFinite(o.value) && o.value > 0);
  if (obs.length === 0) return null;

  const values = obs.map((o) => o.value);
  const center = values[0];
  const low = Math.min(...values);
  const high = Math.max(Math.max(...values), center + 1.5);

  return {
    low: round1(low),
    high: round1(high),
    source: "fred",
    term: termMonths,
    asOf: obs[0].date,
  };
}
