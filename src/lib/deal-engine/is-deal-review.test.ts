import { describe, it, expect } from "vitest";
import { isDealReviewResult } from "./is-deal-review";

describe("isDealReviewResult", () => {
  it("returns true for a branded Deal Review result", () => {
    expect(isDealReviewResult({ schemaVersion: "deal-review-1", dealScore: 80 })).toBe(true);
  });

  it("returns false for a fairness-engine result (no schemaVersion)", () => {
    expect(isDealReviewResult({ overallVerdict: "green", flags: [] })).toBe(false);
  });

  it("returns false for null / undefined / primitives", () => {
    expect(isDealReviewResult(null)).toBe(false);
    expect(isDealReviewResult(undefined)).toBe(false);
    expect(isDealReviewResult("deal-review-1")).toBe(false);
    expect(isDealReviewResult(42)).toBe(false);
  });

  it("returns false for a different schemaVersion", () => {
    expect(isDealReviewResult({ schemaVersion: "deal-review-2" })).toBe(false);
  });
});
