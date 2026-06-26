import { describe, it, expect } from "vitest";
import {
  scoreDeal,
  auditFees,
  FLAG_TYPES,
  type FairnessInput,
  type Flag,
} from "./fairness-engine";

/**
 * Behavior tests for the fairness brain. These pin down the PLACEHOLDER engine's
 * contract and observable behavior so that when the owner's real engine is
 * dropped into `scoreDeal` (Phase 1), any change in verdicts is a visible diff
 * rather than a silent regression. Assertions favor structural invariants
 * (verdict color, flag presence, range ordering, confidence) over exact dollar
 * values, with a couple of extreme cases that hold regardless of tuning.
 */

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

function flagTypes(flags: Flag[]): string[] {
  return flags.map((f) => f.type);
}

describe("scoreDeal — overall verdict", () => {
  it("returns green for a clean deal with no problems and full info", () => {
    const r = scoreDeal(baseInput());
    expect(r.overallVerdict).toBe("green");
    // No real (non-info) flags on a clean deal.
    expect(
      r.flags.filter((f) => f.type !== "missing_info" && f.type !== "info"),
    ).toHaveLength(0);
    // APR + fees provided → no missing-info notes → high confidence.
    expect(r.confidence).toBe("high");
  });

  it("returns red when multiple junk fees and APR markup stack up", () => {
    const r = scoreDeal(
      baseInput({
        deal: {
          vehiclePrice: 26_000,
          apr: 16.9,
          termMonths: 72,
          creditBand: "good",
          fees: [
            { label: "Nitrogen tires", amount: 399 },
            { label: "Paint protection", amount: 1295 },
            { label: "Doc fee", amount: 699 },
          ],
        },
      }),
    );
    expect(r.overallVerdict).toBe("red");
    expect(flagTypes(r.flags)).toContain("apr_markup");
  });

  it("downgrades confidence when key info is missing", () => {
    const r = scoreDeal(
      baseInput({
        deal: { creditBand: "unknown" }, // no apr, no fees
      }),
    );
    // Two missing-info notes (no APR, no itemized fees) → low confidence.
    const infoCount = r.flags.filter((f) => f.type === "missing_info").length;
    expect(infoCount).toBe(2);
    expect(r.confidence).toBe("low");
  });
});

describe("scoreDeal — APR markup", () => {
  it("flags an APR well above the buyer's likely qualifying band", () => {
    const r = scoreDeal(
      baseInput({
        deal: {
          apr: 18,
          creditBand: "good",
          vehiclePrice: 26_000,
          downPayment: 2_000,
          termMonths: 60,
          fees: [],
        },
      }),
    );
    const apr = r.flags.find((f) => f.type === "apr_markup");
    expect(apr).toBeTruthy();
    // With a financed principal present, an extra-interest impact range is shown.
    expect(apr!.estimatedImpact).toBeTruthy();
    expect(apr!.estimatedImpact!.low).toBeLessThanOrEqual(
      apr!.estimatedImpact!.high,
    );
  });

  it("does not flag an APR within the likely band", () => {
    const r = scoreDeal(baseInput({ deal: { apr: 8, creditBand: "good" } }));
    expect(flagTypes(r.flags)).not.toContain("apr_markup");
  });

  it("adds a missing-info note when no APR is provided", () => {
    const r = scoreDeal(baseInput({ deal: { creditBand: "good" } }));
    expect(r.flags.some((f) => f.title === "No APR entered")).toBe(true);
  });
});

