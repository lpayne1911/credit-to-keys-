/**
 * Pure market-signal helpers derived from the comparable listings we already
 * fetch — no extra MarketCheck endpoint, no fabrication. Each degrades to a safe
 * value on thin/empty input.
 */

export interface PriceBucket {
  lowEdge: number;
  highEdge: number;
  count: number;
}

/** Bucket comp prices into a histogram for the price-distribution chart.
 *  Returns [] when there isn't a usable spread (fewer than 2 distinct prices). */
export function buildPriceDistribution(prices: number[], buckets = 6): PriceBucket[] {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (valid.length < 2) return [];
  const min = valid[0];
  const max = valid[valid.length - 1];
  if (max <= min) return [];
  const n = Math.max(1, Math.floor(buckets));
  const width = (max - min) / n;
  const out: PriceBucket[] = Array.from({ length: n }, (_, i) => ({
    lowEdge: Math.round(min + i * width),
    highEdge: Math.round(min + (i + 1) * width),
    count: 0,
  }));
  for (const p of valid) {
    // Clamp the top edge into the last bucket so `max` is counted.
    const idx = Math.min(n - 1, Math.floor((p - min) / width));
    out[idx].count += 1;
  }
  return out;
}

/** Demand proxy from average days-on-market: faster-selling inventory implies
 *  stronger demand. Returns "moderate" when DOM is unknown (never guesses high). */
export function demandFromDom(avgDom: number): "low" | "moderate" | "high" {
  if (!(avgDom > 0)) return "moderate";
  return avgDom <= 30 ? "high" : avgDom <= 60 ? "moderate" : "low";
}

/** Rank a reference price among nearby comp prices (1 = cheaper than every comp).
 *  `of` counts the subject vehicle alongside the comps. Null on unusable input. */
export function rankAmong(price: number, compPrices: number[]): { rank: number; of: number } | null {
  if (!(price > 0)) return null;
  const valid = compPrices.filter((p) => Number.isFinite(p) && p > 0);
  if (valid.length === 0) return null;
  const cheaper = valid.filter((p) => p < price).length;
  return { rank: cheaper + 1, of: valid.length + 1 };
}
