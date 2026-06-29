import { describe, it, expect } from "vitest";
import { buildPriceDistribution, demandFromDom, rankAmong } from "./signals";

describe("buildPriceDistribution", () => {
  it("buckets prices and counts every listing (including the max)", () => {
    const b = buildPriceDistribution([25_000, 26_000, 27_000, 28_000, 29_000, 30_000], 6);
    expect(b).toHaveLength(6);
    expect(b.reduce((s, x) => s + x.count, 0)).toBe(6);
    expect(b[0].lowEdge).toBe(25_000);
    expect(b[b.length - 1].highEdge).toBe(30_000);
  });

  it("returns [] when there's no usable spread", () => {
    expect(buildPriceDistribution([20_000, 20_000, 20_000])).toEqual([]);
    expect(buildPriceDistribution([20_000])).toEqual([]);
    expect(buildPriceDistribution([])).toEqual([]);
  });
});

describe("demandFromDom", () => {
  it("maps days-on-market to a demand level, defaulting to moderate when unknown", () => {
    expect(demandFromDom(20)).toBe("high");
    expect(demandFromDom(45)).toBe("moderate");
    expect(demandFromDom(90)).toBe("low");
    expect(demandFromDom(0)).toBe("moderate");
  });
});

describe("rankAmong", () => {
  it("ranks a price among comps (1 = cheaper than all)", () => {
    expect(rankAmong(24_000, [25_000, 26_000, 27_000])).toEqual({ rank: 1, of: 4 });
    expect(rankAmong(26_500, [25_000, 26_000, 27_000])).toEqual({ rank: 3, of: 4 });
  });
  it("returns null on unusable input", () => {
    expect(rankAmong(0, [25_000])).toBeNull();
    expect(rankAmong(25_000, [])).toBeNull();
  });
});
