import { describe, it, expect } from "vitest";
import { buildTargetDealSheet } from "./buildTargetDealSheet";
import type { TargetPlanInput, PlanMarket } from "./types";
import type { DocFeeRule } from "@/lib/intelligence/docFeeRules";

const baseInput: TargetPlanInput = {
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

const market: PlanMarket = {
  targetPrice: 26000,
  marketLow: 24000,
  marketMedian: 27000,
  marketHigh: 30000,
  confidence: "high",
  basis: "MarketCheck comparable listings.",
  isEstimate: false,
};

// Minimal DocFeeRule with a $500 cap (50000 cents).
const mdRule = {
  jurisdiction: "MD",
  stateName: "Maryland",
  maxAmountCents: 50000,
  capType: "fixed_dollar",
  feeNames: ["Processing fee"],
  dealerControlled: true,
  governmentFee: false,
  taxable: null,
  mustBeDisclosed: null,
  buyerExplanation: "x",
  buyerAction: "y",
  lastVerified: "2025-01-01",
  confidence: "high",
  verificationStatus: "verified",
} as unknown as DocFeeRule;

describe("buildTargetDealSheet", () => {
  it("brands the payload and labels the vehicle", () => {
    const sheet = buildTargetDealSheet(baseInput, { market, docFeeRule: mdRule });
    expect(sheet.schemaVersion).toBe("target-plan-1");
    expect(sheet.vehicleLabel).toBe("2021 Toyota RAV4 XLE");
    expect(sheet.pricing.targetPrice).toBe(26000);
  });

  it("surfaces a state doc-fee cap as the target ceiling", () => {
    const sheet = buildTargetDealSheet(baseInput, { market, docFeeRule: mdRule });
    const doc = sheet.fees.find((f) => f.label.startsWith("Doc"));
    expect(doc?.target).toBe(500);
    expect(doc?.kind).toBe("negotiable");
  });

  it("leaves the doc-fee target null when no state rule is known", () => {
    const sheet = buildTargetDealSheet({ ...baseInput, buyerState: null }, { market, docFeeRule: null });
    const doc = sheet.fees.find((f) => f.label.startsWith("Doc"));
    expect(doc?.target).toBeNull();
  });

  it("never invents tax or government fee amounts", () => {
    const sheet = buildTargetDealSheet(baseInput, { market, docFeeRule: mdRule });
    const tax = sheet.fees.find((f) => f.label === "Sales tax");
    const reg = sheet.fees.find((f) => f.label === "Title & registration");
    expect(tax?.target).toBeNull();
    expect(tax?.kind).toBe("varies");
    expect(reg?.target).toBeNull();
    expect(reg?.kind).toBe("government");
  });

  it("computes the financed principal as price + doc fee − down − trade equity", () => {
    const input: TargetPlanInput = {
      ...baseInput,
      downPayment: 3000,
      trade: { estimatedValue: 8000, loanPayoff: 5000 }, // equity 3000
    };
    const sheet = buildTargetDealSheet(input, { market, docFeeRule: mdRule });
    // 26000 + 500 doc − 3000 down − 3000 equity = 20500
    expect(sheet.tradeEquity).toBe(3000);
    expect(sheet.financing?.estPrincipal).toBe(20500);
    expect(sheet.financing?.estMonthlyLow).toBeGreaterThan(0);
    expect(sheet.financing!.estMonthlyHigh).toBeGreaterThan(sheet.financing!.estMonthlyLow!);
  });

  it("uses the credit band's APR band and defaults the term when missing", () => {
    const sheet = buildTargetDealSheet({ ...baseInput, termMonths: null }, { market, docFeeRule: mdRule });
    expect(sheet.financing?.termMonths).toBe(60);
    expect(sheet.financing?.aprBand.low).toBe(6.5); // "good" band
    expect(sheet.financing?.aprBand.high).toBe(10.5);
  });

  it("leaves principal null when there is no target price to anchor on", () => {
    const noPrice: PlanMarket = { ...market, targetPrice: null, marketMedian: null };
    const sheet = buildTargetDealSheet(baseInput, { market: noPrice, docFeeRule: mdRule });
    expect(sheet.financing?.estPrincipal).toBeNull();
    expect(sheet.financing?.estMonthlyLow).toBeNull();
    expect(sheet.gamePlan[0].title).toMatch(/target price first/i);
  });

  it("prompts for missing inputs that would sharpen the sheet", () => {
    const thin: TargetPlanInput = {
      ...baseInput,
      zip: null,
      buyerState: null,
      creditBand: "unknown",
      termMonths: null,
    };
    const estMarket: PlanMarket = { ...market, isEstimate: true };
    const sheet = buildTargetDealSheet(thin, { market: estMarket, docFeeRule: null });
    const joined = sheet.missing.join(" ");
    expect(joined).toMatch(/ZIP/i);
    expect(joined).toMatch(/state/i);
    expect(joined).toMatch(/credit/i);
    expect(joined).toMatch(/term/i);
    expect(joined).toMatch(/demo estimate/i);
  });

  it("adds a trade-in step only when there's a trade", () => {
    const withTrade = buildTargetDealSheet(
      { ...baseInput, trade: { estimatedValue: 8000, loanPayoff: null } },
      { market, docFeeRule: mdRule },
    );
    expect(withTrade.gamePlan.some((s) => /trade-in/i.test(s.title))).toBe(true);
    const noTrade = buildTargetDealSheet(baseInput, { market, docFeeRule: mdRule });
    expect(noTrade.gamePlan.some((s) => /trade-in/i.test(s.title))).toBe(false);
  });
});
