import { describe, it, expect } from "vitest";
import { getStateFeeRule, STATE_FEE_RULES, ALL_STATE_CODES } from "./fee-rules";

const FORBIDDEN = [
  /illegal/i,
  /\bfraud/i,
  /\bscam\b/i,
  /guaranteed/i,
  /\bdefinitely\b/i,
  /violates law/i,
  /broke the law/i,
  /legal finding/i,
];

describe("state fee-rule registry — coverage", () => {
  it("covers all 50 states + DC (51 codes)", () => {
    expect(ALL_STATE_CODES.length).toBe(51);
    expect(ALL_STATE_CODES).toContain("DC");
    expect(Object.keys(STATE_FEE_RULES).length).toBe(ALL_STATE_CODES.length);
  });

  it("returns a complete rule object for every supported code", () => {
    for (const code of ALL_STATE_CODES) {
      const r = getStateFeeRule(code);
      expect(r.stateCode).toBe(code);
      expect(r.stateName.length).toBeGreaterThan(0);
      expect(r.docFeePolicy).toBeTruthy();
      expect(r.source.verificationStatus).toBeTruthy();
      expect(["low", "medium", "high"]).toContain(r.confidenceLevel);
    }
  });

  it("returns DC as a real rule object", () => {
    expect(getStateFeeRule("DC").stateName).toBe("District of Columbia");
  });

  it("never invents source URLs", () => {
    for (const code of ALL_STATE_CODES) {
      expect(getStateFeeRule(code).source.sourceUrl).toBeNull();
      expect(getStateFeeRule(code).source.sourceName).toBeNull();
    }
  });
});

describe("state fee-rule registry — verification model", () => {
  it("preserves seeded states (CA hard cap, FL uncapped) case-insensitively", () => {
    const ca = getStateFeeRule("ca");
    expect(ca.docFeePolicy.capType).toBe("hard_cap");
    expect(ca.docFeePolicy.capAmount).toBe(85);
    expect(ca.source.verificationStatus).toBe("seeded");

    const fl = getStateFeeRule("FL");
    expect(fl.docFeePolicy.capType).toBe("uncapped");
    expect(fl.docFeePolicy.capAmount).toBeNull();
    expect(fl.source.verificationStatus).toBe("seeded");
  });

  it("marks unseeded states needs_research with null cap + low confidence", () => {
    const wy = getStateFeeRule("WY");
    expect(wy.source.verificationStatus).toBe("needs_research");
    expect(wy.docFeePolicy.capType).toBe("unknown");
    expect(wy.docFeePolicy.capAmount).toBeNull();
    expect(wy.docFeePolicy.taxable).toBeNull();
    expect(wy.docFeePolicy.mustBeDisclosed).toBeNull();
    expect(wy.confidenceLevel).toBe("low");
  });

  it("returns a safe fallback for null / empty / unrecognized input, no crash", () => {
    expect(getStateFeeRule(null).stateCode).toBe("UNKNOWN");
    expect(getStateFeeRule(null).source.verificationStatus).toBe("unknown");
    expect(getStateFeeRule("").source.verificationStatus).toBe("unknown");
    const zz = getStateFeeRule("ZZ");
    expect(zz.source.verificationStatus).toBe("unknown");
    expect(zz.docFeePolicy.capType).toBe("unknown");
    expect(zz.docFeePolicy.capAmount).toBeNull();
  });
});

describe("state fee-rule registry — conservative, compliance-safe language", () => {
  it("uses review-only language (no legal claim) for unverified states", () => {
    const text = [
      getStateFeeRule("WY").docFeePolicy.customerLanguage,
      getStateFeeRule(null).docFeePolicy.customerLanguage,
    ].join("  ");
    expect(/review item/i.test(text)).toBe(true);
  });

  it("never emits a forbidden phrase across all states' customer language", () => {
    const text = ALL_STATE_CODES.concat(["", "ZZ"])
      .map((c) => {
        const r = getStateFeeRule(c || null);
        return [r.docFeePolicy.customerLanguage, r.docFeePolicy.negotiabilityGuidance, r.governmentFeePolicy.customerLanguage].join("  ");
      })
      .join("  ");
    for (const re of FORBIDDEN) {
      expect(re.test(text), `matched ${re}`).toBe(false);
    }
  });
});
