import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { scoreComparableListing, selectBestComps } from "@/lib/sources/marketcheck/filters";
import { getMarketConfidence } from "@/lib/sources/marketcheck/confidence";
import { backfillIdentityFromListings, mergeSpecs, vehicleIdentityFromRequest, applyEquipment } from "@/lib/sources/marketcheck/normalize";
import { fetchActiveListings } from "@/lib/sources/marketcheck/connector";
import { buildMarketSnapshot } from "./buildMarketSnapshot";
import { runMarketCheck } from "./runMarketCheck";
import type { ComparableListing, MarketCheckRequest, VehicleIdentity } from "@/lib/sources/marketcheck/types";

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

describe("applyEquipment (real vPIC specs over mock placeholders)", () => {
  const mockId = {
    year: 2019, make: "Toyota", model: "4Runner", trim: null, vin: null, mileage: null,
    identityConfidence: "medium",
    bodyStyle: "SUV", drivetrain: "All-Wheel Drive", engine: "2.5L 4-Cyl. Hybrid",
    transmission: "eCVT", fuelType: "Hybrid (Gas/Electric)", msrp: 40_000,
  } as unknown as VehicleIdentity;

  it("overrides the mock's hardcoded specs with real equipment", () => {
    const out = applyEquipment(mockId, {
      bodyStyle: "Pickup", drivetrain: "4WD/Four-Wheel Drive", engine: "4.0L 6-Cyl",
      transmission: "Automatic", fuelType: "Gasoline",
    });
    expect(out.engine).toBe("4.0L 6-Cyl");
    expect(out.fuelType).toBe("Gasoline");
    expect(out.drivetrain).toBe("4WD/Four-Wheel Drive");
    expect(out.msrp).toBe(40_000); // non-equipment fields untouched
  });

  it("keeps existing values where vPIC resolved nothing", () => {
    const out = applyEquipment(mockId, {
      bodyStyle: null, drivetrain: "AWD", engine: null, transmission: null, fuelType: null,
    });
    expect(out.engine).toBe("2.5L 4-Cyl. Hybrid"); // kept
    expect(out.drivetrain).toBe("AWD"); // overridden
  });

  it("returns the identity unchanged when there's no equipment", () => {
    expect(applyEquipment(mockId, null)).toBe(mockId);
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

describe("runMarketCheck premium-endpoint gating (Free-plan call budget)", () => {
  const KEY = "MARKETCHECK_API_KEY";
  const orig = {
    key: process.env[KEY],
    history: process.env.MARKETCHECK_HISTORY_ENABLED,
    specs: process.env.MARKETCHECK_SPECS_ENABLED,
  };
  let urls: string[] = [];

  function stubFetch(listings: number) {
    vi.stubGlobal("fetch", async (url: unknown) => {
      const u = String(url);
      urls.push(u);
      if (u.includes("/search/car/active")) {
        const arr = Array.from({ length: listings }, (_, i) => ({
          id: `l${i}`,
          vin: i === 0 ? "JTEBU5JRXK5656862" : undefined,
          price: 28_000 + i * 500,
          miles: 20_000,
          dom: 20 + i,
          dist: 10 + i,
          dealer: { name: "Test Toyota" },
          build: { year: 2021, make: "Toyota", model: "Camry", trim: "XLE" },
        }));
        return { ok: true, json: async () => ({ num_found: listings, listings: arr }) } as unknown as Response;
      }
      return { ok: true, json: async () => ({ listings: [] }) } as unknown as Response;
    });
  }

  beforeEach(() => {
    process.env[KEY] = "test-key";
    urls = [];
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    for (const [k, v] of [[KEY, orig.key], ["MARKETCHECK_HISTORY_ENABLED", orig.history], ["MARKETCHECK_SPECS_ENABLED", orig.specs]] as const) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("on Free (flags off): one active call, no /decode/ or /recents/, dealer intel from comps", async () => {
    delete process.env.MARKETCHECK_HISTORY_ENABLED;
    delete process.env.MARKETCHECK_SPECS_ENABLED;
    stubFetch(5);
    const r = await runMarketCheck(req({ year: 2021, make: "Toyota", model: "Camry", trim: "XLE", vin: "JTEBU5JRXK5656862", zipCode: "80202" }));
    expect(urls.some((u) => u.includes("/decode/"))).toBe(false);
    expect(urls.some((u) => u.includes("/search/car/recents"))).toBe(false);
    expect(urls.filter((u) => u.includes("/search/car/active")).length).toBe(1);
    // dealer name + days-on-market derived from the matched comp (no extra call)
    expect(r.dealerInsight?.dealerName).toBe("Test Toyota");
    expect(r.dealerInsight?.thisListingDaysOnMarket).toBe(20);
  });

  it("requests recents only when MARKETCHECK_HISTORY_ENABLED=true", async () => {
    process.env.MARKETCHECK_HISTORY_ENABLED = "true";
    stubFetch(5);
    await runMarketCheck(req({ year: 2021, make: "Toyota", model: "Camry", zipCode: "80202" }));
    expect(urls.some((u) => u.includes("/search/car/recents"))).toBe(true);
  });
});

describe("runMarketCheck surfaces a MarketCheck rate-limit (429) honestly", () => {
  const KEY = "MARKETCHECK_API_KEY";
  const orig = process.env[KEY];
  beforeEach(() => {
    process.env[KEY] = "test-key";
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 429, json: async () => ({}) }) as unknown as Response);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    if (orig === undefined) delete process.env[KEY];
    else process.env[KEY] = orig;
  });

  it("flags liveUnavailable + isMock when the active-listings call is rate-limited", async () => {
    const r = await runMarketCheck(req({ year: 2021, make: "Toyota", model: "Camry", zipCode: "80202" }));
    expect(r.source.isMock).toBe(true);
    expect(r.source.liveUnavailable).toBe(true);
  });
});
