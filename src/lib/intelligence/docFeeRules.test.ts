import { describe, it, expect } from "vitest";
import {
  isDocFeeAlias,
  getDocFeeRuleForState,
  classifyDocFeeAmount,
  DOC_FEE_RULES,
  SOURCED_JURISDICTIONS,
  US_JURISDICTIONS,
  type DocFeeFinding,
} from "./docFeeRules";

const cents = (d: number) => d * 100;

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
      "service fee", // bare 'service fee' is intentionally excluded
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

  it("capped state, within cap → within_cap", () => {
    const f = classifyDocFeeAmount({
      stateCode: "NY", // $175 cap
      feeName: "documentation fee",
      amountCents: cents(150),
    });
    expect(f.status).toBe("within_cap");
    expect(f.withinCap).toBe(true);
    expect(f.overCap).toBe(false);
    expect(f.ruleKnown).toBe(true);
    expect(f.source?.url).toBeTruthy();
  });

  it("capped state, over cap → over_cap + human review", () => {
    const f = classifyDocFeeAmount({
      stateCode: "NY", // $175 cap
      feeName: "doc fee",
      amountCents: cents(499),
    });
    expect(f.status).toBe("over_cap");
    expect(f.overCap).toBe(true);
    expect(f.humanReviewRecommended).toBe(true);
    expect(f.explanation).toMatch(/exceed/i);
  });

  it("uncapped state → uncapped_dealer_controlled (not a government fee)", () => {
    const f = classifyDocFeeAmount({
      stateCode: "NJ",
      feeName: "dealer doc fee",
      amountCents: cents(699),
    });
    expect(f.status).toBe("uncapped_dealer_controlled");
    expect(f.explanation).toMatch(/dealer-controlled/i);
  });

  it("disclosure-only state → disclosure_only", () => {
    const f = classifyDocFeeAmount({
      stateCode: "VA",
      feeName: "processing fee",
      amountCents: cents(799),
    });
    expect(f.status).toBe("disclosure_only");
    expect(f.ruleKnown).toBe(true);
  });

  it("needs-research state → needs_research + human review", () => {
    const f = classifyDocFeeAmount({
      stateCode: "AL", // scaffold
      feeName: "doc fee",
      amountCents: cents(500),
    });
    expect(f.status).toBe("needs_research");
    expect(f.ruleKnown).toBe(false);
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("conflicting-source state → unknown_rule + human review (AZ)", () => {
    const f = classifyDocFeeAmount({
      stateCode: "AZ",
      feeName: "documentation fee",
      amountCents: cents(500),
    });
    expect(f.status).toBe("unknown_rule");
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("missing state → state_missing (no false certainty)", () => {
    const f = classifyDocFeeAmount({
      stateCode: undefined,
      feeName: "doc fee",
      amountCents: cents(500),
    });
    expect(f.status).toBe("state_missing");
    expect(f.humanReviewRecommended).toBe(true);
  });

  it("formula state compares against the headline figure (TX $225)", () => {
    const within = classifyDocFeeAmount({
      stateCode: "TX",
      feeName: "documentary fee",
      amountCents: cents(200),
    });
    expect(within.status).toBe("within_cap");
    const over = classifyDocFeeAmount({
      stateCode: "TX",
      feeName: "documentary fee",
      amountCents: cents(400),
    });
    expect(over.status).toBe("over_cap");
  });
});

describe("compliance: buyer copy avoids accusatory language", () => {
  const banned = /\b(fraud|scam|illegal|lied)\b/i;
  it("classifier outputs never use banned words", () => {
    const findings: DocFeeFinding[] = [
      classifyDocFeeAmount({ stateCode: "NY", feeName: "doc fee", amountCents: cents(999) }),
      classifyDocFeeAmount({ stateCode: "NJ", feeName: "doc fee", amountCents: cents(800) }),
      classifyDocFeeAmount({ stateCode: "VA", feeName: "processing fee", amountCents: cents(700) }),
      classifyDocFeeAmount({ stateCode: "AZ", feeName: "doc fee", amountCents: cents(500) }),
      classifyDocFeeAmount({ stateCode: "AL", feeName: "doc fee", amountCents: cents(500) }),
      classifyDocFeeAmount({ stateCode: undefined, feeName: "doc fee", amountCents: cents(500) }),
    ];
    for (const f of findings) {
      expect(banned.test(f.explanation), f.explanation).toBe(false);
      expect(banned.test(f.action), f.action).toBe(false);
    }
  });

  it("every rule's buyer copy avoids banned words", () => {
    for (const rule of Object.values(DOC_FEE_RULES)) {
      expect(banned.test(rule.buyerExplanation), rule.jurisdiction).toBe(false);
      expect(banned.test(rule.buyerAction), rule.jurisdiction).toBe(false);
    }
  });
});

describe("data quality", () => {
  it("covers 50 states + DC and has 15 source-backed jurisdictions", () => {
    expect(Object.keys(US_JURISDICTIONS)).toHaveLength(51);
    expect(Object.keys(DOC_FEE_RULES)).toHaveLength(51);
    expect(SOURCED_JURISDICTIONS).toHaveLength(15);
  });

  it("every source-backed rule carries full source metadata", () => {
    for (const code of SOURCED_JURISDICTIONS) {
      const r = DOC_FEE_RULES[code];
      expect(r.sourceUrl, `${code} sourceUrl`).toBeTruthy();
      expect(r.sourceTitle, `${code} sourceTitle`).toBeTruthy();
      expect(r.sourceType, `${code} sourceType`).toBeTruthy();
      expect(r.sourceQuote, `${code} sourceQuote`).toBeTruthy();
      expect(r.lastVerified, `${code} lastVerified`).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(r.confidence);
      expect(r.buyerExplanation.length, `${code} explanation`).toBeGreaterThan(0);
      expect(r.buyerAction.length, `${code} action`).toBeGreaterThan(0);
      expect(r.capType).not.toBe("needs_research");
      // A doc/processing fee is dealer-controlled and not a government fee.
      expect(r.dealerControlled).toBe(true);
      expect(r.governmentFee).toBe(false);
    }
  });

  it("capped rules have a positive cap amount", () => {
    for (const code of SOURCED_JURISDICTIONS) {
      const r = DOC_FEE_RULES[code];
      if (r.capType === "capped") {
        expect(r.maxAmountCents, `${code} cap`).toBeGreaterThan(0);
      }
    }
  });

  it("scaffolded states are needs_research with low confidence and no fabricated source", () => {
    const scaffolds = Object.values(DOC_FEE_RULES).filter(
      (r) => r.capType === "needs_research",
    );
    expect(scaffolds.length).toBe(51 - 15);
    for (const r of scaffolds) {
      expect(r.confidence).toBe("low");
      expect(r.sourceUrl).toBeUndefined();
      expect(r.dealerControlled).toBe(true);
      expect(r.governmentFee).toBe(false);
    }
  });
});
