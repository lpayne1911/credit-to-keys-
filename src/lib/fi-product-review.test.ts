import { describe, it, expect } from "vitest";
import {
  reviewFiProducts,
  PRODUCT_LABEL_DISPLAY,
  OVERALL_LABEL_DISPLAY,
  type FiReviewInput,
  type FiProductInput,
  type ProductCategory,
} from "./fi-product-review";

/**
 * Behavior tests for the F&I pilot engine. The engine is deterministic and
 * rule-based; these pin its observable contract (labels, roll-up, confidence,
 * and the always-present buyer-side guidance) rather than exact copy.
 */

function product(overrides: Partial<FiProductInput> = {}): FiProductInput {
  return {
    category: "vsc" as ProductCategory,
    name: null,
    price: 1800,
    termMonths: 60,
    mileageLimit: 75_000,
    deductible: 100,
    toldRequired: "no",
    cancellationVisible: "yes",
    inContract: "no",
    ...overrides,
  };
}

function input(overrides: Partial<FiReviewInput> = {}): FiReviewInput {
  return {
    signed: "not_yet",
    vehicleCondition: "used",
    vehicle: {
      year: 2021,
      make: "Toyota",
      model: "Camry",
      mileage: 30_000,
      purchaseState: "TX",
      price: 26_000,
      termMonths: 60,
      apr: 7,
      downPayment: 2_000,
    },
    products: [product()],
    concerns: [],
    ...overrides,
  };
}

describe("reviewFiProducts — product labels", () => {
  it("flags a 'required' optional product as dangerous_or_misrepresented", () => {
    const r = reviewFiProducts(input({ products: [product({ toldRequired: "yes" })] }));
    expect(r.productResults[0].label).toBe("dangerous_or_misrepresented");
    expect(r.productResults[0].concernLevel).toBe("high");
  });

  it("leans cancel_if_possible when already signed and product is in the contract", () => {
    const r = reviewFiProducts(
      input({
        signed: "signed",
        products: [product({ inContract: "yes", price: 3200 })],
      }),
    );
    expect(r.productResults[0].label).toBe("cancel_if_possible");
  });

  it("leans challenge_hard for an expensive product before signing", () => {
    const r = reviewFiProducts(
      input({ signed: "not_yet", products: [product({ price: 3500 })] }),
    );
    expect(r.productResults[0].label).toBe("challenge_hard");
  });

  it("allows worth_considering for a clear, fairly-sized, unpressured product", () => {
    const r = reviewFiProducts(
      input({ products: [product({ category: "gap", price: 500 })] }),
    );
    expect(r.productResults[0].label).toBe("worth_considering");
  });

  it("every product result carries reasons, questions, and a script", () => {
    const r = reviewFiProducts(input());
    for (const pr of r.productResults) {
      expect(pr.reasons.length).toBeGreaterThan(0);
      expect(pr.questionsToAsk.length).toBeGreaterThan(0);
      expect(pr.suggestedScript.length).toBeGreaterThan(0);
      expect(PRODUCT_LABEL_DISPLAY[pr.label]).toBe(pr.displayLabel);
    }
  });
});

describe("reviewFiProducts — overall roll-up", () => {
  it("returns needs_documents when no products are entered", () => {
    const r = reviewFiProducts(input({ products: [] }));
    expect(r.overallLabel).toBe("needs_documents");
    expect(OVERALL_LABEL_DISPLAY[r.overallLabel]).toBe(r.overallDisplayLabel);
  });

  it("returns needs_documents when most products are missing key fields", () => {
    const bare = product({
      price: null,
      termMonths: null,
      mileageLimit: null,
      inContract: "not_sure",
      cancellationVisible: "not_sure",
    });
    const r = reviewFiProducts(input({ products: [bare] }));
    expect(r.overallLabel).toBe("needs_documents");
    expect(r.confidence).toBe("low");
  });

  it("escalates to cancel_or_escalate when signed with a cancel-worthy product", () => {
    const r = reviewFiProducts(
      input({
        signed: "signed",
        products: [product({ inContract: "yes", price: 3200 })],
        concerns: ["already_signed_cancel"],
      }),
    );
    expect(r.overallLabel).toBe("cancel_or_escalate");
  });

  it("flags challenge_before_signing when an unsigned deal has a required claim", () => {
    const r = reviewFiProducts(
      input({ signed: "not_yet", products: [product({ toldRequired: "yes" })] }),
    );
    expect(r.overallLabel).toBe("challenge_before_signing");
  });
});

describe("reviewFiProducts — always-on guidance & confidence", () => {
  it("always returns next steps and a document checklist", () => {
    const r = reviewFiProducts(input());
    expect(r.nextSteps.length).toBeGreaterThan(0);
    expect(r.documentChecklist.length).toBeGreaterThan(0);
    // The pilot/decision-support framing must always be present.
    expect(r.nextSteps.some((s) => /reference point/i.test(s))).toBe(true);
  });

  it("reports high confidence when the deal and products are fully described", () => {
    const r = reviewFiProducts(input());
    expect(r.confidence).toBe("high");
  });

  it("never asserts an exact fair price in its summary or reasons", () => {
    const r = reviewFiProducts(input({ products: [product({ price: 5000 })] }));
    const text = [
      r.overallSummary,
      ...r.productResults.flatMap((p) => p.reasons),
    ].join(" ");
    expect(/fair price/i.test(text)).toBe(false);
  });
});
