import { describe, it, expect } from "vitest";
import {
  reviewUsedCar,
  OVERALL_DISPLAY,
  type UsedCarRiskInput,
  type UsedCarStatus,
  type UsedCarVehicle,
  type UsedCarRiskResult,
} from "./used-car-risk";

/**
 * Behavior tests for the Used-Car Risk pilot engine — deterministic and
 * rule-based. These pin the labels, the roll-up, the always-on guidance, and
 * (critically) that the engine never emits unsafe, accusatory, or guaranteeing
 * language.
 */

function vehicle(overrides: Partial<UsedCarVehicle> = {}): UsedCarVehicle {
  return {
    year: 2019,
    make: "Toyota",
    model: "Camry",
    trim: "SE",
    mileage: 48_000,
    askingPrice: 18_500,
    outTheDoorPrice: 20_100,
    purchaseState: "MD",
    sellerType: "franchise_dealer",
    ...overrides,
  };
}

function status(overrides: Partial<UsedCarStatus> = {}): UsedCarStatus {
  return {
    titleStatus: "clean",
    accidentHistory: "none_reported",
    useHistory: "personal",
    numberOfOwners: "one",
    openRecalls: "none_known",
    cpoClaimed: "no",
    ...overrides,
  };
}

function input(overrides: Partial<UsedCarRiskInput> = {}): UsedCarRiskInput {
  return {
    signed: "not_yet",
    vehicle: vehicle(),
    status: status(),
    concerns: [],
    ...overrides,
  };
}

function emptyInput(): UsedCarRiskInput {
  return {
    signed: "not_sure",
    vehicle: {
      year: null,
      make: null,
      model: null,
      trim: null,
      mileage: null,
      askingPrice: null,
      outTheDoorPrice: null,
      purchaseState: null,
      sellerType: "not_sure",
    },
    status: {
      titleStatus: "unknown",
      accidentHistory: "unknown",
      useHistory: "unknown",
      numberOfOwners: "unknown",
      openRecalls: "unknown",
      cpoClaimed: "not_sure",
    },
    concerns: [],
  };
}

function allText(r: UsedCarRiskResult): string {
  return [
    r.overallDisplay,
    r.overallSummary,
    r.suggestedScript,
    ...r.inspectionPriorities,
    ...r.sellerQuestions,
    ...r.documentChecklist,
    ...r.nextSteps,
    ...r.riskFlags.flatMap((f) => [f.title, f.explanation, f.buyerQuestion]),
  ].join("  ");
}

describe("reviewUsedCar — overall labels", () => {
  it("returns needs_documents for empty input and does not crash", () => {
    const r = reviewUsedCar(emptyInput());
    expect(r.overallLabel).toBe("needs_documents");
    expect(OVERALL_DISPLAY[r.overallLabel]).toBe(r.overallDisplay);
  });

  it("returns low_concern for a clean, well-documented car", () => {
    const r = reviewUsedCar(input());
    expect(r.overallLabel).toBe("low_concern");
    expect(r.riskLevel).toBe("low");
  });

  it("leans walk_away on a salvage title", () => {
    const r = reviewUsedCar(input({ status: status({ titleStatus: "salvage" }) }));
    expect(r.overallLabel).toBe("walk_away");
    expect(r.riskLevel).toBe("severe");
  });

  it("leans walk_away on airbag deployment or structural damage", () => {
    const airbag = reviewUsedCar(
      input({ status: status({ accidentHistory: "airbag_deployed" }) }),
    );
    const structural = reviewUsedCar(
      input({ status: status({ accidentHistory: "structural_damage" }) }),
    );
    expect(airbag.overallLabel).toBe("walk_away");
    expect(structural.overallLabel).toBe("walk_away");
  });

  it("leans inspect_first (or needs_documents) when the history report is missing", () => {
    const r = reviewUsedCar(input({ concerns: ["history_missing"] }));
    expect(["inspect_first", "needs_documents"]).toContain(r.overallLabel);
  });

  it("leans slow_down when the dealer is rushing and the OTD price is missing", () => {
    const r = reviewUsedCar(
      input({
        vehicle: vehicle({ outTheDoorPrice: null }),
        concerns: ["dealer_rushing", "no_full_otd"],
      }),
    );
    expect(r.overallLabel).toBe("slow_down");
  });

  it("rolls multiple mixed risks up to a higher overall concern", () => {
    const r = reviewUsedCar(
      input({
        vehicle: vehicle({ mileage: 135_000 }),
        status: status({ accidentHistory: "moderate", useHistory: "rental" }),
        concerns: ["dealer_rushing"],
      }),
    );
    expect(["renegotiate_or_verify", "walk_away"]).toContain(r.overallLabel);
    expect(r.riskFlags.length).toBeGreaterThanOrEqual(3);
  });
});

