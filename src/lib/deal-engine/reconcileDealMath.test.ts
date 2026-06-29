import { describe, expect, it } from "vitest";
import { monthlyPayment } from "@/lib/loan-math";
import { reconcileDealMath } from "./reconcileDealMath";
import { normalizeDealInput } from "./normalizeDealInput";

function deal(raw: Parameters<typeof normalizeDealInput>[0]) {
  return normalizeDealInput(raw);
}

describe("reconcileDealMath", () => {
  it("matches loan-math for a known amount financed", () => {
    const m = reconcileDealMath(
      deal({ finance: { apr: "6", termMonths: "60", amountFinanced: "30000" } }),
    );
    expect(m.estimatedAmountFinanced).toBe(30000);
    expect(m.expectedMonthlyPayment).toBeCloseTo(monthlyPayment(30000, 6, 60), 2);
    expect(m.expectedMonthlyPayment).toBeGreaterThan(575);
    expect(m.expectedMonthlyPayment).toBeLessThan(585);
  });

  it("hard-flags a payment mismatch when the financed basis is reliable", () => {
    const m = reconcileDealMath(
      deal({
        finance: { apr: "6", termMonths: "60", amountFinanced: "30000", monthlyPayment: "660" },
      }),
    );
    expect(m.paymentMismatch).toBe(true);
    expect(m.paymentDelta).toBeGreaterThan(0);
  });

  it("does NOT hard-flag when the financed amount is only estimated (no tax)", () => {
    const m = reconcileDealMath(
      deal({
        pricing: { vehiclePrice: "30000", downPayment: "0" },
        finance: { apr: "6", termMonths: "60", monthlyPayment: "660" },
      }),
    );
    expect(m.estimatedAmountFinanced).toBe(30000);
    expect(m.paymentMismatch).toBe(false);
    expect(m.notes.join(" ")).toMatch(/approximate/i);
  });

  it("derives a clean financed amount from out-the-door price", () => {
    const m = reconcileDealMath(
      deal({
        pricing: { outTheDoor: "33000", downPayment: "3000" },
        finance: { apr: "6", termMonths: "60" },
      }),
    );
    expect(m.estimatedAmountFinanced).toBe(30000);
  });

  it("computes trade equity and negative equity", () => {
    const m = reconcileDealMath(
      deal({ trade: { offer: "8000", loanPayoff: "10000" } }),
    );
    expect(m.tradeEquity).toBe(-2000);
    expect(m.negativeEquity).toBe(2000);
  });

  it("flags a long term as a stretch", () => {
    const m = reconcileDealMath(
      deal({ pricing: { vehiclePrice: "30000" }, finance: { apr: "6", termMonths: "84" } }),
    );
    expect(m.termStretch?.flagged).toBe(true);
  });

  it("is total on empty input — no NaN", () => {
    const m = reconcileDealMath(deal({}));
    expect(m.totalFees).toBe(0);
    expect(m.expectedMonthlyPayment).toBeNull();
    expect(m.paymentMismatch).toBe(false);
  });
});
