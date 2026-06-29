/**
 * runMarketCheck — the single entry point for the market-intelligence layer.
 * Tries the real MarketCheck connector; falls back to deterministic mock when
 * there's no API key or no usable result. Returns the normalized
 * MarketCheckResponse the UI + fairness engine consume.
 */
import {
  fetchActiveListings,
  decodeVin,
} from "@/lib/sources/marketcheck/connector";
import { normalizeListings, mergeSpecs, vehicleIdentityFromRequest, backfillIdentityFromListings } from "@/lib/sources/marketcheck/normalize";
import { buildMockMarket } from "@/lib/sources/marketcheck/mock";
import type {
  ComparableListing,
  DealerMarketInsight,
  MarketCheckRequest,
  MarketCheckResponse,
  MarketTrend,
  VehicleIdentity,
} from "@/lib/sources/marketcheck/types";
import { buildMarketSnapshot, MARKET_STATUS_LABEL } from "./buildMarketSnapshot";

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function deriveTrendFromComps(comps: ComparableListing[], numFound: number): MarketTrend {
  // Clamp DOM outliers (a 600-day stale listing shouldn't drag the average).
  const doms = comps.map((c) => c.daysOnMarket ?? 0).filter((d) => d > 0 && d <= 365);
  const avgDom = doms.length ? Math.round(doms.reduce((a, b) => a + b, 0) / doms.length) : 0;
  const prices = comps.map((c) => c.listPrice).filter((p) => p > 0);
  const cheapest = comps
    .filter((c) => c.listPrice > 0)
    .reduce<ComparableListing | null>((b, c) => (b == null || c.listPrice < b.listPrice ? c : b), null);
  const supply = numFound || comps.length;
  return {
    // No time-series history endpoint this pass — leave points empty; the report
    // hides the chart rather than fabricating a trend line.
    points: [],
    trendDirection: "flat",
    avgDaysOnMarket: avgDom,
    activeListings: supply,
    priceDrops7d: 0,
    bestNearbyDeal: prices.length ? Math.min(...prices) : null,
    bestNearbyDistanceMiles: cheapest?.distanceMiles ?? null,
    supplyLevel: supply >= 30 ? "high" : supply >= 12 ? "moderate" : "low",
    demandLevel: "moderate",
  };
}

/** Market-level dealer/inventory context derived from the comp set. Dealer-
 *  specific fields (similar-at-dealer, price rank) need a known dealer, so they
 *  stay null and the report hides those rows — we never fabricate them. */
function deriveDealerInsight(
  comps: ComparableListing[],
  trend: MarketTrend,
): DealerMarketInsight | null {
  if (comps.length === 0) return null;
  const competition = trend.supplyLevel; // low | moderate | high
  const insight =
    competition === "high"
      ? `${trend.activeListings} comparable listings are active nearby — strong supply tends to favor buyers.`
      : competition === "low"
        ? "Comparable inventory is thin nearby, which can reduce your negotiating leverage."
        : `${trend.activeListings} comparable listings are active nearby — a balanced local market.`;
  return {
    similarAtDealer: null,
    avgPriceAtDealer: null,
    thisListingDaysOnMarket: null,
    priceRankAtDealer: null,
    localCompetition: competition,
    insight,
  };
}

function buildTakeaways(
  snapshot: ReturnType<typeof buildMarketSnapshot>,
  trend: MarketTrend,
  dealer: DealerMarketInsight | null,
): string[] {
  const out: string[] = [];
  const diff = snapshot.differenceVsMedian;
  if (diff != null && snapshot.marketMedian) {
    if (diff > 100) {
      out.push(`Price is about ${money(diff)} above the local median — this is a price-risk signal and a negotiation point.`);
    } else if (diff < -100) {
      out.push(`Price is about ${money(Math.abs(diff))} below the local median — a strong starting point. Confirm condition and history.`);
    } else {
      out.push("Price is close to the local median — reasonable, but still ask for an out-the-door breakdown.");
    }
  } else if (snapshot.marketStatus === "insufficient_data") {
    out.push("Not enough comparable listings to build a reliable range — treat this as directional only.");
  }
  if (trend.supplyLevel === "high") {
    out.push("This trim appears commonly available nearby — more supply may give you leverage.");
  }
  const dom = dealer?.thisListingDaysOnMarket ?? 0;
  if (dom >= 21) {
    out.push(`This listing has been active for ${dom} days — aging inventory may improve your position.`);
  }
  out.push("Ask for an out-the-door breakdown before discussing the monthly payment — market price is only one part of the deal.");
  if (snapshot.confidence.level === "low") {
    out.push("Comparable inventory is thin, so use this as a directional estimate, not an exact appraisal.");
  }
  return out;
}

export async function runMarketCheck(request: MarketCheckRequest): Promise<MarketCheckResponse> {
  const fetchedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
  const id = `mc_${crypto.randomUUID()}`;

  let identity: VehicleIdentity = vehicleIdentityFromRequest(request);
  let comps: ComparableListing[] = [];
  let trend: MarketTrend;
  let dealerInsight: DealerMarketInsight | null = null;
  let isMock = false;

  const raw = await fetchActiveListings(request);
  if (raw && (raw.listings?.length ?? 0) > 0) {
    // Resolve the target identity BEFORE scoring comps. A VIN-only request has
    // no year/make/model, so decode the VIN and backfill from the listings —
    // otherwise every comp is scored against an empty target and reads "poor".
    if (request.vin) {
      const specs = await decodeVin(request.vin);
      identity = mergeSpecs(identity, specs);
    }
    identity = backfillIdentityFromListings(identity, raw.listings ?? []);
    comps = normalizeListings(raw, identity);
    trend = deriveTrendFromComps(comps, raw.num_found ?? comps.length);
    dealerInsight = deriveDealerInsight(comps, trend);
  } else {
    trend = deriveTrendFromComps([], 0); // placeholder; replaced below by mock
  }

  if (comps.length < 3) {
    const m = buildMockMarket(request);
    identity = m.identity;
    comps = m.comps;
    trend = m.trend;
    dealerInsight = m.dealerInsight;
    isMock = true;
  }

  comps = [...comps].sort((a, b) => b.matchScore - a.matchScore);
  const snapshot = buildMarketSnapshot(comps, request, { id, fetchedAt, expiresAt });
  const takeaways = buildTakeaways(snapshot, trend, dealerInsight);

  return {
    vehicle: identity,
    snapshot,
    comparableListings: comps,
    trend,
    dealerInsight,
    takeaways,
    source: { provider: "marketcheck", fetchedAt, snapshotId: id, isMock },
  };
}

export { MARKET_STATUS_LABEL };
