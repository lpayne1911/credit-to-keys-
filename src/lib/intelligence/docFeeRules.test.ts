import { describe, it, expect } from "vitest";
import {
  isDocFeeAlias,
  getDocFeeRuleForState,
  classifyDocFeeAmount,
  DOC_FEE_RULES,
  SOURCED_JURISDICTIONS,
  VERIFIED_JURISDICTIONS,
  US_JURISDICTIONS,
  type DocFeeFinding,
} from "./docFeeRules";

const cents = (d: number) => d * 100;

/** Forbidden, non-conservative / legal-conclusion language. */
const FORBIDDEN =
  /\b(illegal|fraud|scam|guaranteed|definitely|lied)\b|violates? law|broke the law|legal finding/i;

const SCOPED_VERIFIED = ["CA", "NY", "TX", "OH", "FL", "VA", "MD"];
const SCOPED_SEEDED = ["DC", "DE"];

describe("isDocFeeAlias", () => {
  it("detects doc/processing/admin fee aliases", () => {
    for (const name of [
      "Doc Fee",
      "documentation fee",
      "Document Processing Fee",
      "Dealer Processing Fee",
      "processing fee",
      "admin fee",
      "Administrative Fee",
      "paperwork fee",
      "Documentary Service Charge",
      "Dealer Service Fee",
    ]) {
      expect(isDocFeeAlias(name), name).toBe(true);
    }
  });

  it("does NOT match warranty, tax, or government lines (false positives)", () => {
    for (const name of [
      "service contract",
      "vehicle service contract",
      "state registration",
      "sales tax",
      "title fee",
      "registration fee",
      "service fee",
      "GAP insurance",
    ]) {
      expect(isDocFeeAlias(name), name).toBe(false);
    }
  });

  it("is empty-safe", () => {
    expect(isDocFeeAlias("")).toBe(false);
  });
});

describe("getDocFeeRuleForState", () => {
  it("is case-insensitive and returns a rule for known states", () => {
    expect(getDocFeeRuleForState("md")?.jurisdiction).toBe("MD");
    expect(getDocFeeRuleForState("MD")?.stateName).toBe("Maryland");
  });
  it("returns undefined for an unknown code", () => {
    expect(getDocFeeRuleForState("ZZ")).toBeUndefined();
    expect(getDocFeeRuleForState("")).toBeUndefined();
  });
});

describe("priority verification pass — registry status", () => {
  it("scoped states carry the correct verification status", () => {
    for (const code of SCOPED_VERIFIED) {
      expect(DOC_FEE_RULES[code].verificationStatus, code).toBe("verified");
    }
    for (const code of SCOPED_SEEDED) {
      expect(DOC_FEE_RULES[code].verificationStatus, code).toBe("seeded");
    }
  });

  it("verified states have non-null source name, url, and lastVerified", () => {
    for (const code of VERIFIED_JURISDICTIONS) {
      const r = DOC_FEE_RULES[code];
      expect(r.sourceTitle, `${code} sourceTitle`).toBeTruthy();
      expect(r.sourceUrl, `${code} sourceUrl`).toBeTruthy();
      expect(r.lastVerified, `${code} lastVerified`).toBeTruthy();
      expect(r.sourceType, `${code} sourceType`).toBeTruthy();
    }
  });

  it("only the 7 scoped states are verified — nothing else was flipped", () => {
    expect([...VERIFIED_JURISDICTIONS].sort()).toEqual([...SCOPED_VERIFIED].sort());
  });

  it("states that are not verified never claim high confidence", () => {
    for (const r of Object.values(DOC_FEE_RULES)) {
      if (r.verificationStatus !== "verified") {
        expect(r.confidence, `${r.jurisdiction} should not be high`).not.toBe("high");
      }
    }
  });

  it("no unscoped state was accidentally flipped to verified", () => {
    const unscoped = ["IL", "PA", "NC", "GA", "NJ", "CO", "AZ", "AL", "WA", "MI"];
    for (const code of unscoped) {
      expect(DOC_FEE_RULES[code].verificationStatus, code).not.toBe("verified");
    }
  });

  it("Maryland, Virginia, Delaware, and DC all have explicit registry entries", () => {
    for (const code of ["MD", "VA", "DE", "DC"]) {
      const r = DOC_FEE_RULES[code];
      expect(r, code).toBeTruthy();
      expect(r.verificationStatus, code).not.toBe("needs_research");
      expect(r.sourceUrl, `${code} has a source`).toBeTruthy();
    }
  });

  it("does not invent a cap for uncapped / disclosure-only states", () => {
    for (const code of ["FL", "VA", "DE", "DC"]) {
      expect(DOC_FEE_RULES[code].maxAmountCents, code).toBeUndefined();
    }
  });
});

