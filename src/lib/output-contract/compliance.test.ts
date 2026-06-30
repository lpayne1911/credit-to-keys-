/**
 * Program-wide compliance guard. The single banned-phrase list (voice.ts) is
 * enforced against BOTH the copy catalogs and the fully-rendered output of every
 * engine — not just the deal-review flow. Decision support, never accusations
 * or legal conclusions.
 */
import { describe, it, expect } from "vitest";
import { BANNED_PHRASES, collectStrings, findBannedPhrase } from "./copy/voice";
import { FEE_COPY } from "./copy/fees";
import { ADDON_COPY } from "./copy/addons";
import { scoreDeal, type FairnessInput, type PriceRange } from "@/lib/fairness-engine";
import { buildDealReview } from "@/lib/deal-engine/buildDealReview";
import { normalizeDealInput } from "@/lib/deal-engine/normalizeDealInput";
import { buildTargetDealSheet } from "@/lib/plan-engine/buildTargetDealSheet";
import type { PlanMarket } from "@/lib/plan-engine/types";
import { buildPostSaleTriage } from "@/lib/post-sale-engine/buildPostSaleTriage";

const NOW = "2026-06-30T00:00:00.000Z";

// A fee/add-on-rich deal so the catalog copy is actually rendered into output.
const richRaw = {
  vehicle: { year: "2018", make: "Toyota", model: "Camry", mileage: "62000" },
  pricing: { vehiclePrice: "18000", downPayment: "1000" },
  fees: [
    { label: "Doc Fee", amount: "699" },
    { label: "Nitrogen", amount: "299" },
    { label: "VIN Etch", amount: "199" },
    { label: "Applicable Taxes", amount: "1200" },
    { label: "Market Adjustment", amount: "2000" },
    { label: "Mystery Line", amount: "150" },
  ],
  addOns: [
    { label: "Extended service contract", amount: "3200", financed: true },
    { label: "GAP", amount: "900", financed: true },
    { label: "Tire & wheel", amount: "1200", financed: true },
    { label: "Paint protection", amount: "800", financed: false },
  ],
  finance: { apr: "12.9", termMonths: "75", monthlyPayment: "420" },
  buyerState: "MD",
};

const fairnessInput: FairnessInput = {
  vehicle: { year: 2018, make: "Toyota", model: "Camry", mileage: 62000 },
  deal: {
    vehiclePrice: 18000,
    apr: 12.9,
    termMonths: 75,
    monthlyPayment: 420,
    fees: [{ label: "Nitrogen", amount: 299 }, { label: "Doc Fee", amount: 699 }],
  },
  warranty: { coverageTier: null, termMonths: 72, priceQuoted: 3200 },
  buyerState: "MD",
};
const planMarket: PlanMarket = {
  targetPrice: 26000, marketLow: 24000, marketMedian: 27000, marketHigh: 30000,
  confidence: "high", basis: "MarketCheck comparable listings.", isEstimate: false,
};
const marketBand: PriceRange = {
  low: 24000, high: 30000, confidence: "high", basis: "MarketCheck comparable listings.",
};

function allOutputs(): unknown[] {
  return [
    scoreDeal(fairnessInput, { now: NOW }),
    buildDealReview(normalizeDealInput(richRaw), { now: NOW, marketValue: marketBand }),
    buildDealReview(normalizeDealInput(richRaw), { now: NOW, marketValue: null }),
    buildDealReview(normalizeDealInput({ vehicle: { make: "Honda" } }), { now: NOW, marketValue: null }),
    buildTargetDealSheet(
      { vehicle: { year: 2021, make: "Toyota", model: "RAV4", trim: null, mileage: 30000 }, condition: "used", zip: "21201", buyerState: "MD", creditBand: "good", termMonths: 60, downPayment: 3000, maxMonthly: null, maxOutTheDoor: null, trade: null },
      { market: planMarket },
      { now: NOW },
    ),
    buildPostSaleTriage(
      { buyerState: "MD", daysSinceSigned: 5, financed: true, lienholder: "Ally", dealerName: "City Motors", addOns: [{ rawLabel: "Extended service contract", amount: 2500, financed: true }, { rawLabel: "GAP coverage", amount: 900, financed: true }] },
      { now: NOW },
    ),
  ];
}

describe("compliance — copy catalogs", () => {
  it("contain no banned phrase", () => {
    const entries = [...Object.values(FEE_COPY), ...Object.values(ADDON_COPY)];
    for (const e of entries) {
      expect(findBannedPhrase(e.reason), e.reason).toBeNull();
      expect(findBannedPhrase(e.suggestedAction), e.suggestedAction).toBeNull();
    }
  });
});

describe("compliance — rendered engine output", () => {
  it("no engine emits a banned legal / guarantee phrase", () => {
    const haystack = allOutputs().flatMap((o) => collectStrings(o)).join("\n").toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      expect(haystack, `output should not contain "${phrase}"`).not.toContain(phrase);
    }
  });
});
