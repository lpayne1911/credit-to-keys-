import { describe, it, expect } from "vitest";
import {
  reviewFiProducts,
  parseNumericInput,
  PRODUCT_LABEL_DISPLAY,
  OVERALL_LABEL_DISPLAY,
  type FiReviewInput,
  type FiProductInput,
  type ProductCategory,
} from "./fi-product-review";

/**
 * Behavior tests for the F&I pilot engine. The engine is deterministic and
 * rule-based; these pin its observable contract (labels, roll-up, confidence,
 * the always-present buyer-side guidance) and — critically — that it never
 * emits unsafe, overconfident, or legal-determination language.
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

/** Every buyer-facing string the engine can emit, for one result. */
function allText(r: ReturnType<typeof reviewFiProducts>): string {
  return [
    r.overallSummary,
    r.overallDisplayLabel,
    ...r.nextSteps,
    ...r.documentChecklist,
    ...r.productResults.flatMap((p) => [
      p.displayLabel,
      p.suggestedScript,
      ...p.reasons,
      ...p.questionsToAsk,
    ]),
  ].join("  ");
}

describe("parseNumericInput", () => {
  it("returns null for blank, whitespace, and garbage", () => {
    expect(parseNumericInput("")).toBeNull();
    expect(parseNumericInput("   ")).toBeNull();
    expect(parseNumericInput("abc")).toBeNull();
    expect(parseNumericInput(".")).toBeNull();
  });

  it("strips $, commas, and % from real-looking input", () => {
    expect(parseNumericInput("$26,000")).toBe(26_000);
    expect(parseNumericInput("1,800.50")).toBe(1800.5);
    expect(parseNumericInput("7%")).toBe(7);
  });

  it("ignores negatives and never returns NaN or a stray zero", () => {
    expect(parseNumericInput("-5")).toBeNull();
    expect(parseNumericInput("0")).toBe(0);
    expect(parseNumericInput("not a number")).toBeNull();
  });
});

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

  it("leans challenge_hard for an expensive, unclear product before signing", () => {
    const r = reviewFiProducts(
      input({
        signed: "not_yet",
        products: [product({ price: 3500 })],
        concerns: ["dont_understand"],
      }),
    );
    expect(r.productResults[0].label).toBe("challenge_hard");
  });

  it("leans only_if_discounted for a heavy GAP price before signing", () => {
    const r = reviewFiProducts(
      input({ products: [product({ category: "gap", price: 1500 })] }),
    );
    expect(r.productResults[0].label).toBe("only_if_discounted");
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
  it("returns needs_documents and asks for a product when none are entered", () => {
    const r = reviewFiProducts(input({ products: [] }));
    expect(r.overallLabel).toBe("needs_documents");
    expect(OVERALL_LABEL_DISPLAY[r.overallLabel]).toBe(r.overallDisplayLabel);
    expect(/at least one/i.test(r.overallSummary)).toBe(true);
    expect(r.productResults).toHaveLength(0);
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
    expect(r.confidence).not.toBe("high");
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

  it("reflects the highest risk across mixed products without dropping the others", () => {
    const r = reviewFiProducts(
      input({
        products: [
          product({ toldRequired: "yes" }), // dangerous
          product({ category: "gap", price: 500 }), // worth_considering
        ],
      }),
    );
    expect(r.overallLabel).toBe("challenge_before_signing");
    expect(r.productResults).toHaveLength(2);
    expect(r.productResults[0].label).toBe("dangerous_or_misrepresented");
    expect(r.productResults[1].label).toBe("worth_considering");
  });
});

describe("reviewFiProducts — edge cases & category handling", () => {
  it("handles the 'other' category with generic add-on language and no crash", () => {
    const r = reviewFiProducts(
      input({ products: [product({ category: "other", price: 400 })] }),
    );
    expect(r.productResults[0].categoryLabel).toBe("Other add-on");
  });

  it("treats a blank price as missing, not as a $0 fair price", () => {
    const r = reviewFiProducts(input({ products: [product({ price: null })] }));
    const text = allText(r);
    expect(/no price was entered/i.test(text)).toBe(true);
    expect(/\$0/.test(text)).toBe(false);
  });

  it("raises a payment-packing reason and an itemized-price question", () => {
    const r = reviewFiProducts(input({ concerns: ["packed_into_payment"] }));
    const pr = r.productResults[0];
    expect(pr.reasons.some((x) => /packed into the monthly payment/i.test(x))).toBe(true);
    expect(pr.questionsToAsk.some((x) => /dollar amount/i.test(x))).toBe(true);
  });

  it("raises a factory-overlap concern for a service contract but does not auto-cancel", () => {
    const r = reviewFiProducts(
      input({ vehicleCondition: "new", products: [product({ category: "vsc", price: 1800 })] }),
    );
    const pr = r.productResults[0];
    expect(pr.reasons.some((x) => /overlap/i.test(x))).toBe(true);
    expect(pr.label).not.toBe("cancel_if_possible");
  });

  it("allows a high-mileage used-car service contract to be worth considering / only if discounted", () => {
    const r = reviewFiProducts(
      input({
        vehicleCondition: "used",
        vehicle: { ...input().vehicle, mileage: 95_000 },
        products: [product({ category: "vsc", price: 1800 })],
      }),
    );
    expect(["worth_considering", "only_if_discounted"]).toContain(
      r.productResults[0].label,
    );
  });

  it("asks GAP-specific questions about equity/down payment without giving insurance advice", () => {
    const r = reviewFiProducts(
      input({ products: [product({ category: "gap", price: 700 })] }),
    );
    const pr = r.productResults[0];
    expect(
      pr.questionsToAsk.some((x) => /negative equity|down payment/i.test(x)),
    ).toBe(true);
  });

  it("drops confidence and asks for core documents when vehicle basics are missing", () => {
    const r = reviewFiProducts(
      input({
        vehicle: {
          year: null,
          make: null,
          model: null,
          mileage: null,
          purchaseState: null,
          price: null,
          termMonths: null,
          apr: null,
          downPayment: null,
        },
      }),
    );
    expect(r.confidence).not.toBe("high");
    const docs = r.documentChecklist.join("  ");
    expect(/buyer's order/i.test(docs)).toBe(true);
    expect(/retail installment/i.test(docs)).toBe(true);
    expect(/f&i product/i.test(docs)).toBe(true);
  });
});

describe("reviewFiProducts — always-on guidance & confidence", () => {
  it("always returns next steps and a document checklist", () => {
    const r = reviewFiProducts(input());
    expect(r.nextSteps.length).toBeGreaterThan(0);
    expect(r.documentChecklist.length).toBeGreaterThan(0);
    expect(r.nextSteps.some((s) => /reference point/i.test(s))).toBe(true);
  });

  it("reports high confidence when the deal and products are fully described", () => {
    const r = reviewFiProducts(input());
    expect(r.confidence).toBe("high");
  });

  it("tells an already-signed buyer to request the cancellation form, not that they can cancel", () => {
    const r = reviewFiProducts(
      input({
        signed: "signed",
        products: [product({ inContract: "yes", price: 3200 })],
        concerns: ["already_signed_cancel"],
      }),
    );
    const text = allText(r);
    expect(/cancellation form/i.test(text)).toBe(true);
    expect(/you can cancel/i.test(text)).toBe(false);
  });
});

describe("reviewFiProducts — never emits unsafe or overconfident language", () => {
  // A wide input that lights up every branch.
  const wide = input({
    signed: "signed",
    products: [
      product({ toldRequired: "yes", inContract: "yes", price: 4000 }),
      product({ category: "gap", price: null, cancellationVisible: "not_sure", inContract: "not_sure", termMonths: null, mileageLimit: null }),
      product({ category: "appearance", price: 1500 }),
      product({ category: "other", price: 300 }),
    ],
    concerns: [
      "told_required",
      "packed_into_payment",
      "already_signed_cancel",
      "duplicates_factory",
      "dont_understand",
      "overpriced",
      "need_script",
    ],
  });

  const FORBIDDEN: RegExp[] = [
    /illegal/i,
    /\bfraud/i,
    /\bguarantee/i,
    /you can cancel/i,
    /will be refunded/i,
    /stop paying/i,
    /\bfair price\b/i,
    /required by (the )?lender/i,
    /\bdefinitely\b/i,
  ];

  it("avoids every forbidden phrase across all output strings", () => {
    const text = allText(reviewFiProducts(wide));
    for (const re of FORBIDDEN) {
      expect(re.test(text), `should not match ${re}`).toBe(false);
    }
  });

  it("never asserts an exact fair price even on a very high charge", () => {
    const r = reviewFiProducts(input({ products: [product({ price: 9000 })] }));
    expect(/\bfair price\b/i.test(allText(r))).toBe(false);
  });
});
