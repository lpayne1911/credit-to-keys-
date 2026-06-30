import { describe, it, expect } from "vitest";
import { minConfidence, type EngineResultEnvelope } from ".";
import { scoreDeal } from "@/lib/fairness-engine";
import { buildDealReview } from "@/lib/deal-engine/buildDealReview";
import { normalizeDealInput } from "@/lib/deal-engine/normalizeDealInput";
import { buildTargetDealSheet } from "@/lib/plan-engine/buildTargetDealSheet";
import type { PlanMarket, TargetPlanInput } from "@/lib/plan-engine/types";
import { buildPostSaleTriage } from "@/lib/post-sale-engine/buildPostSaleTriage";
import type { PostSaleInput } from "@/lib/post-sale-engine/types";

const NOW = "2026-06-30T00:00:00.000Z";

const planInput: TargetPlanInput = {
  vehicle: { year: 2021, make: "Toyota", model: "RAV4", trim: "XLE", mileage: 30000 },
  condition: "used",
  zip: "21201",
  buyerState: "MD",
  creditBand: "good",
  termMonths: 60,
  downPayment: 3000,
  maxMonthly: null,
  maxOutTheDoor: null,
  trade: null,
};
const planMarket: PlanMarket = {
  targetPrice: 26000,
  marketLow: 24000,
  marketMedian: 27000,
  marketHigh: 30000,
  confidence: "high",
  basis: "MarketCheck comparable listings.",
  isEstimate: false,
};
const postSaleInput: PostSaleInput = {
  buyerState: "MD",
  daysSinceSigned: 5,
  financed: true,
  lienholder: "Ally",
  dealerName: "City Motors",
  addOns: [{ rawLabel: "Extended service contract", amount: 2500, financed: true }],
};

/** Every engine result, built with an injected clock. */
function results(): { name: string; result: EngineResultEnvelope }[] {
  return [
    {
      name: "fairness",
      result: scoreDeal({ vehicle: { year: 2021, make: "Toyota", model: "Camry" }, deal: {} }, { now: NOW }),
    },
    {
      name: "deal-review",
      result: buildDealReview(normalizeDealInput({ vehicle: { make: "Toyota", model: "Camry" } }), { now: NOW }),
    },
    {
      name: "target-plan",
      result: buildTargetDealSheet(planInput, { market: planMarket }, { now: NOW }),
    },
    {
      name: "post-sale",
      result: buildPostSaleTriage(postSaleInput, { now: NOW }),
    },
  ];
}

describe("output contract — result envelope", () => {
  it("every engine stamps a non-empty schemaVersion, engineVersion and createdAt", () => {
    for (const { name, result } of results()) {
      expect(result.schemaVersion, `${name} schemaVersion`).toBeTruthy();
      expect(result.engineVersion, `${name} engineVersion`).toBeTruthy();
      expect(result.createdAt, `${name} createdAt`).toBe(NOW);
    }
  });

  it("schemaVersion is distinct per engine so payloads never collide", () => {
    const brands = results().map((r) => r.result.schemaVersion);
    expect(new Set(brands).size).toBe(brands.length);
    expect(brands).toEqual(["fairness-1", "deal-review-1", "target-plan-1", "post-sale-1"]);
  });
});

describe("output contract — canonical confidence", () => {
  it("minConfidence returns the more cautious level", () => {
    expect(minConfidence("high", "low")).toBe("low");
    expect(minConfidence("medium", "high")).toBe("medium");
    expect(minConfidence("high", "high")).toBe("high");
  });
});
