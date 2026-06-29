import { describe, expect, it } from "vitest";
import { classifyAddOn, classifyAddOns } from "./classifyAddOns";

describe("classifyAddOns", () => {
  it("detects VSC / extended warranty with cancellation + human review", () => {
    const a = classifyAddOn({ rawLabel: "Extended Warranty", amount: 2800 });
    expect(a.category).toBe("vsc");
    expect(a.optional).toBe(true);
    expect(a.overpricedRisk).toBe(true);
    expect(a.cancellationTermsNeeded).toBe(true);
    expect(a.humanReviewRecommended).toBe(true);
  });

  it("detects the common product categories", () => {
    expect(classifyAddOn({ rawLabel: "GAP Insurance", amount: 900 }).category).toBe("gap");
    expect(classifyAddOn({ rawLabel: "Tire & Wheel Protection", amount: 1200 }).category).toBe("tire_wheel");
    expect(classifyAddOn({ rawLabel: "Key Replacement", amount: 400 }).category).toBe("key");
    expect(classifyAddOn({ rawLabel: "Ceramic Coating", amount: 1500 }).category).toBe("ceramic");
    expect(classifyAddOn({ rawLabel: "LoJack", amount: 700 }).category).toBe("lojack_gps");
    expect(classifyAddOn({ rawLabel: "Nitrogen", amount: 199 }).category).toBe("nitrogen");
  });

  it("passes through the financed flag", () => {
    const a = classifyAddOn({ rawLabel: "GAP", amount: 900, financed: true });
    expect(a.financedIntoLoan).toBe(true);
    const b = classifyAddOn(
      { rawLabel: "GAP", amount: 900 },
      { addOnsFinancedDefault: true },
    );
    expect(b.financedIntoLoan).toBe(true);
  });

  it("filters empty lines", () => {
    expect(classifyAddOns([{ rawLabel: "", amount: 0 }])).toHaveLength(0);
  });
});
