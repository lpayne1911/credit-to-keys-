/**
 * Build a normalized MarketSnapshot from scored comparable listings. Pure (no
 * Date/network) — ids/timestamps are passed in so it's deterministic to test.
 */
import type {
  ComparableListing,
  MarketCheckRequest,
  MarketSnapshot,
  MarketStatus,
} from "@/lib/sources/marketcheck/types";
import { getMarketConfidence } from "@/lib/sources/marketcheck/confidence";
import { selectBestComps } from "@/lib/sources/marketcheck/filters";

function round50(n: number): number {
  return Math.max(0, Math.round(n / 50) * 50);
}

/** Linear-interpolated percentile over a sorted ascending number list. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface SnapshotMeta {
  id: string;
  fetchedAt: string;
  expiresAt: string;
}

export function buildMarketSnapshot(
  allComps: ComparableListing[],
  request: MarketCheckRequest,
  meta: SnapshotMeta,
): MarketSnapshot {
  const best = selectBestComps(allComps);
  const prices = best.map((c) => c.listPrice).filter((n) => n > 0).sort((a, b) => a - b);
  const confidence = getMarketConfidence(allComps);
  const asking = request.dealerAskingPrice ?? null;

  if (prices.length < 3) {
    return {
      id: meta.id,
      source: "marketcheck",
      fetchedAt: meta.fetchedAt,
      expiresAt: meta.expiresAt,
      searchParams: request,
      listingCount: allComps.length,
      comparableCount: best.length,
      marketLow: prices.length ? round50(prices[0]) : null,
      marketMedian: null,
      marketHigh: prices.length ? round50(prices[prices.length - 1]) : null,
      targetPrice: null,
      dealerAskingPrice: asking,
      differenceVsMedian: null,
      differencePercent: null,
      marketStatus: "insufficient_data",
      confidence,
    };
  }

  const low = round50(percentile(prices, 0.1));
  const median = round50(percentile(prices, 0.5));
  const high = round50(percentile(prices, 0.9));
  const target = round50(percentile(prices, 0.25)); // a realistically achievable price

  let differenceVsMedian: number | null = null;
  let differencePercent: number | null = null;
  let marketStatus: MarketStatus = "fair_market";
  if (asking != null && asking > 0) {
    differenceVsMedian = Math.round(asking - median);
    differencePercent = Math.round((differenceVsMedian / median) * 1000) / 10;
    const pct = differenceVsMedian / median;
    marketStatus =
      asking < low || pct <= -0.03
        ? "below_market"
        : pct <= 0
          ? "fair_market"
          : pct <= 0.02
            ? "slightly_above_market"
            : pct <= 0.06
              ? "above_market"
              : "high_over_market";
  }

  return {
    id: meta.id,
    source: "marketcheck",
    fetchedAt: meta.fetchedAt,
    expiresAt: meta.expiresAt,
    searchParams: request,
    listingCount: allComps.length,
    comparableCount: best.length,
    marketLow: low,
    marketMedian: median,
    marketHigh: high,
    targetPrice: target,
    dealerAskingPrice: asking,
    differenceVsMedian,
    differencePercent,
    marketStatus,
    confidence,
  };
}

/** Plain-English label for a market status (buyer-facing, never accusatory). */
export const MARKET_STATUS_LABEL: Record<MarketStatus, string> = {
  below_market: "Below market",
  fair_market: "Fair market",
  slightly_above_market: "Slightly above market",
  above_market: "Above market",
  high_over_market: "High over market",
  insufficient_data: "Not enough comps",
};
