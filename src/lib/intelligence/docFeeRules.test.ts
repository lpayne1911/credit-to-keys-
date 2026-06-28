import { describe, it, expect } from "vitest";
import {
  isDocFeeAlias,
  getDocFeeRuleForState,
  classifyDocFeeAmount,
  buildDocFeeFinding,
  DOC_FEE_RULES,
  SOURCED_JURISDICTIONS,
  VERIFIED_JURISDICTIONS,
  US_JURISDICTIONS,
  type DocFeeFinding,
  type DocFeeRule,
} from "./docFeeRules";

const cents = (d: number) => d * 100;

/** Forbidden, non-conservative / legal-conclusion language. */
const FORBIDDEN =
  /\b(illegal|fraud|scam|guaranteed|definitely|lied)\b|violates? law|broke the law|legal finding/i;

/** All customer-facing strings on a finding. */
function customerCopy(f: DocFeeFinding): string {
  return [f.buyerSummary, f.whyItMatters, f.whatToAsk, f.scriptLine, f.explanation, f.action].join(
    " \n ",
  );
}

// Verified after the priority pass + the NC/GA/NJ/CO verification pass.
const SCOPED_VERIFIED = ["CA", "NY", "TX", "OH", "FL", "VA", "MD", "NC", "GA", "NJ", "CO"];
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

  it("does NOT match warranty, tax, or government lines", () => {
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
});

describe("registry — verification lifecycle (unchanged from prior pass)", () => {
  it("scoped states carry the correct verification status", () => {
    for (const code of SCOPED_VERIFIED) expect(DOC_FEE_RULES[code].verificationStatus, code).toBe("verified");
    for (const code of SCOPED_SEEDED) expect(DOC_FEE_RULES[code].verificationStatus, code).toBe("seeded");
  });
  it("exactly the verified set is verified (no accidental flips)", () => {
    expect([...VERIFIED_JURISDICTIONS].sort()).toEqual([...SCOPED_VERIFIED].sort());
  });
  it("still-seeded / unresearched states are not verified", () => {
    for (const code of ["IL", "PA", "AZ", "DC", "DE", "AL", "WA"]) {
      expect(DOC_FEE_RULES[code].verificationStatus, code).not.toBe("verified");
    }
  });
  it("MD, VA, DE, DC have explicit entries with sources", () => {
    for (const code of ["MD", "VA", "DE", "DC"]) {
      expect(DOC_FEE_RULES[code].verificationStatus, code).not.toBe("needs_research");
      expect(DOC_FEE_RULES[code].sourceUrl, code).toBeTruthy();
    }
  });
});