describe("classifyDocFeeAmount", () => {
  it("flags a non-doc fee as not_doc_fee", () => {
    const f = classifyDocFeeAmount({
      stateCode: "MD",
      feeName: "vehicle service contract",
      amountCents: cents(2000),
    });
    expect(f.isDocFee).toBe(false);
    expect(f.status).toBe("not_doc_fee");
  });

  it("verified capped state, within cap → within_cap", () => {
    const f = classifyDocFeeAmount({
      stateCode: "NY", // verified, $175
      feeName: "documentation fee",
      amountCents: cents(150),
    });
    expect(f.status).toBe("within_cap");
    expect(f.withinCap).toBe(true);
    expect(f.verified).toBe(true);
    expect(f.source?.url).toBeTruthy();
  });

  it("verified capped state, over cap → over_cap with stronger, safe warning", () => {
    const f = classifyDocFeeAmount({
      stateCode: "MD", // verified, $800
      feeName: "dealer processing fee",
      amountCents: cents(950),
    });
    expect(f.status).toBe("over_cap");
    expect(f.overCap).toBe(true);
    expect(f.humanReviewRecommended).toBe(true);
    expect(f.explanation).toMatch(/above the known cap/i);
    expect(f.explanation).toMatch(/not a legal determination/i);
  });

  it("verified formula state compares against the threshold (TX $225)", () => {
    expect(
      classifyDocFeeAmount({ stateCode: "TX", feeName: "documentary fee", amountCents: cents(200) }).status,
    ).toBe("within_cap");
    expect(
      classifyDocFeeAmount({ stateCode: "TX", feeName: "documentary fee", amountCents: cents(400) }).status,
    ).toBe("over_cap");
  });

  it("verified disclosure-only state never produces a cap-overage warning", () => {
    for (const code of ["FL", "VA"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "doc fee", amountCents: cents(999) });
      expect(f.status, code).toBe("disclosure_only");
      expect(f.overCap, code).toBeUndefined();
    }
  });

  it("seeded uncapped state → uncapped_dealer_controlled, no overage (DE, DC, NJ)", () => {
    for (const code of ["DE", "DC", "NJ"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "dealer doc fee", amountCents: cents(900) });
      expect(f.status, code).toBe("uncapped_dealer_controlled");
      expect(f.overCap, code).toBeUndefined();
      expect(f.explanation, code).toMatch(/dealer-controlled/i);
    }
  });

  it("seeded state with a tentative cap does NOT produce a cap comparison (IL, PA)", () => {
    for (const code of ["IL", "PA"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "documentary fee", amountCents: cents(2000) });
      expect(f.status, code).toBe("unverified_rule");
      expect(f.withinCap, code).toBeUndefined();
      expect(f.overCap, code).toBeUndefined();
      expect(f.humanReviewRecommended, code).toBe(true);
    }
  });

  it("conflicting-source state → unknown_rule, no comparison (AZ)", () => {
    const f = classifyDocFeeAmount({ stateCode: "AZ", feeName: "doc fee", amountCents: cents(500) });
    expect(f.status).toBe("unknown_rule");
    expect(f.overCap).toBeUndefined();
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("needs-research state → needs_research, no comparison (AL)", () => {
    const f = classifyDocFeeAmount({ stateCode: "AL", feeName: "doc fee", amountCents: cents(500) });
    expect(f.status).toBe("needs_research");
    expect(f.overCap).toBeUndefined();
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("missing state → state_missing (no false certainty)", () => {
    const f = classifyDocFeeAmount({ stateCode: undefined, feeName: "doc fee", amountCents: cents(500) });
    expect(f.status).toBe("state_missing");
    expect(f.overCap).toBeUndefined();
    expect(f.humanReviewRecommended).toBe(true);
  });
});

describe("compliance: conservative, non-legal language", () => {
  it("classifier outputs never use forbidden phrases", () => {
    const findings: DocFeeFinding[] = [
      classifyDocFeeAmount({ stateCode: "MD", feeName: "doc fee", amountCents: cents(999) }),
      classifyDocFeeAmount({ stateCode: "NY", feeName: "doc fee", amountCents: cents(999) }),
      classifyDocFeeAmount({ stateCode: "FL", feeName: "doc fee", amountCents: cents(999) }),
      classifyDocFeeAmount({ stateCode: "DE", feeName: "doc fee", amountCents: cents(800) }),
      classifyDocFeeAmount({ stateCode: "IL", feeName: "doc fee", amountCents: cents(2000) }),
      classifyDocFeeAmount({ stateCode: "AZ", feeName: "doc fee", amountCents: cents(500) }),
      classifyDocFeeAmount({ stateCode: "AL", feeName: "doc fee", amountCents: cents(500) }),
      classifyDocFeeAmount({ stateCode: undefined, feeName: "doc fee", amountCents: cents(500) }),
    ];
    for (const f of findings) {
      expect(FORBIDDEN.test(f.explanation), f.explanation).toBe(false);
      expect(FORBIDDEN.test(f.action), f.action).toBe(false);
    }
  });

  it("every rule's customer-facing copy avoids forbidden phrases", () => {
    for (const rule of Object.values(DOC_FEE_RULES)) {
      expect(FORBIDDEN.test(rule.buyerExplanation), rule.jurisdiction).toBe(false);
      expect(FORBIDDEN.test(rule.buyerAction), rule.jurisdiction).toBe(false);
    }
  });
});

describe("data quality", () => {
  it("covers 50 states + DC; 16 sourced, 7 verified", () => {
    expect(Object.keys(US_JURISDICTIONS)).toHaveLength(51);
    expect(Object.keys(DOC_FEE_RULES)).toHaveLength(51);
    expect(SOURCED_JURISDICTIONS).toHaveLength(16);
    expect(VERIFIED_JURISDICTIONS).toHaveLength(7);
  });

  it("every sourced rule carries full source metadata and safe semantics", () => {
    for (const code of SOURCED_JURISDICTIONS) {
      const r = DOC_FEE_RULES[code];
      expect(r.sourceUrl, `${code} sourceUrl`).toBeTruthy();
      expect(r.sourceTitle, `${code} sourceTitle`).toBeTruthy();
      expect(r.sourceType, `${code} sourceType`).toBeTruthy();
      expect(r.sourceQuote, `${code} sourceQuote`).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(r.confidence);
      expect(r.capType).not.toBe("needs_research");
      expect(r.dealerControlled).toBe(true);
      expect(r.governmentFee).toBe(false);
      // tri-state fields are boolean or null, never undefined
      expect(r.taxable === null || typeof r.taxable === "boolean", `${code} taxable`).toBe(true);
      expect(
        r.mustBeDisclosed === null || typeof r.mustBeDisclosed === "boolean",
        `${code} mustBeDisclosed`,
      ).toBe(true);
    }
  });

  it("verified capped rules have a positive cap amount", () => {
    for (const code of VERIFIED_JURISDICTIONS) {
      const r = DOC_FEE_RULES[code];
      if (r.capType === "capped" || r.capType === "formula") {
        expect(r.maxAmountCents, `${code} cap`).toBeGreaterThan(0);
      }
    }
  });

  it("scaffolds are needs_research, low confidence, no fabricated source", () => {
    const scaffolds = Object.values(DOC_FEE_RULES).filter(
      (r) => r.verificationStatus === "needs_research",
    );
    expect(scaffolds.length).toBe(51 - 16);
    for (const r of scaffolds) {
      expect(r.confidence).toBe("low");
      expect(r.sourceUrl).toBeUndefined();
      expect(r.taxable).toBeNull();
      expect(r.mustBeDisclosed).toBeNull();
      expect(r.dealerControlled).toBe(true);
      expect(r.governmentFee).toBe(false);
    }
  });
});
