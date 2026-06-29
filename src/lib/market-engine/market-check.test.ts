import { describe, it, expect, afterEach } from "vitest";
import { scoreComparableListing, selectBestComps } from "@/lib/sources/marketcheck/filters";
import { getMarketConfidence } from "@/lib/sources/marketcheck/confidence";
import { buildMarketSnapshot } from "./buildMarketSnapshot";
import { runMarketCheck } from "./runMarketCheck";
import type { ComparableListing } from "@/lib/sources/marketcheck/types";

const TARGET = { year: 2024, make: "Toyota", model: "RAV4", trim: "XLE", mileage: 18_000 };

function comp(listPrice: number, matchScore = 90): ComparableListing {
  return {
    sourceListingId: `c-${listPrice}-${matchScore}`,
    year: 2024, make: "Toyota", model: "RAV4", trim: "XLE",
    mileage: 18_000, listPrice, matchQuality: "very_good", matchScore, reasons: [],
  };
}

const META = { id: "t", fetchedAt: "2024-01-01T00:00:00Z", expiresAt: "2024-01-01T08:00:00Z" };

describe("scoreComparableListing", () => {
  it("scores an identical vehicle as excellent", () => {
    const r = scoreComparableListing(TARGET, { ...TARGET, distanceMiles: 10 });
    expect(r.score).toBe(100);
    expect(r.quality).toBe("excellent");
  });
  it("penalizes different model and far mileage", () => {
    const r = scoreComparableListing(TARGET, { year: 2024, make: "Toyota", model: "Camry", mileage: 60_000, distanceMiles: 10 });
    expect(r.score).toBeLessThan(70); // -30 model, -25 mileage
    expect(["fair", "poor"]).toContain(r.quality);
  });
});

describe("selectBestComps", () => {
  it("keeps strong comps when there are enough", () => {
    const comps = [comp(28_000), comp(29_000), comp(30_000), comp(31_000), comp(32_000)];
    expect(selectBestComps(comps)).toHaveLength(5);
  });
});

describe("getMarketConfidence", () => {
  it("scales with strong-comp depth", () => {
    expect(getMarketConfidence(Array(16).fill(comp(30_000, 85))).level).toBe("high");
    expect(getMarketConfidence(Array(6).fill(comp(30_000, 85))).level).toBe("medium");
    expect(getMarketConfidence(Array(2).fill(comp(30_000, 85))).level).toBe("low");
  });
});

describe("buildMarketSnapshot", () => {
  it("computes range/median/status from comps + asking price", () => {
    const comps = [comp(28_000), comp(29_000), comp(30_000), comp(31_000), comp(32_000)];
    const s = buildMarketSnapshot(comps, { ...TARGET, dealerAskingPrice: 31_000, radiusMiles: 75 }, META);
    expect(s.marketMedian).toBe(30_000);
    expect(s.differenceVsMedian).toBe(1_000);
    expect(s.marketStatus).toBe("above_market");
    expect(s.confidence.level).toBe("medium"); // 5 strong comps → medium
  });
  it("returns insufficient_data with too few comps", () => {
    const s = buildMarketSnapshot([comp(30_000)], { ...TARGET }, META);
    expect(s.marketStatus).toBe("insufficient_data");
    expect(s.marketMedian).toBeNull();
  });
});

describe("runMarketCheck (mock fallback, no key)", () => {
  const KEY = "MARKETCHECK_API_KEY";
  const original = process.env[KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it("returns a deterministic mock snapshot when no key is set", async () => {
    delete process.env[KEY];
    const r = await runMarketCheck({ ...TARGET, zipCode: "80202", dealerAskingPrice: 31_200, radiusMiles: 75 });
    expect(r.source.isMock).toBe(true);
    expect(r.comparableListings.length).toBeGreaterThan(10);
    expect(r.snapshot.marketMedian).toBeGreaterThan(0);
    expect(r.takeaways.length).toBeGreaterThan(0);
  });
});
