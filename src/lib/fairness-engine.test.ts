import { describe, it, expect } from "vitest";
import {
  scoreDeal,
  auditFees,
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
