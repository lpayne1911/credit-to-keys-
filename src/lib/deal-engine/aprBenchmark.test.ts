import { describe, it, expect } from "vitest";
import { reconcileDealMath } from "./reconcileDealMath";
import { generateRiskFlags } from "./riskFlags";
import { normalizeDealInput } from "./normalizeDealInput";
import { classifyFees } from "@/lib/fee-engine/classifyFees";
import { classifyAddOns } from "@/lib/add-on-engine/classifyAddOns";

function deal(raw: Parameters<typeof normalizeDealInput>[0]) {
  return normalizeDealInput(raw);
}

function flagsFor(
  rawDeal: Parameters<typeof normalizeDealInput>[0],
  aprBenchmark: Parameters<typeof reconcileDealMath>[1],
) {
  const d = deal(rawDeal);
  const math = reconcileDealMath(d, aprBenchmark);
  return generateRiskFlags({
    deal: d,
    math,
    fees: classifyFees([]),
    addOns: classifyAddOns([]),
    marketValue: null,
  });
}

describe("reconcileDealMath APR benchmark injection", () => {
  it("keeps the conservative placeholder when nothing is injected", () => {
    const m = reconcileDealMath(deal({ finance: { apr: "9", termMonths: "60" } }));
    expect(m.aprBenchmark?.source).toBe("placeholder");
  });

  it("uses the injected FRED band when provided", () => {
    const m = reconcileDealMath(deal({ finance: { apr: "9", termMonths: "60" } }), {
      aprBenchmark: { low: 7, high: 8.5, source: "fred", term: 60, asOf: "2024-04-01" },
    });
    expect(m.aprBenchmark?.source).toBe("fred");
    expect(m.aprBenchmark?.high).toBe(8.5);
  });
});

describe("apr_above_benchmark risk flag", () => {
  it("fires only against a REAL (fred) band when APR exceeds the high edge", () => {
    const flags = flagsFor(
      { finance: { apr: "11", termMonths: "72" } },
      { aprBenchmark: { low: 7, high: 8.5, source: "fred", term: 72 } },
    );
    const apr = flags.find((f) => f.id === "apr_above_benchmark");
    expect(apr).toBeTruthy();
    expect(apr!.source).toBe("finance");
    // 11 > 8.5 * 1.15 (9.78) → medium
    expect(apr!.severity).toBe("medium");
  });

  it("does NOT fire on the placeholder band (no false positives)", () => {
    const flags = flagsFor({ finance: { apr: "8.9", termMonths: "60" } }, {});
    expect(flags.find((f) => f.id === "apr_above_benchmark")).toBeUndefined();
  });

  it("does NOT fire when APR is within the real band", () => {
    const flags = flagsFor(
      { finance: { apr: "8", termMonths: "60" } },
      { aprBenchmark: { low: 7, high: 8.5, source: "fred", term: 60 } },
    );
    expect(flags.find((f) => f.id === "apr_above_benchmark")).toBeUndefined();
  });
});
