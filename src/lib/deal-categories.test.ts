import { describe, it, expect } from "vitest";
import {
  categorizeDeal,
  partitionVerdictFlags,
  type DealCategory,
  type CategoryKey,
} from "./deal-categories";
import type { FairnessResult, Flag } from "./fairness-engine";
import type { FeeRiskAssessment } from "./fee-classifier";

function res(flags: Flag[]): FairnessResult {
  return {
    overallVerdict: "amber",
    headline: "",
    confidence: "medium",
    confidenceReasons: [],
    flags,
    warranty: null,
    assumptions: [],
    schemaVersion: "fairness-1",
    engineVersion: "test",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function flag(type: Flag["type"], severity: Flag["severity"]): Flag {
  return { type, severity, title: "", explanation: "" };
}

function get(cats: DealCategory[], k: CategoryKey): DealCategory {
  const c = cats.find((x) => x.key === k);
  if (!c) throw new Error(`missing category ${k}`);
  return c;
}

const feeRiskGov: FeeRiskAssessment = {
  state: "CA",
  ruleConfidence: "medium",
  lineItems: [{ label: "Title & registration", amount: 90, category: "title" }],
  messages: [],
};

const feeRiskDocCritical: FeeRiskAssessment = {
  state: "CA",
  ruleConfidence: "medium",
  lineItems: [{ label: "Doc fee", amount: 500, category: "doc_fee" }],
  messages: [
    {
      severity: "critical",
      title: "Doc fee appears above known state cap",
      message: "Confirm the amount and ask the dealer to correct or explain it in writing.",
    },
  ],
};

describe("categorizeDeal — shape", () => {
  it("always returns the 5 categories in a fixed order", () => {
    const cats = categorizeDeal(res([]));
    expect(cats.map((c) => c.key)).toEqual([
      "price",
      "payment",
      "fees",
      "addons",
      "tax_title_reg",
    ]);
  });
});

describe("categorizeDeal — clean deal", () => {
  it("reads looks_clear for a flag-free deal (tax needs_info without fee data)", () => {
    const cats = categorizeDeal(res([]));
    expect(get(cats, "price").level).toBe("looks_clear");
    expect(get(cats, "payment").level).toBe("looks_clear");
    expect(get(cats, "fees").level).toBe("looks_clear");
    expect(get(cats, "addons").level).toBe("looks_clear");
    expect(get(cats, "tax_title_reg").level).toBe("needs_info");
  });

  it("marks tax_title_reg looks_clear when government fees are itemized", () => {
    const cats = categorizeDeal(res([]), feeRiskGov);
    expect(get(cats, "tax_title_reg").level).toBe("looks_clear");
  });
});

describe("categorizeDeal — flag → category mapping", () => {
  it("elevates Payment fairness on a marked-up APR", () => {
    const cats = categorizeDeal(res([flag("apr_markup", "high")]));
    expect(get(cats, "payment").level).toBe("high_risk");
    expect(get(cats, "payment").flagCount).toBe(1);
  });

  it("elevates Fee risk on a junk fee", () => {
    const cats = categorizeDeal(res([flag("junk_fee", "high")]));
    expect(get(cats, "fees").level).toBe("high_risk");
  });

  it("elevates Fee risk from a state-aware doc-cap critical even with no engine flag", () => {
    const cats = categorizeDeal(res([]), feeRiskDocCritical);
    expect(get(cats, "fees").level).toBe("high_risk");
  });

  it("elevates Add-on risk on an overpriced warranty/add-on", () => {
    const cats = categorizeDeal(res([flag("overpriced_warranty", "medium")]));
    expect(get(cats, "addons").level).toBe("worth_a_look");
  });

  it("elevates Price fairness on negative equity", () => {
    const cats = categorizeDeal(res([flag("negative_equity", "high")]));
    expect(get(cats, "price").level).toBe("high_risk");
  });

  it("ignores non-verdict flags (missing_info / info)", () => {
    const cats = categorizeDeal(res([flag("missing_info", "info"), flag("info", "info")]));
    expect(cats.every((c) => c.key === "tax_title_reg" || c.level === "looks_clear")).toBe(true);
  });
});

describe("categorizeDeal — compliance-safe notes", () => {
  it("never uses unsafe or absolute wording in any note", () => {
    const cats = categorizeDeal(
      res([
        flag("apr_markup", "high"),
        flag("junk_fee", "high"),
        flag("overpriced_warranty", "high"),
        flag("negative_equity", "high"),
      ]),
      feeRiskDocCritical,
    );
    const text = cats.map((c) => c.note).join("  ");
    const FORBIDDEN = [/illegal/i, /\bfraud/i, /guaranteed/i, /\bmust\b/i, /\bwill\b/i];
    for (const re of FORBIDDEN) {
      expect(re.test(text), `matched ${re}`).toBe(false);
    }
  });
});

describe("partitionVerdictFlags", () => {
  it("routes fee/add-on to fees, price/payment to general, drops warranty + info", () => {
    const flags: Flag[] = [
      flag("apr_markup", "high"),
      flag("negative_equity", "medium"),
      flag("junk_fee", "high"),
      flag("overpriced_addon", "medium"),
      flag("overpriced_warranty", "high"),
      flag("missing_info", "info"),
    ];
    const { general, fees } = partitionVerdictFlags(flags);
    expect(general.map((f) => f.type).sort()).toEqual(["apr_markup", "negative_equity"]);
    expect(fees.map((f) => f.type).sort()).toEqual(["junk_fee", "overpriced_addon"]);
  });
});
