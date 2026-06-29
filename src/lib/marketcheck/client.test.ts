import { describe, it, expect, afterEach } from "vitest";
import { marketStatsToRange, getMarketRange } from "./client";

describe("marketStatsToRange", () => {
  it("prefers p25–p75 when present and sets confidence from population", () => {
    const r = marketStatsToRange(
      { "25.0": 28_120, "75.0": 31_180, population: 40, median: 29_500 },
      { label: "2024 Toyota RAV4 XLE" },
    );
    expect(r).not.toBeNull();
    expect(r!.low).toBe(28_100); // rounded to nearest $50
    expect(r!.high).toBe(31_200);
    expect(r!.confidence).toBe("high");
    expect(r!.basis).toMatch(/MarketCheck/);
    expect(r!.basis).toMatch(/40 comparables/);
  });

  it("falls back to a band around the median, with confidence by sample size", () => {
    const r = marketStatsToRange({ median: 30_000, population: 10 }, { label: "x" });
    expect(r!.low).toBeLessThan(30_000);
    expect(r!.high).toBeGreaterThan(30_000);
    expect(r!.confidence).toBe("medium");
  });

  it("low confidence for thin samples; null for unusable stats", () => {
    expect(marketStatsToRange({ mean: 25_000, population: 2 }, { label: "x" })!.confidence).toBe("low");
    expect(marketStatsToRange({}, { label: "x" })).toBeNull();
    expect(marketStatsToRange(null, { label: "x" })).toBeNull();
  });
});

describe("getMarketRange (graceful degradation, no network)", () => {
  const KEY = "MARKETCHECK_API_KEY";
  const original = process.env[KEY];
  afterEach(() => {
    if (original === undefined) delete process.env[KEY];
    else process.env[KEY] = original;
  });

  it("returns null when the API key is not configured", async () => {
    delete process.env[KEY];
    const r = await getMarketRange({ year: 2024, make: "Toyota", model: "RAV4", zip: "20850" });
    expect(r).toBeNull();
  });

  it("returns null (no network call) when vehicle data is too thin", async () => {
    process.env[KEY] = "test-key";
    expect(await getMarketRange({ make: "Toyota" })).toBeNull(); // no year/model
    expect(await getMarketRange({ year: 2024, model: "RAV4" })).toBeNull(); // no make
  });
});
