import { describe, it, expect } from "vitest";
import { recommendServices } from "./recommend";
import type { FairnessResult, Flag, FlagType, Verdict } from "@/lib/fairness-engine";

function result(verdict: Verdict, flagTypes: FlagType[]): FairnessResult {
  const flags: Flag[] = flagTypes.map((type) => ({
    type,
    severity: "medium",
    title: type,
    explanation: "",
  }));
  return {
    overallVerdict: verdict,
    headline: "",
    confidence: "high",
    confidenceReasons: [],
    flags,
    warranty: null,
    assumptions: [],
    engineVersion: "test",
  };
}

describe("recommendServices", () => {
  it("always recommends a human advocate review", () => {
    for (const r of [result("green", []), result("red", ["junk_fee"]), null]) {
      expect(recommendServices(r).some((x) => x.href === "/human-review")).toBe(true);
    }
  });

  it("leads with Deal Rescue when the verdict is serious (red/black)", () => {
    expect(recommendServices(result("red", []))[0].href).toBe("/quote-review");
    expect(recommendServices(result("black", []))[0].href).toBe("/quote-review");
  });

  it("leads with Deal Rescue when fee / F&I padding fired", () => {
    expect(recommendServices(result("amber", ["overpriced_warranty"]))[0].href).toBe("/quote-review");
    expect(recommendServices(result("amber", ["junk_fee"]))[0].href).toBe("/quote-review");
  });

  it("leads with Deal Rescue when financing markup fired", () => {
    expect(recommendServices(result("amber", ["apr_markup"]))[0].href).toBe("/quote-review");
    expect(recommendServices(result("amber", ["payment_packing"]))[0].href).toBe("/quote-review");
  });

  it("recommends Build My Plan for a clean deal with no concerning flags", () => {
    const recs = recommendServices(result("green", ["info"]));
    expect(recs[0].href).toBe("/build-my-plan");
  });

  it("never gates: it only ever returns recommendation links (no blocking flag)", () => {
    const recs = recommendServices(result("red", ["junk_fee", "apr_markup"]));
    expect(recs.every((r) => typeof r.href === "string" && r.href.startsWith("/"))).toBe(true);
    expect(recs.length).toBeGreaterThanOrEqual(2);
  });
});
