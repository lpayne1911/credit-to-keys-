import { describe, it, expect } from "vitest";
import { classifyFeeLabel, reviewFees, type FeeRiskAssessment } from "./fee-classifier";

describe("classifyFeeLabel", () => {
  it("maps representative labels to the right category", () => {
    expect(classifyFeeLabel("Processing fee")).toBe("doc_fee");
    expect(classifyFeeLabel("Documentation fee")).toBe("doc_fee");
    expect(classifyFeeLabel("Reconditioning")).toBe("dealer_addon");
    expect(classifyFeeLabel("Dealer prep fee")).toBe("dealer_addon");
    expect(classifyFeeLabel("Nitrogen tire fill")).toBe("junk_fee");
    expect(classifyFeeLabel("VIN etching")).toBe("junk_fee");
    expect(classifyFeeLabel("Market adjustment")).toBe("junk_fee");
    expect(classifyFeeLabel("Registration")).toBe("registration");
    expect(classifyFeeLabel("Electronic filing fee")).toBe("registration");
    expect(classifyFeeLabel("Title & registration")).toBe("title");
    expect(classifyFeeLabel("Sales tax")).toBe("tax");
    expect(classifyFeeLabel("Government fee")).toBe("government_fee");
    expect(classifyFeeLabel("Wombat surcharge")).toBe("unknown");
    expect(classifyFeeLabel("")).toBe("unknown");
  });
});

function severities(a: FeeRiskAssessment): string[] {
  return a.messages.map((m) => m.severity);
}
function docMessage(a: FeeRiskAssessment) {
  return a.messages.find((m) => /doc|processing/i.test(m.title));
}

describe("reviewFees — verified/seeded capped states", () => {
  it("flags a doc fee above a hard-cap state's cap as critical", () => {
    const a = reviewFees([{ label: "Doc fee", amount: 500 }], "CA");
    expect(a.state).toBe("CA");
    expect(a.ruleStatus).toBe("seeded");
    expect(severities(a)).toContain("critical");
    expect(a.messages.some((m) => /above the known cap/i.test(m.title))).toBe(true);
    expect(a.lineItems[0].category).toBe("doc_fee");
  });

  it("produces a stronger warning copy that says 'appears higher' and asks to confirm", () => {
    const a = reviewFees([{ label: "Doc fee", amount: 500 }], "CA");
    const text = a.messages.map((m) => m.message).join("  ");
    expect(/appears higher/i.test(text)).toBe(true);
    expect(/in writing/i.test(text)).toBe(true);
  });

  it("does NOT raise a critical for a doc fee in an uncapped seeded state", () => {
    const a = reviewFees([{ label: "Doc fee", amount: 700 }], "FL");
    expect(severities(a)).not.toContain("critical");
    expect(severities(a)).toContain("warning");
  });
});

describe("reviewFees — unverified / unknown states make NO cap comparison", () => {
  it("treats a high doc fee in a needs_research state as a review item, not a cap/legal warning", () => {
    const a = reviewFees([{ label: "Doc fee", amount: 900 }], "WY");
    expect(a.ruleStatus).toBe("needs_research");
    expect(severities(a)).not.toContain("critical");
    const dm = docMessage(a);
    expect(dm?.severity).toBe("warning");
    expect(/review item/i.test(dm?.title ?? "")).toBe(true);
    // No cap comparison wording.
    expect(/above the known cap|appears higher/i.test(dm?.message ?? "")).toBe(false);
    expect(/does not yet have a verified doc-fee cap/i.test(dm?.message ?? "")).toBe(true);
  });

  it("stays low-confidence and never criticals when the state is unknown", () => {
    const a = reviewFees([{ label: "Processing fee", amount: 900 }], null);
    expect(a.state).toBeNull();
    expect(a.ruleConfidence).toBe("low");
    expect(a.ruleStatus).toBe("unknown");
    expect(severities(a)).not.toContain("critical");
    // Prompts the buyer for location.
    expect(a.messages.some((m) => /needs your location/i.test(m.title))).toBe(true);
  });
});

describe("reviewFees — general behavior", () => {
  it("warns on a suspicious dealer-added fee without an automatic critical", () => {
    const a = reviewFees([{ label: "Nitrogen tire fill", amount: 299 }], "TX");
    expect(a.lineItems[0].category).toBe("junk_fee");
    expect(a.messages.some((m) => /dealer-added/i.test(m.title))).toBe(true);
    expect(severities(a)).not.toContain("critical");
  });

  it("always includes a tax/title/registration sanity check", () => {
    const a = reviewFees([{ label: "Doc fee", amount: 100 }], "CA");
    expect(a.messages.some((m) => /sanity check/i.test(m.title))).toBe(true);
  });

  it("never uses unsafe or absolute wording in any message", () => {
    const inputs: Array<[{ label: string; amount: number }[], string | null]> = [
      [[{ label: "Doc fee", amount: 999 }], "CA"],
      [[{ label: "Doc fee", amount: 999 }], "WY"],
      [[{ label: "Nitrogen", amount: 299 }, { label: "Title", amount: 90 }], "FL"],
      [[{ label: "Processing fee", amount: 400 }], null],
    ];
    const FORBIDDEN = [
      /illegal/i, /\bfraud/i, /\bscam\b/i, /guaranteed/i, /\bdefinitely\b/i,
      /violates law/i, /broke the law/i, /legal finding/i, /\bmust\b/i, /\bwill\b/i,
    ];
    for (const [fees, state] of inputs) {
      const text = reviewFees(fees, state)
        .messages.flatMap((m) => [m.title, m.message])
        .join("  ");
      for (const re of FORBIDDEN) {
        expect(re.test(text), `matched ${re} for state ${state}`).toBe(false);
      }
    }
  });
});
