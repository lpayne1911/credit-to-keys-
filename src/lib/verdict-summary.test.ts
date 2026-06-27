import { describe, it, expect } from "vitest";
import { savingsRange, savingsBreakdown } from "./verdict-summary";
import { scoreDeal, type FairnessInput } from "./fairness-engine";

function baseInput(overrides: Partial<FairnessInput> = {}): FairnessInput {
  return {
    vehicle: { year: 2021, make: "Toyota", model: "Camry", mileage: 30_000 },
    deal: {
      vehiclePrice: 26_000,
      downPayment: 2_000,
      apr: 7,
      termMonths: 60,
      creditBand: "good",
      fees: [{ label: "Title / registration", amount: 300 }],
    },
    warranty: null,
    ...overrides,
  };
}

describe("savingsRange", () => {
  it("sums clawback-able impacts (junk fees, add-ons)", () => {
    const r = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Nitrogen tires", amount: 399 }] },
      }),
    );
    const s = savingsRange(r)!;
    expect(s).not.toBeNull();
    expect(s.high).toBeGreaterThan(0);
    expect(s.low).toBeLessThanOrEqual(s.high);
  });

  it("excludes negative equity (pre-existing debt) from the savings total", () => {
    const r = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Nitrogen tires", amount: 399 }] },
        tradeIn: { offer: 7_000, loanPayoff: 11_000 }, // ~$4k negative equity
      }),
    );
    const neg = r.flags.find((f) => f.type === "negative_equity")!;
    expect(neg.estimatedImpact!.low).toBeGreaterThanOrEqual(4_000);

    const s = savingsRange(r)!;
    // Savings reflects the nitrogen fee only — nowhere near the $4k debt.
    expect(s.high).toBeLessThan(neg.estimatedImpact!.low);
  });

  it("returns null when the only impact is negative equity", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 7_000, loanPayoff: 11_000 } }));
    expect(savingsRange(r)).toBeNull();
  });

  it("includes a trade-in lowball gap as real clawback value", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 7_000, estimatedValue: 10_500 } }));
    const s = savingsRange(r);
    expect(s).not.toBeNull();
    expect(s!.high).toBeGreaterThan(0);
  });
});

describe("savingsBreakdown", () => {
  it("lists each clawback-able category, summing to the headline total", () => {
    const r = scoreDeal(
      baseInput({
        deal: {
          apr: 18,
          creditBand: "good",
          vehiclePrice: 26_000,
          downPayment: 2_000,
          termMonths: 72,
          fees: [
            { label: "Nitrogen tires", amount: 399 },
            { label: "VIN etching", amount: 350 },
          ],
        },
      }),
    );
    const lines = savingsBreakdown(r);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    const total = savingsRange(r)!;
    const sumLow = lines.reduce((a, l) => a + l.low, 0);
    const sumHigh = lines.reduce((a, l) => a + l.high, 0);
    expect(sumLow).toBe(total.low);
    expect(sumHigh).toBe(total.high);
  });

  it("omits negative equity (matches the headline exclusion)", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 7_000, loanPayoff: 11_000 } }));
    expect(savingsBreakdown(r).some((l) => /payoff|equity/i.test(l.label))).toBe(false);
  });
});
