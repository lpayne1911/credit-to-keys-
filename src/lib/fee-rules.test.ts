import { describe, it, expect } from "vitest";
import { getFeeRules } from "./fee-rules";

describe("getFeeRules", () => {
  it("returns a hard cap for a hard-cap state", () => {
    const r = getFeeRules("CA");
    expect(r.state).toBe("CA");
    expect(r.docFeeCapType).toBe("hard_cap");
    expect(typeof r.docFeeCap).toBe("number");
    expect(r.docFeeCap).toBeGreaterThan(0);
  });

  it("marks an explicitly-uncapped state as uncapped with no cap number", () => {
    const r = getFeeRules("FL");
    expect(r.docFeeCapType).toBe("uncapped");
    expect(r.docFeeCap).toBeNull();
  });

  it("falls back to a safe 'unknown' rule set for unseeded states", () => {
    const r = getFeeRules("WY");
    expect(r.state).toBe("WY");
    expect(r.docFeeCapType).toBe("unknown");
    expect(r.docFeeCap).toBeNull();
    expect(r.registrationRuleConfidence).toBe("low");
    expect(r.suspiciousFeeLabels.length).toBeGreaterThan(0);
  });

  it("returns the UNKNOWN default for null/empty state (case-insensitive otherwise)", () => {
    expect(getFeeRules(null).state).toBe("UNKNOWN");
    expect(getFeeRules("").state).toBe("UNKNOWN");
    expect(getFeeRules("ca").docFeeCapType).toBe("hard_cap");
  });
});
