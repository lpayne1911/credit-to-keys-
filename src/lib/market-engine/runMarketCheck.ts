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
import { normalizeListings, mergeSpecs, vehicleIdentityFromRequest } from "@/lib/sources/marketcheck/normalize";
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
  const doms = comps.map((c) => c.daysOnMarket ?? 0).filter((d) => d > 0);
  const avgDom = doms.length ? Math.round(doms.reduce((a, b) => a + b, 0) / doms.length) : 0;
  const prices = comps.map((c) => c.listPrice);
  return {
    points: [], // live history endpoint not wired this pass
    trendDirection: "flat",
    avgDaysOnMarket: avgDom,
    activeListings: numFound || comps.length,
    priceDrops7d: 0,
    bestNearbyDeal: prices.length ? Math.min(...prices) : null,
    bestNearbyDistanceMiles: comps.length ? comps.reduce((b, c) => (c.listPrice < b.listPrice ? c : b)).distanceMiles ?? null : null,
    supplyLevel: (numFound || comps.length) >= 30 ? "high" : (numFound || comps.length) >= 12 ? "moderate" : "low",
    demandLevel: "moderate",
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
    comps = normalizeListings(raw, identity);
    if (request.vin) {
      const specs = await decodeVin(request.vin);
      identity = mergeSpecs(identity, specs);
    }
    trend = deriveTrendFromComps(comps, raw.num_found ?? comps.length);
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
