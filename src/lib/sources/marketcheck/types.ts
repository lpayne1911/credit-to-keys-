/**
 * MarketCheck market-intelligence layer — normalized types.
 *
 * The app never renders raw MarketCheck JSON. The connector fetches it, the
 * normalizer maps it into these shapes, the market-engine scores it, and the UI
 * + fairness engine consume only the normalized model. This keeps MarketCheck a
 * swappable data SOURCE behind a stable internal contract.
 */

export type MarketConfidenceLevel = "low" | "medium" | "high";

export interface MarketConfidence {
  level: MarketConfidenceLevel;
  reasons: string[];
}

export type MatchQuality = "poor" | "fair" | "good" | "very_good" | "excellent";

export type MarketStatus =
  | "below_market"
  | "fair_market"
  | "slightly_above_market"
  | "above_market"
  | "high_over_market"
  | "insufficient_data";

export interface VehicleIdentity {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  vin?: string | null;
  mileage?: number | null;
  bodyStyle?: string | null;
  drivetrain?: string | null;
  engine?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  exterior?: string | null;
  interior?: string | null;
  msrp?: number | null;
  keyFeatures?: string[];
  /** How confidently we resolved trim/equipment (drives a "confirm trim" nudge). */
  identityConfidence?: MarketConfidenceLevel;
}

export interface ComparableListing {
  sourceListingId: string;
  vin?: string | null;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  listPrice: number;
  dealerName?: string | null;
  dealerZip?: string | null;
  distanceMiles?: number | null;
  daysOnMarket?: number | null;
  url?: string | null;
  matchQuality: MatchQuality;
  matchScore: number;
  reasons: string[];
}

export interface PriceTrendPoint {
  /** ISO date (week bucket). */
  date: string;
  price: number;
  count: number;
}

export interface MarketTrend {
  points: PriceTrendPoint[];
  trendDirection: "rising" | "flat" | "decreasing";
  avgDaysOnMarket: number;
  activeListings: number;
  priceDrops7d: number;
  bestNearbyDeal: number | null;
  bestNearbyDistanceMiles: number | null;
  supplyLevel: "low" | "moderate" | "high";
  demandLevel: "low" | "moderate" | "high";
  /** Extra market-summary context (set by the mock; optional from live data). */
  seasonality?: string;
  bestTimeToBuy?: string;
  /** Small "+3 vs last 30 days" style deltas for the stat tiles (optional). */
  avgDomNote?: string;
  activeListingsNote?: string;
  priceDropsNote?: string;
}

export interface DealerMarketInsight {
  dealerName?: string | null;
  similarAtDealer?: number | null;
  avgPriceAtDealer?: number | null;
  thisListingDaysOnMarket?: number | null;
  priceRankAtDealer?: { rank: number; of: number } | null;
  localCompetition?: "low" | "moderate" | "high" | null;
  insight?: string | null;
}

export interface MarketSnapshot {
  id: string;
  source: "marketcheck";
  fetchedAt: string;
  /** Cache horizon — purely informational this pass (no DB persistence yet). */
  expiresAt: string;
  searchParams: MarketCheckRequest;
  listingCount: number;
  comparableCount: number;
  marketLow: number | null;
  marketMedian: number | null;
  marketHigh: number | null;
  targetPrice: number | null;
  dealerAskingPrice?: number | null;
  differenceVsMedian?: number | null;
  differencePercent?: number | null;
  marketStatus: MarketStatus;
  confidence: MarketConfidence;
}

export interface MarketCheckRequest {
  vin?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  mileage?: number | null;
  condition?: "new" | "used" | "cpo";
  zipCode?: string | null;
  radiusMiles?: number;
  /** Optional dealer asking price to position against the market. */
  dealerAskingPrice?: number | null;
}

export interface MarketCheckResponse {
  vehicle: VehicleIdentity;
  snapshot: MarketSnapshot;
  comparableListings: ComparableListing[];
  trend: MarketTrend;
  dealerInsight: DealerMarketInsight | null;
  takeaways: string[];
  source: {
    provider: "marketcheck";
    fetchedAt: string;
    snapshotId: string;
    /** True when served from mock.ts (no API key / no result). */
    isMock: boolean;
  };
}