describe("classifyDocFeeAmount — comparisonStatus", () => {
  it("not a doc fee → not_doc_fee", () => {
    const f = classifyDocFeeAmount({ stateCode: "MD", feeName: "vehicle service contract", amountCents: cents(2000) });
    expect(f.isDocFee).toBe(false);
    expect(f.comparisonStatus).toBe("not_doc_fee");
  });

  it("verified capped within cap → within_verified_cap", () => {
    const f = classifyDocFeeAmount({ stateCode: "NY", feeName: "documentation fee", amountCents: cents(150) });
    expect(f.comparisonStatus).toBe("within_verified_cap");
    expect(f.withinCap).toBe(true);
    expect(f.verified).toBe(true);
    expect(f.capAmountCents).toBe(17_500);
    expect(f.buyerSummary).toMatch(/dealer-controlled/i);
  });

  it("verified capped above cap → above_verified_cap (stronger, safe warning)", () => {
    const f = classifyDocFeeAmount({ stateCode: "MD", feeName: "dealer processing fee", amountCents: cents(950) });
    expect(f.comparisonStatus).toBe("above_verified_cap");
    expect(f.overCap).toBe(true);
    expect(f.humanReviewRecommended).toBe(true);
    expect(f.buyerSummary).toMatch(/above the listed cap/i);
    expect(f.buyerSummary).toMatch(/not a legal determination/i);
    expect(f.whatToAsk).toMatch(/statutory basis|corrected buyer/i);
  });

  it("verified formula state compares against the threshold (TX $225)", () => {
    expect(classifyDocFeeAmount({ stateCode: "TX", feeName: "documentary fee", amountCents: cents(200) }).comparisonStatus).toBe("within_verified_cap");
    expect(classifyDocFeeAmount({ stateCode: "TX", feeName: "documentary fee", amountCents: cents(400) }).comparisonStatus).toBe("above_verified_cap");
  });

  it("verified disclosure-only → verified_disclosure_only, no comparison (FL, VA, NC, GA)", () => {
    for (const code of ["FL", "VA", "NC", "GA"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "doc fee", amountCents: cents(999) });
      expect(f.comparisonStatus, code).toBe("verified_disclosure_only");
      expect(f.overCap, code).toBeUndefined();
      expect(f.withinCap, code).toBeUndefined();
    }
  });

  it("verified uncapped (NJ, CO) → verified_uncapped, no comparison", () => {
    for (const code of ["NJ", "CO"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "dealer doc fee", amountCents: cents(999) });
      expect(f.comparisonStatus, code).toBe("verified_uncapped");
      expect(f.verified, code).toBe(true);
      expect(f.overCap, code).toBeUndefined();
    }
  });

  it("verified uncapped → verified_uncapped, no comparison (synthetic rule)", () => {
    const rule: DocFeeRule = {
      jurisdiction: "XX",
      stateName: "Testland",
      verificationStatus: "verified",
      capType: "uncapped",
      feeNames: ["doc fee"],
      dealerControlled: true,
      governmentFee: false,
      taxable: null,
      mustBeDisclosed: null,
      buyerExplanation: "",
      buyerAction: "",
      sourceTitle: "Test source",
      sourceUrl: "https://example.gov/x",
      sourceType: "statute",
      lastVerified: "2026-06-28",
      confidence: "high",
    };
    const f = buildDocFeeFinding({ isDocFee: true, feeName: "doc fee", amountCents: cents(700), stateCode: "XX", rule });
    expect(f.comparisonStatus).toBe("verified_uncapped");
    expect(f.overCap).toBeUndefined();
    expect(f.buyerSummary).toMatch(/dealer-controlled/i);
  });

  it("seeded state does NOT run a cap comparison (IL, PA capped; DC uncapped)", () => {
    for (const code of ["IL", "PA", "DC"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "documentary fee", amountCents: cents(2000) });
      expect(f.comparisonStatus, code).toBe("seeded_rule_no_comparison");
      expect(f.withinCap, code).toBeUndefined();
      expect(f.overCap, code).toBeUndefined();
      expect(f.verified, code).toBe(false);
    }
  });

  it("conflicting-source state → seeded_rule_no_comparison, ruleStatus unknown (AZ)", () => {
    const f = classifyDocFeeAmount({ stateCode: "AZ", feeName: "doc fee", amountCents: cents(500) });
    expect(f.comparisonStatus).toBe("seeded_rule_no_comparison");
    expect(f.ruleStatus).toBe("unknown");
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("needs-research state → needs_research, no comparison (AL)", () => {
    const f = classifyDocFeeAmount({ stateCode: "AL", feeName: "doc fee", amountCents: cents(500) });
    expect(f.comparisonStatus).toBe("needs_research");
    expect(f.overCap).toBeUndefined();
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("missing state → missing_state, prompts state-required guidance", () => {
    const f = classifyDocFeeAmount({ stateCode: undefined, feeName: "doc fee", amountCents: cents(500) });
    expect(f.comparisonStatus).toBe("missing_state");
    expect(f.whatToAsk).toMatch(/add the state/i);
    expect(f.humanReviewRecommended).toBe(true);
  });
});

describe("Delaware special case", () => {
  it("buyer copy distinguishes the state document fee from the dealer fee", () => {
    const f = classifyDocFeeAmount({ stateCode: "DE", feeName: "documentation fee", amountCents: cents(500) });
    expect(f.comparisonStatus).toBe("seeded_rule_no_comparison");
    expect(f.buyerSummary).toMatch(/government titling charge/i);
    expect(f.buyerSummary).toMatch(/document fee/i);
    expect(f.whatToAsk).toMatch(/separate Delaware's state document fee/i);
    expect(f.verified).toBe(false);
  });
});

describe("compliance + conservatism", () => {
  it("buyer copy says dealer-controlled and never a government fee where applicable", () => {
    for (const code of ["NY", "MD", "FL", "VA", "DE", "DC", "IL", "AL"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "doc fee", amountCents: cents(900) });
      expect(f.governmentFee, code).toBe(false);
      expect(customerCopy(f), code).toMatch(/dealer-controlled|dealer charge|dealer fee/i);
    }
  });

  it("seeded rules are never described as verified", () => {
    for (const code of ["DE", "DC", "IL", "PA", "AZ"]) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "doc fee", amountCents: cents(900) });
      expect(f.verified, code).toBe(false);
      expect(f.ruleStatus, code).not.toBe("verified");
      expect(f.sourceSummary, code).not.toMatch(/verified source on file/i);
    }
  });

  it("no finding uses forbidden / overclaiming language", () => {
    const states = ["CA", "NY", "TX", "OH", "FL", "VA", "MD", "DE", "DC", "IL", "PA", "AZ", "AL", "XX"];
    for (const code of states) {
      const f = classifyDocFeeAmount({ stateCode: code, feeName: "doc fee", amountCents: cents(950) });
      expect(FORBIDDEN.test(customerCopy(f)), `${code}: ${customerCopy(f)}`).toBe(false);
    }
    // also the missing-state path
    const m = classifyDocFeeAmount({ stateCode: "", feeName: "doc fee", amountCents: cents(950) });
    expect(FORBIDDEN.test(customerCopy(m))).toBe(false);
  });

  it("every registry rule's customer copy avoids forbidden language", () => {
    for (const rule of Object.values(DOC_FEE_RULES)) {
      expect(FORBIDDEN.test(rule.buyerExplanation), rule.jurisdiction).toBe(false);
      expect(FORBIDDEN.test(rule.buyerAction), rule.jurisdiction).toBe(false);
    }
  });
});

