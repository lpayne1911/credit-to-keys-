import { describe, it, expect } from "vitest";
import { scoreDeal, type PriceRange } from "./fairness-engine";

const MARKET: PriceRange = {
  low: 28_000,
  high: 30_000,
  confidence: "high",
  basis: "MarketCheck active listings for a 2024 Toyota RAV4 (40 comparables).",
};

function score(price: number | null, marketValue: PriceRange | null) {
  return scoreDeal({
    vehicle: { make: "Toyota", model: "RAV4", year: 2024 },
    deal: { creditBand: "unknown", fees: [], vehiclePrice: price ?? undefined },
    marketValue,
  });
}

describe("vehicle price vs. market", () => {
  it("flags an over-market asking price with a dollar impact", () => {
    const r = score(32_400, MARKET);
    const flag = r.flags.find((f) => f.type === "overpriced_vehicle");
    expect(flag).toBeTruthy();
    expect(flag!.severity).toBe("high"); // 32,400 vs 30,000 high = 8% over
    expect(flag!.estimatedImpact?.low).toBe(2_400); // price - high
    expect(flag!.estimatedImpact?.high).toBe(4_400); // price - low
  });

  it("does not flag a price within the market range", () => {
    const r = score(29_000, MARKET);
    expect(r.flags.some((f) => f.type === "overpriced_vehicle")).toBe(false);
  });

  it("does nothing without a market range (back-compat)", () => {
    const r = score(32_400, null);
    expect(r.flags.some((f) => f.type === "overpriced_vehicle")).toBe(false);
  });

  it("echoes the market range on the result for the UI", () => {
    expect(score(29_000, MARKET).marketValue).toEqual(MARKET);
    expect(score(29_000, null).marketValue).toBeNull();
  });
});
