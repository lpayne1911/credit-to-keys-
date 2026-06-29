import { describe, it, expect } from "vitest";
import { buildHistoryPoints } from "./priceHistory";

describe("buildHistoryPoints", () => {
  it("aggregates dated prices into weekly points with a trend direction", () => {
    const rows = [
      { price: 30_000, date: "2026-01-05" }, { price: 30_000, date: "2026-01-05" },
      { price: 29_000, date: "2026-01-15" }, { price: 29_000, date: "2026-01-15" },
      { price: 28_000, date: "2026-01-26" }, { price: 28_000, date: "2026-01-26" },
    ];
    const r = buildHistoryPoints(rows);
    expect(r).not.toBeNull();
    expect(r!.points).toHaveLength(3);
    expect(r!.points[0].price).toBe(30_000);
    expect(r!.points[2].price).toBe(28_000);
    expect(r!.trendDirection).toBe("decreasing");
  });

  it("returns null when the series is too thin to be reliable", () => {
    const rows = [
      { price: 30_000, date: "2026-01-05" }, // only 1 per week
      { price: 29_000, date: "2026-01-15" },
    ];
    expect(buildHistoryPoints(rows)).toBeNull();
  });

  it("flags a rising trend and ignores bad rows", () => {
    const rows = [
      { price: 28_000, date: "2026-01-05" }, { price: 28_000, date: "2026-01-05" },
      { price: 31_000, date: "2026-01-26" }, { price: 31_000, date: "2026-01-26" },
      { price: 0, date: "2026-01-26" }, { price: 5_000, date: "not-a-date" },
    ];
    const r = buildHistoryPoints(rows);
    expect(r?.trendDirection).toBe("rising");
    expect(r?.points).toHaveLength(2);
  });
});