describe("scoreDeal — monthly-payment reality check", () => {
  // A clean, fully-financed baseline whose deal numbers actually agree with the
  // monthly payment, so the packing check should stay silent.
  function financedDeal(overrides: Record<string, unknown> = {}) {
    return baseInput({
      deal: {
        vehiclePrice: 26_000,
        downPayment: 2_000,
        apr: 7,
        termMonths: 72,
        creditBand: "good",
        fees: [{ label: "Title / registration", amount: 300 }],
        ...overrides,
      },
    });
  }

  it("stays silent when no monthly payment is entered", () => {
    const r = scoreDeal(financedDeal());
    expect(flagTypes(r.flags)).not.toContain("payment_packing");
  });

  it("flags a payment that implies far more financed than the deal lists", () => {
    // $600/mo at 7% over 72 mo supports ~$35k of principal — well above the
    // ~$24.3k financed here, even after the tax/title cushion.
    const r = scoreDeal(financedDeal({ monthlyPayment: 600 }));
    const flag = r.flags.find((f) => f.type === "payment_packing");
    expect(flag).toBeTruthy();
    expect(flag!.severity).toBe("high");
    expect(flag!.estimatedImpact).toBeTruthy();
    expect(flag!.estimatedImpact!.low).toBeLessThanOrEqual(
      flag!.estimatedImpact!.high,
    );
  });

  it("does NOT flag a payment that matches the financed amount", () => {
    // ~$420/mo at 7% over 72 mo lines up with ~$24.6k financed → no surplus.
    const r = scoreDeal(financedDeal({ monthlyPayment: 420 }));
    expect(flagTypes(r.flags)).not.toContain("payment_packing");
  });

  it("does NOT flag a small surplus the tax/title allowance can absorb", () => {
    // ~$470/mo implies ~$27.6k financed; the ~$2.6k cushion covers the gap.
    const r = scoreDeal(financedDeal({ monthlyPayment: 470 }));
    expect(flagTypes(r.flags)).not.toContain("payment_packing");
  });

  it("infers a high rate from the payment when no APR is given", () => {
    const r = scoreDeal(
      baseInput({
        deal: {
          vehiclePrice: 20_000,
          downPayment: 0,
          termMonths: 72,
          creditBand: "good",
          monthlyPayment: 600, // implies a very high APR on $22k principal
        },
      }),
    );
    const flag = r.flags.find((f) => f.type === "payment_packing");
    expect(flag).toBeTruthy();
    expect(flag!.title).toMatch(/interest rate/i);
  });

  it("does NOT infer a high rate when the payment is reasonable", () => {
    const r = scoreDeal(
      baseInput({
        deal: {
          vehiclePrice: 20_000,
          downPayment: 0,
          termMonths: 72,
          creditBand: "good",
          monthlyPayment: 385, // ~8% implied → within the likely band
        },
      }),
    );
    expect(flagTypes(r.flags)).not.toContain("payment_packing");
  });
});

describe("scoreDeal — fees", () => {
  it("flags an always-junk add-on (nitrogen)", () => {
    const r = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Nitrogen tires", amount: 399 }] },
      }),
    );
    expect(r.flags.some((f) => f.title.includes("Nitrogen"))).toBe(true);
  });

  it("flags a documentation fee above the reasonable ceiling", () => {
    const r = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Doc fee", amount: 800 }] },
      }),
    );
    const doc = r.flags.find((f) => f.title.toLowerCase().includes("documentation"));
    expect(doc).toBeTruthy();
    expect(doc!.type).toBe("junk_fee");
  });

  it("does not flag a modest, legitimate doc fee under the ceiling", () => {
    const r = scoreDeal(
      baseInput({
        deal: { apr: 7, creditBand: "good", fees: [{ label: "Doc fee", amount: 150 }] },
      }),
    );
    expect(r.flags.some((f) => f.type === "junk_fee")).toBe(false);
  });
});

