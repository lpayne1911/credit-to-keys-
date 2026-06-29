/**
 * Canonical SAMPLE MarketCheck report — built through the REAL engine (mock
 * source + buildMarketSnapshot) so it stays forward-compatible with live data.
 * Powers the /market-check demo and tests. Tuned to read "slightly above
 * market" (asking ≈ median + $450), matching the product vision.
 */
import { buildMockMarket } from "@/lib/sources/marketcheck/mock";
import { buildMarketSnapshot } from "@/lib/market-engine/buildMarketSnapshot";
import type { MarketCheckRequest, MarketCheckResponse } from "@/lib/sources/marketcheck/types";

const REQUEST: MarketCheckRequest = {
  vin: "2T3P1RFV3RW456789",
  year: 2024,
  make: "Toyota",
  model: "RAV4",
  trim: "XLE AWD",
  mileage: 18_742,
  condition: "used",
  zipCode: "80202",
  radiusMiles: 75,
};

const META = {
  id: "mc_sample",
  fetchedAt: "2024-05-14T09:42:00.000Z",
  expiresAt: "2024-05-14T17:42:00.000Z",
};

const mock = buildMockMarket(REQUEST);
// Median first (no asking), then position the sample asking just above it.
const pre = buildMarketSnapshot(mock.comps, REQUEST, META);
const asking = (pre.marketMedian ?? 30_300) + 450;
const snapshot = buildMarketSnapshot(mock.comps, { ...REQUEST, dealerAskingPrice: asking }, META);

export const SAMPLE_MARKET_RESPONSE: MarketCheckResponse = {
  vehicle: { ...mock.identity, vin: REQUEST.vin, mileage: REQUEST.mileage, trim: REQUEST.trim },
  snapshot,
  comparableListings: [...mock.comps].sort((a, b) => b.matchScore - a.matchScore),
  trend: mock.trend,
  dealerInsight: mock.dealerInsight,
  takeaways: [
    "Price is about $450 above the local median — this is a price-risk signal and a negotiation point.",
    "This trim appears commonly available nearby — more supply may give you leverage.",
    "This listing has been active for 27 days — aging inventory may improve your position.",
    "Ask for an out-the-door breakdown before discussing the monthly payment.",
  ],
  source: { provider: "marketcheck", fetchedAt: META.fetchedAt, snapshotId: META.id, isMock: true },
};
