/**
 * Determinism guarantee for the program's outputs.
 *
 * The only LLM call in the system is document *extraction* (pinned to
 * temperature 0). Everything downstream — scoring, classification, copy
 * selection — is pure deterministic code: the same input plus the same injected
 * clock must always produce byte-identical output. These tests lock that in.
 */
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { scoreDeal, type FairnessInput } from "@/lib/fairness-engine";
import { buildDealReview } from "@/lib/deal-engine/buildDealReview";
import { normalizeDealInput } from "@/lib/deal-engine/normalizeDealInput";
import { buildTargetDealSheet } from "@/lib/plan-engine/buildTargetDealSheet";
import type { PlanMarket, TargetPlanInput } from "@/lib/plan-engine/types";
import { buildPostSaleTriage } from "@/lib/post-sale-engine/buildPostSaleTriage";
import type { PostSaleInput } from "@/lib/post-sale-engine/types";

const NOW = "2026-06-30T00:00:00.000Z";

// Vehicle is several years old + warranty present, so the age/mileage surcharge
// path in assessWarranty (previously `new Date().getFullYear()`) is exercised.
const fairnessInput: FairnessInput = {
  vehicle: { year: 2018, make: "Toyota", model: "Camry", mileage: 62000 },
  deal: { vehiclePrice: 18000, apr: 9.9, termMonths: 72, monthlyPayment: 360, fees: [{ label: "Doc Fee", amount: 699 }] },
  warranty: { coverageTier: null, termMonths: 72, priceQuoted: 3200 },
  buyerState: "MD",
};
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

function buildAll(now: string) {
  return {
    fairness: scoreDeal(fairnessInput, { now }),
    deal: buildDealReview(normalizeDealInput({ vehicle: { make: "Toyota", model: "Camry" }, pricing: { vehiclePrice: "26000" } }), { now, marketValue: null }),
    plan: buildTargetDealSheet(planInput, { market: planMarket }, { now }),
    postSale: buildPostSaleTriage(postSaleInput, { now }),
  };
}

describe("determinism — same input + same clock → identical output", () => {
  it("produces byte-identical results across two runs", () => {
    expect(buildAll(NOW)).toEqual(buildAll(NOW));
  });

  it("exercises the year-dependent warranty path deterministically", () => {
    const a = scoreDeal(fairnessInput, { now: NOW });
    const b = scoreDeal(fairnessInput, { now: NOW });
    expect(a.warranty).not.toBeNull();
    expect(a).toEqual(b);
  });

  it("stamps createdAt from the injected clock, not the wall clock", () => {
    const r = buildAll(NOW);
    expect(r.fairness.createdAt).toBe(NOW);
    expect(r.deal.createdAt).toBe(NOW);
    expect(r.plan.createdAt).toBe(NOW);
    expect(r.postSale.createdAt).toBe(NOW);
  });
});

describe("determinism — extractor stays pinned to temperature 0", () => {
  it("the Anthropic extraction call sets temperature: 0", () => {
    const src = readFileSync("src/lib/parse/extract.ts", "utf8");
    expect(src).toMatch(/temperature:\s*0\b/);
  });
});