describe("scoreDeal — warranty pricing", () => {
  it("returns no warranty assessment when no warranty signal is present", () => {
    const r = scoreDeal(baseInput({ warranty: null }));
    expect(r.warranty).toBeNull();
  });

  it("produces an ordered fair range with a confidence and basis", () => {
    const r = scoreDeal(
      baseInput({
        warranty: {
          coverageTier: "stated_component",
          termMonths: 60,
          priceQuoted: 2000,
        },
      }),
    );
    expect(r.warranty).toBeTruthy();
    const range = r.warranty!.fairRange;
    expect(range.low).toBeLessThanOrEqual(range.high);
    expect(["low", "medium", "high"]).toContain(range.confidence);
    expect(range.basis.length).toBeGreaterThan(0);
  });

  it("rates an absurdly high quote as very_overpriced and flags it", () => {
    const r = scoreDeal(
      baseInput({
        warranty: {
          coverageTier: "powertrain",
          termMonths: 36,
          priceQuoted: 50_000,
        },
      }),
    );
    expect(r.warranty!.rating).toBe("very_overpriced");
    expect(flagTypes(r.flags)).toContain("overpriced_warranty");
    // The verdict copy must name specifics, not just "above our fair range":
    // the quoted price, the dollar gap, and a concrete counter target.
    const exp = r.warranty!.explanation;
    const usd = (n: number) =>
      n.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      });
    expect(exp).toContain("$50,000"); // the quote, in plain numbers
    expect(exp).toMatch(/\bcounter\b/i); // a concrete next action
    expect(exp).toContain(usd(r.warranty!.fairRange.high)); // the counter target
  });

  it("rates a very low quote as fair", () => {
    const r = scoreDeal(
      baseInput({
        warranty: {
          coverageTier: "powertrain",
          termMonths: 36,
          priceQuoted: 100,
        },
      }),
    );
    expect(r.warranty!.rating).toBe("fair");
  });

  it("charges a higher fair range for a less-reliable luxury brand", () => {
    const reliable = scoreDeal(
      baseInput({
        vehicle: { year: 2021, make: "Toyota", model: "Corolla", mileage: 30_000 },
        warranty: { coverageTier: "exclusionary", termMonths: 60, priceQuoted: 2000 },
      }),
    );
    const luxury = scoreDeal(
      baseInput({
        vehicle: { year: 2021, make: "BMW", model: "5 Series", mileage: 30_000 },
        warranty: { coverageTier: "exclusionary", termMonths: 60, priceQuoted: 2000 },
      }),
    );
    expect(luxury.warranty!.fairRange.high).toBeGreaterThan(
      reliable.warranty!.fairRange.high,
    );
  });
});

describe("scoreDeal — trade-in", () => {
  it("flags a lowball offer well below the buyer's researched value", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 7_000, estimatedValue: 10_000 } }));
    const flag = r.flags.find((f) => f.type === "trade_lowball");
    expect(flag).toBeTruthy();
    expect(flag!.severity).toBe("high"); // $3k gap
    expect(flag!.estimatedImpact!.low).toBeLessThanOrEqual(flag!.estimatedImpact!.high);
  });

  it("does NOT flag an offer within normal dealer margin", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 9_500, estimatedValue: 10_000 } }));
    expect(flagTypes(r.flags)).not.toContain("trade_lowball");
  });

  it("flags negative equity from payoff above the offer", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 7_000, loanPayoff: 11_000 } }));
    const flag = r.flags.find((f) => f.type === "negative_equity");
    expect(flag).toBeTruthy();
    expect(flag!.estimatedImpact).toBeTruthy();
  });

  it("does NOT flag negative equity when the trade has positive equity", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 9_000, loanPayoff: 8_000 } }));
    expect(flagTypes(r.flags)).not.toContain("negative_equity");
  });

  it("nudges (info only) when there's an offer but no value to compare", () => {
    const r = scoreDeal(baseInput({ tradeIn: { offer: 7_000 } }));
    expect(r.flags.some((f) => f.title === "Look up your trade's value")).toBe(true);
    expect(flagTypes(r.flags)).not.toContain("trade_lowball");
  });

  it("adds no trade flags when no trade-in is present", () => {
    const r = scoreDeal(baseInput());
    expect(flagTypes(r.flags)).not.toContain("trade_lowball");
    expect(flagTypes(r.flags)).not.toContain("negative_equity");
  });
});

