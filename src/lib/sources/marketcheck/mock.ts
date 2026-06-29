/**
 * Deterministic MOCK market source — used whenever there's no MARKETCHECK_API_KEY
 * (or a real call returns nothing). Lets the entire market-intelligence layer +
 * results page run in "sample-first" mode without the vendor. Same normalized
 * shapes as the real path, so swapping to live data is transparent.
 *
 * Deterministic by design: values derive from the request (no Math.random), so
 * the same vehicle always yields the same snapshot.
 */
import type {
  ComparableListing,
  DealerMarketInsight,
  MarketCheckRequest,
  MarketTrend,
  VehicleIdentity,
} from "./types";
import { scoreComparableListing } from "./filters";
import { vehicleIdentityFromRequest } from "./normalize";

const DEALERS = [
  "Groove Toyota",
  "Mile High Toyota",
  "Stevinson Toyota West",
  "AutoNation Toyota Arapahoe",
  "McDonald Toyota",
  "Larry H. Miller Toyota",
];

const OFFSETS = [
  -2300, -1800, -1450, -1100, -800, -500, -250, -50, 150, 350, 600, 850, 1100, 1400, 1700, 2000, 2300, 2600,
];

function basePrice(req: MarketCheckRequest): number {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - (req.year || currentYear));
  const miles = req.mileage ?? 30_000;
  const raw = 34_000 - age * 1_800 - (miles / 1_000) * 55;
  return Math.max(9_000, Math.min(90_000, Math.round(raw / 50) * 50));
}

export interface MockMarket {
  identity: VehicleIdentity;
  comps: ComparableListing[];
  trend: MarketTrend;
  dealerInsight: DealerMarketInsight;
}

export function buildMockMarket(req: MarketCheckRequest): MockMarket {
  const base = basePrice(req);
  const identity: VehicleIdentity = {
    ...vehicleIdentityFromRequest(req),
    bodyStyle: "SUV",
    drivetrain: "All-Wheel Drive",
    engine: "2.5L 4-Cyl. Hybrid",
    transmission: "eCVT",
    fuelType: "Hybrid (Gas/Electric)",
    msrp: base + 1_500,
    keyFeatures: ["Toyota Safety Sense", "8\" Touchscreen", "Heated Seats", "Blind Spot Monitor", "Power Liftgate"],
    identityConfidence: req.vin ? "high" : "medium",
  };

  const targetMiles = req.mileage ?? 30_000;
  const comps: ComparableListing[] = OFFSETS.map((off, i) => {
    const price = Math.max(5_000, base + off);
    const mileage = Math.max(2_000, targetMiles + ((i % 7) - 3) * 4_000);
    const distance = 6 + ((i * 9) % 70);
    const dom = 7 + ((i * 5) % 40);
    const sc = scoreComparableListing(identity, {
      year: identity.year,
      make: identity.make,
      model: identity.model,
      trim: identity.trim,
      mileage,
      distanceMiles: distance,
    });
    return {
      sourceListingId: `mock-${i}`,
      vin: null,
      year: identity.year,
      make: identity.make,
      model: identity.model,
      trim: identity.trim ?? null,
      mileage,
      listPrice: price,
      dealerName: DEALERS[i % DEALERS.length],
      dealerZip: req.zipCode ?? null,
      distanceMiles: distance,
      daysOnMarket: dom,
      url: null,
      matchQuality: sc.quality,
      matchScore: sc.score,
      reasons: sc.reasons,
    };
  });

  const now = new Date();
  const points = Array.from({ length: 8 }, (_, w) => {
    const d = new Date(now.getTime() - (7 - w) * 7 * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().slice(0, 10),
      price: base + 1_200 - w * 180,
      count: 8 + ((w * 2) % 7),
    };
  });
  const trend: MarketTrend = {
    points,
    trendDirection: "decreasing",
    avgDaysOnMarket: 26,
    activeListings: comps.length + 24,
    priceDrops7d: 6,
    bestNearbyDeal: Math.min(...comps.map((c) => c.listPrice)),
    bestNearbyDistanceMiles: 12,
    supplyLevel: "high",
    demandLevel: "moderate",
  };

  const dealerInsight: DealerMarketInsight = {
    dealerName: DEALERS[3],
    similarAtDealer: 17,
    avgPriceAtDealer: base + 250,
    thisListingDaysOnMarket: 27,
    priceRankAtDealer: { rank: 3, of: 17 },
    localCompetition: "high",
    insight: "This listing has been active for 27 days and similar vehicles are available nearby — that may improve your negotiating leverage.",
  };

  return { identity, comps, trend, dealerInsight };
}
