import { describe, it, expect } from "vitest";
import { savingsRange } from "./verdict-summary";
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
