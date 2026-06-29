import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { scoreComparableListing, selectBestComps } from "@/lib/sources/marketcheck/filters";
import { getMarketConfidence } from "@/lib/sources/marketcheck/confidence";
import { backfillIdentityFromListings, mergeSpecs, vehicleIdentityFromRequest } from "@/lib/sources/marketcheck/normalize";
import { fetchActiveListings } from "@/lib/sources/marketcheck/connector";
import { buildMarketSnapshot } from "./buildMarketSnapshot";
import { runMarketCheck } from "./runMarketCheck";
import type { ComparableListing, MarketCheckRequest } from "@/lib/sources/marketcheck/types";

function req(p: Partial<MarketCheckRequest> = {}): MarketCheckRequest {
  return {
    vin: null, year: null, make: null, model: null, trim: null, mileage: null,
    condition: "used", zipCode: null, radiusMiles: 75, dealerAskingPrice: null, ...p,
  };
}

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
  it("treats a deep good-comp set as at least medium (not low)", () => {
    // 0 strong (>=80) but plenty good (>=70) — a same-model set with trim spread.
    expect(getMarketConfidence(Array(12).fill(comp(30_000, 75))).level).toBe("medium");
    expect(getMarketConfidence(Array(25).fill(comp(30_000, 75))).level).toBe("high");
  });
});

describe("identity resolution (VIN-only all-poor regression)", () => {
  it("scores comps as poor against an empty target, but good once resolved", () => {
    const empty = vehicleIdentityFromRequest({ vin: "JTEBU5JRXK5656862" });
    const sameModel = { year: 2019, make: "Toyota", model: "4Runner", trim: "Limited" };
    // Before: empty target (year 0 / make "" / model "") → every real comp is "poor".
    expect(scoreComparableListing(empty, sameModel).quality).toBe("poor");
    // After: backfill identity from the listings the VIN search returned.
    const listings = [
      { build: { year: 2019, make: "Toyota", model: "4Runner", trim: "Limited" } },
      { build: { year: 2019, make: "Toyota", model: "4Runner", trim: "SR5" } },
      { build: { year: 2019, make: "Toyota", model: "4Runner", trim: "Limited" } },
    ];
    const resolved = backfillIdentityFromListings(empty, listings);
    expect(resolved.year).toBe(2019);
    expect(resolved.make).toBe("Toyota");
    expect(resolved.model).toBe("4Runner");
    expect(resolved.trim).toBe("Limited"); // modal of the listings
    expect(scoreComparableListing(resolved, sameModel).score).toBeGreaterThanOrEqual(80);
  });
  it("does not override an identity that already has year/make/model", () => {
    const known = vehicleIdentityFromRequest({ year: 2024, make: "Honda", model: "Civic" });
    const resolved = backfillIdentityFromListings(known, [
      { build: { year: 2019, make: "Toyota", model: "4Runner" } },
    ]);
    expect(resolved).toMatchObject({ year: 2024, make: "Honda", model: "Civic" });
  });
  it("mergeSpecs pulls year/make/model/trim from the VIN decode", () => {
    const merged = mergeSpecs(vehicleIdentityFromRequest({ vin: "X" }), {
      year: 2019, make: "Toyota", model: "4Runner", trim: "TRD Off-Road Premium",
    });
    expect(merged).toMatchObject({ year: 2019, make: "Toyota", model: "4Runner", trim: "TRD Off-Road Premium" });
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

  // Regression: a VIN search used to yield the SAME generic price for every
  // vehicle because the mock fell back without the vehicle's year. With the
  // year/make/model resolved, the mock price must vary by vehicle.
  it("mock price varies by vehicle (no constant-price regression)", async () => {
    delete process.env[KEY];
    const newer = await runMarketCheck(req({ year: 2024, make: "Toyota", model: "RAV4", zipCode: "80202" }));
    const older = await runMarketCheck(req({ year: 2016, make: "Toyota", model: "RAV4", zipCode: "80202" }));
    expect(newer.snapshot.marketMedian).not.toBe(older.snapshot.marketMedian);
    expect(newer.vehicle.year).toBe(2024);
    expect(older.vehicle.year).toBe(2016);
  });
});

describe("fetchActiveListings query (comparables, not the single VIN)", () => {
  const KEY = "MARKETCHECK_API_KEY";
  const original = process.env[KEY];
  let lastUrl = "";
  beforeEach(() => {
    process.env[KEY] = "test-key";
    lastUrl = "";
    vi.stubGlobal("fetch", async (url: unknown) => {
      lastUrl = String(url);
      return { ok: true, json: async () => ({ num_found: 0, listings: [] }) } as unknown as Response;
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it("queries by ymmt when year+make+model are known (even if a VIN is given)", async () => {
    await fetchActiveListings(req({ vin: "JTEBU5JRXK5656862", year: 2019, make: "Toyota", model: "4Runner", trim: "Limited", zipCode: "80202" }));
    expect(lastUrl).toContain("ymmt=");
    expect(lastUrl).not.toContain("vins=");
  });

  it("falls back to vins= only when the vehicle is otherwise unknown", async () => {
    await fetchActiveListings(req({ vin: "JTEBU5JRXK5656862" }));
    expect(lastUrl).toContain("vins=");
    expect(lastUrl).not.toContain("ymmt=");
  });
});