describe("finding shape — richer customer-facing model", () => {
  it("populates the full decision model for a verified capped over-cap fee", () => {
    const f = classifyDocFeeAmount({ stateCode: "MD", feeName: "dealer processing fee", amountCents: cents(950) });
    expect(f.stateCode).toBe("MD");
    expect(f.feeName).toBe("dealer processing fee");
    expect(f.amountCents).toBe(cents(950));
    expect(f.ruleStatus).toBe("verified");
    expect(f.verificationStatus).toBe("verified");
    expect(f.capType).toBe("capped");
    expect(f.maxAmountCents).toBe(80_000);
    expect(f.dealerControlled).toBe(true);
    expect(f.governmentFee).toBe(false);
    expect(f.buyerSummary.length).toBeGreaterThan(0);
    expect(f.whyItMatters.length).toBeGreaterThan(0);
    expect(f.whatToAsk.length).toBeGreaterThan(0);
    expect(f.scriptLine).toMatch(/^“.*”$/);
    expect(f.sourceSummary).toMatch(/verified source on file/i);
    // back-compat aliases
    expect(f.explanation).toBe(f.buyerSummary);
    expect(f.action).toBe(f.whatToAsk);
  });
});

describe("data quality", () => {
  it("covers 50 states + DC; 16 sourced, 11 verified, 35 scaffolds", () => {
    expect(Object.keys(US_JURISDICTIONS)).toHaveLength(51);
    expect(Object.keys(DOC_FEE_RULES)).toHaveLength(51);
    expect(SOURCED_JURISDICTIONS).toHaveLength(16);
    expect(VERIFIED_JURISDICTIONS).toHaveLength(11);
    expect(Object.values(DOC_FEE_RULES).filter((r) => r.verificationStatus === "needs_research")).toHaveLength(35);
  });

  it("every sourced rule keeps full source metadata + safe semantics", () => {
    for (const code of SOURCED_JURISDICTIONS) {
      const r = DOC_FEE_RULES[code];
      expect(r.sourceUrl, code).toBeTruthy();
      expect(r.sourceTitle, code).toBeTruthy();
      expect(r.sourceType, code).toBeTruthy();
      expect(r.dealerControlled).toBe(true);
      expect(r.governmentFee).toBe(false);
      if (r.verificationStatus !== "verified") expect(r.confidence, code).not.toBe("high");
    }
  });

  it("does not invent caps for uncapped / disclosure-only states", () => {
    for (const code of ["FL", "VA", "DE", "DC", "NJ", "CO"]) {
      expect(DOC_FEE_RULES[code].maxAmountCents, code).toBeUndefined();
    }
  });

  it("getDocFeeRuleForState is case-insensitive; undefined for unknown codes", () => {
    expect(getDocFeeRuleForState("md")?.jurisdiction).toBe("MD");
    expect(getDocFeeRuleForState("ZZ")).toBeUndefined();
  });
});
