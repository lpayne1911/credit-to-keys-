import { describe, it, expect } from "vitest";
import {
  monthlyPayment,
  principalFromPayment,
  impliedAprPct,
  paymentBreakdown,
  compareTerm,
} from "./loan-math";

/**
 * Textbook checks for the amortization helpers. These use known closed-form
 * values (no placeholders) so they pin the math exactly and stay valid even
 * after the real fairness engine is dropped in.
 */

describe("monthlyPayment", () => {
  it("matches a textbook amortization figure", () => {
    // $25,000 at 6% APR over 60 months ≈ $483.32/mo.
    const m = monthlyPayment(25_000, 6, 60);
    expect(m).toBeCloseTo(483.32, 1);
  });

  it("is interest-free math when APR is 0", () => {
    expect(monthlyPayment(12_000, 0, 24)).toBeCloseTo(500, 6);
  });

  it("returns 0 for non-positive principal or term", () => {
    expect(monthlyPayment(0, 6, 60)).toBe(0);
    expect(monthlyPayment(25_000, 6, 0)).toBe(0);
    expect(monthlyPayment(-5_000, 6, 60)).toBe(0);
  });

  it("rises with the rate", () => {
    expect(monthlyPayment(25_000, 12, 60)).toBeGreaterThan(
      monthlyPayment(25_000, 6, 60),
    );
  });
});

describe("principalFromPayment", () => {
  it("is the inverse of monthlyPayment", () => {
    const m = monthlyPayment(30_000, 9, 72);
    expect(principalFromPayment(m, 9, 72)).toBeCloseTo(30_000, 2);
  });

  it("is payment × term when APR is 0", () => {
    expect(principalFromPayment(500, 0, 24)).toBeCloseTo(12_000, 6);
  });

  it("returns 0 for non-positive inputs", () => {
    expect(principalFromPayment(0, 9, 72)).toBe(0);
    expect(principalFromPayment(450, 9, 0)).toBe(0);
  });
});

describe("impliedAprPct", () => {
  it("recovers the APR baked into a payment", () => {
    const m = monthlyPayment(28_000, 11, 66);
    const apr = impliedAprPct(m, 28_000, 66);
    expect(apr).not.toBeNull();
    expect(apr!).toBeCloseTo(11, 1);
  });

  it("returns 0 when the loan is interest-free or better", () => {
    // Pays back exactly the principal → 0% interest.
    expect(impliedAprPct(500, 12_000, 24)).toBe(0);
    // Pays back LESS than principal → still 0 (no positive rate).
    expect(impliedAprPct(400, 12_000, 24)).toBe(0);
  });

  it("returns null for impossible inputs", () => {
    expect(impliedAprPct(0, 12_000, 24)).toBeNull();
    expect(impliedAprPct(500, 0, 24)).toBeNull();
    expect(impliedAprPct(500, 12_000, 0)).toBeNull();
  });
});

describe("paymentBreakdown", () => {
  it("reports total interest as payments minus principal", () => {
    const b = paymentBreakdown(20_000, 8, 60);
    expect(b.totalPaid).toBeCloseTo(b.monthlyPayment * 60, 4);
    expect(b.totalInterest).toBeCloseTo(b.totalPaid - 20_000, 4);
    expect(b.totalInterest).toBeGreaterThan(0);
  });

  it("has zero interest at 0% APR", () => {
    const b = paymentBreakdown(12_000, 0, 24);
    expect(b.totalInterest).toBeCloseTo(0, 6);
  });
});

describe("compareTerm", () => {
  it("picks the nearest shorter standard term and quantifies the trade-off", () => {
    const c = compareTerm(28_000, 9, 72)!;
    expect(c).not.toBeNull();
    expect(c.current.termMonths).toBe(72);
    expect(c.shorter!.termMonths).toBe(60);
    // Shorter term: higher monthly, but less total interest.
    expect(c.extraPerMonth).toBeGreaterThan(0);
    expect(c.interestSaved).toBeGreaterThan(0);
    expect(c.shorter!.monthlyPayment).toBeGreaterThan(c.current.monthlyPayment);
    expect(c.shorter!.totalInterest).toBeLessThan(c.current.totalInterest);
  });

  it("snaps a non-standard term down to the nearest rung", () => {
    expect(compareTerm(20_000, 8, 66)!.shorter!.termMonths).toBe(60);
  });

  it("offers no shorter term once at the shortest rung", () => {
    const c = compareTerm(20_000, 8, 36)!;
    expect(c.shorter).toBeNull();
    expect(c.interestSaved).toBe(0);
    expect(c.extraPerMonth).toBe(0);
  });

  it("returns null for unusable inputs", () => {
    expect(compareTerm(0, 8, 60)).toBeNull();
    expect(compareTerm(20_000, 8, 0)).toBeNull();
  });
});