describe("FLAG_TYPES — canonical list stays complete", () => {
  it("has no duplicates", () => {
    expect(new Set(FLAG_TYPES).size).toBe(FLAG_TYPES.length);
  });

  it("contains every flag type the engine can emit", () => {
    // Deals chosen to trigger the full spread, including the trade nudge (info)
    // and missing-info notes.
    const inputs: FairnessInput[] = [
      baseInput({
        deal: {
          vehiclePrice: 26_000,
          downPayment: 2_000,
          apr: 18,
          termMonths: 72,
          creditBand: "good",
          monthlyPayment: 600,
          fees: [
            { label: "Nitrogen tires", amount: 399 },
            { label: "Documentation fee", amount: 900 },
          ],
        },
        warranty: { coverageTier: "exclusionary", termMonths: 72, priceQuoted: 50_000 },
        tradeIn: { offer: 6_000, estimatedValue: 10_000, loanPayoff: 9_000 },
      }),
      baseInput({ deal: { creditBand: "unknown" } }), // missing-info notes
      baseInput({ tradeIn: { offer: 7_000 } }), // trade nudge → info
    ];
    const seen = new Set<string>();
    for (const i of inputs) for (const f of scoreDeal(i).flags) seen.add(f.type);
    for (const t of seen) {
      expect(FLAG_TYPES, `engine emitted "${t}" but it's missing from FLAG_TYPES`).toContain(
        t as (typeof FLAG_TYPES)[number],
      );
    }
  });
});

describe("scoreDeal — determinism & shape", () => {
  it("is deterministic for identical input", () => {
    const a = scoreDeal(baseInput());
    const b = scoreDeal(baseInput());
    expect(a).toEqual(b);
  });

  it("always returns assumptions and an engine version", () => {
    const r = scoreDeal(
      baseInput({
        warranty: { coverageTier: "stated_component", termMonths: 60, priceQuoted: 2500 },
      }),
    );
    expect(r.engineVersion).toMatch(/placeholder/);
    expect(r.assumptions.length).toBeGreaterThan(0);
  });
});

describe("auditFees — standalone Junk Fee Audit entry point", () => {
  it("flags always-junk items and estimates savings", () => {
    const r = auditFees([
      { label: "Nitrogen tire fill", amount: 199 },
      { label: "Dealer prep", amount: 499 },
    ]);
    expect(r.challengeCount).toBe(2);
    expect(r.flags.length).toBe(2);
    expect(r.estimatedSavings).not.toBeNull();
    expect(r.estimatedSavings!.high).toBeGreaterThan(0);
    expect(r.estimatedSavings!.low).toBeLessThanOrEqual(r.estimatedSavings!.high);
  });

  it("does not flag a legitimate pass-through fee within its ceiling", () => {
    const r = auditFees([{ label: "Title / registration", amount: 300 }]);
    expect(r.challengeCount).toBe(0);
    expect(r.estimatedSavings).toBeNull();
  });

  it("flags a doc fee above its reasonable ceiling", () => {
    const r = auditFees([{ label: "Documentation fee", amount: 900 }]);
    expect(r.challengeCount).toBe(1);
    expect(r.flags[0].title).toMatch(/high/i);
  });

  it("uses the same logic as scoreDeal for the same fees", () => {
    const fees = [{ label: "VIN etching", amount: 350 }];
    const audit = auditFees(fees);
    const full = scoreDeal({
      vehicle: { year: 2021, make: "Toyota", model: "Camry" },
      deal: { fees },
    });
    const fullFeeFlags = full.flags.filter(
      (f) => f.type === "junk_fee" || f.type === "overpriced_addon",
    );
    expect(audit.flags).toEqual(fullFeeFlags);
  });

  it("returns an empty, safe result for no fees", () => {
    const r = auditFees([]);
    expect(r.challengeCount).toBe(0);
    expect(r.flags).toEqual([]);
    expect(r.estimatedSavings).toBeNull();
  });
});
