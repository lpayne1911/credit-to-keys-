/**
 * Pure aggregation of recently-removed / sold listings into a weekly price
 * trend. Kept separate from the connector so it's testable without the network,
 * and so the live path degrades safely: thin or undated data → null, and the
 * report shows the real price-distribution instead.
 */
import type { MarketTrend, PriceTrendPoint } from "@/lib/sources/marketcheck/types";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** One recently-sold/removed listing: a price and the date it left the market. */
export interface DatedPrice {
  price: number;
  date: string; // ISO date
}

export interface HistoryResult {
  points: PriceTrendPoint[];
  trendDirection: MarketTrend["trendDirection"];
}

function weekIndex(iso: string): number | null {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? Math.floor(t / WEEK_MS) : null;
}

/**
 * Bucket dated prices by week and emit an ascending trend. Returns null unless
 * at least `minBuckets` weeks each have at least `minPerBucket` listings — so a
 * sparse or unreliable series never becomes a fabricated-looking chart.
 */
export function buildHistoryPoints(
  rows: DatedPrice[],
  opts: { minPerBucket?: number; minBuckets?: number } = {},
): HistoryResult | null {
  const minPerBucket = opts.minPerBucket ?? 2;
  const minBuckets = opts.minBuckets ?? 2;

  const groups = new Map<number, { sum: number; count: number; firstIso: string }>();
  for (const r of rows) {
    if (!(r?.price > 0)) continue;
    const wk = weekIndex(r.date);
    if (wk == null) continue;
    const g = groups.get(wk);
    if (g) {
      g.sum += r.price;
      g.count += 1;
      if (r.date < g.firstIso) g.firstIso = r.date;
    } else {
      groups.set(wk, { sum: r.price, count: 1, firstIso: r.date });
    }
  }

  const points: PriceTrendPoint[] = [...groups.entries()]
    .filter(([, g]) => g.count >= minPerBucket)
    .sort((a, b) => a[0] - b[0])
    .map(([, g]) => ({
      date: g.firstIso.slice(0, 10),
      price: Math.round(g.sum / g.count / 50) * 50,
      count: g.count,
    }));

  if (points.length < minBuckets) return null;

  const first = points[0].price;
  const last = points[points.length - 1].price;
  const delta = first > 0 ? (last - first) / first : 0;
  const trendDirection: MarketTrend["trendDirection"] =
    delta > 0.01 ? "rising" : delta < -0.01 ? "decreasing" : "flat";

  return { points, trendDirection };
}