describe("reviewUsedCar — flags & priorities", () => {
  it("flags rental/fleet use without an automatic walk-away", () => {
    const r = reviewUsedCar(input({ status: status({ useHistory: "rental" }) }));
    expect(r.riskFlags.some((f) => /rental|fleet/i.test(f.title))).toBe(true);
    expect(r.overallLabel).not.toBe("walk_away");
  });

  it("creates a verification question when CPO is claimed", () => {
    const r = reviewUsedCar(input({ status: status({ cpoClaimed: "yes" }) }));
    expect(r.sellerQuestions.some((q) => /certified pre-owned/i.test(q))).toBe(true);
  });

  it("creates an inspection priority when recalls are open or unchecked", () => {
    const r = reviewUsedCar(input({ status: status({ openRecalls: "yes" }) }));
    expect(r.inspectionPriorities.some((p) => /recall/i.test(p))).toBe(true);
  });

  it("warns harder when already signed with a severe concern, without promising a refund or unwind", () => {
    const r = reviewUsedCar(
      input({ signed: "already_signed", status: status({ titleStatus: "salvage" }) }),
    );
    expect(r.overallLabel).toBe("walk_away");
    expect(r.nextSteps.some((s) => /already signed/i.test(s))).toBe(true);
    const text = allText(r);
    expect(/refund|unwind/i.test(text)).toBe(false);
  });

  it("always returns inspection priorities, questions, documents, next steps, and a script", () => {
    const r = reviewUsedCar(input());
    expect(r.inspectionPriorities.length).toBeGreaterThan(0);
    expect(r.sellerQuestions.length).toBeGreaterThan(0);
    expect(r.documentChecklist.length).toBeGreaterThan(0);
    expect(r.nextSteps.length).toBeGreaterThan(0);
    expect(r.suggestedScript.length).toBeGreaterThan(0);
    expect(r.nextSteps.some((s) => /reference point/i.test(s))).toBe(true);
  });
});

describe("reviewUsedCar — never emits unsafe or overconfident language", () => {
  const FORBIDDEN: RegExp[] = [
    /\bunsafe\b/i,
    /illegal/i,
    /\bfraud/i,
    /guaranteed/i,
    /\bunwind\b/i,
    /exact value/i,
    /will fail/i,
    /\bdefinitely\b/i,
    /stop paying/i,
  ];

  const cases: UsedCarRiskInput[] = [
    emptyInput(),
    input(),
    input({ signed: "already_signed", status: status({ titleStatus: "salvage" }) }),
    input({
      status: status({
        titleStatus: "rebuilt",
        accidentHistory: "structural_damage",
        useHistory: "rideshare",
        openRecalls: "yes",
        cpoClaimed: "yes",
      }),
      vehicle: vehicle({ mileage: 165_000, outTheDoorPrice: null }),
      concerns: [
        "price_too_good",
        "dealer_rushing",
        "history_missing",
        "inspection_not_needed",
        "mileage_inconsistent",
        "already_signed_trapped",
      ],
    }),
  ];

  it("avoids every forbidden phrase across all output strings", () => {
    for (const c of cases) {
      const text = allText(reviewUsedCar(c));
      for (const re of FORBIDDEN) {
        expect(re.test(text), `matched ${re}`).toBe(false);
      }
    }
  });
});
