import { describe, it, expect } from "vitest";
import {
  STEPS,
  PROGRESS_STEPS,
  progressPercent,
  continueEnabled,
  type StepKey,
  type FlowState,
} from "./deal-check-flow";

function flow(overrides: Partial<FlowState> = {}): FlowState {
  return { make: "", makeOther: "", hasWarranty: null, hasTrade: null, ...overrides };
}

describe("Deal Check flow — step order", () => {
  it("starts at the intro and ends at warranty (the submit step)", () => {
    expect(STEPS[0]).toBe("start");
    expect(STEPS[STEPS.length - 1]).toBe("warranty");
  });

  it("puts trade-in before the final warranty step", () => {
    expect(STEPS.indexOf("trade")).toBeLessThan(STEPS.indexOf("warranty"));
  });

  it("has unique steps and counts all but the intro for progress", () => {
    expect(new Set(STEPS).size).toBe(STEPS.length);
    expect(PROGRESS_STEPS).toBe(STEPS.length - 1);
  });
});

describe("progressPercent", () => {
  it("is 0 on the intro and 100 on the last step", () => {
    expect(progressPercent(0)).toBe(0);
    expect(progressPercent(PROGRESS_STEPS)).toBe(100);
  });

  it("never decreases as the buyer advances, and clamps past the end", () => {
    for (let i = 1; i < STEPS.length; i++) {
      expect(progressPercent(i)).toBeGreaterThanOrEqual(progressPercent(i - 1));
    }
    expect(progressPercent(99)).toBe(100);
  });
});

describe("continueEnabled", () => {
  it("requires a brand selection (and a typed value for Other)", () => {
    expect(continueEnabled("brand", flow())).toBe(false);
    expect(continueEnabled("brand", flow({ make: "Toyota" }))).toBe(true);
    expect(continueEnabled("brand", flow({ make: "Other", makeOther: "" }))).toBe(false);
    expect(continueEnabled("brand", flow({ make: "Other", makeOther: "Rivian" }))).toBe(true);
  });

  it("requires an explicit yes/no on the trade and warranty questions", () => {
    expect(continueEnabled("trade", flow())).toBe(false);
    expect(continueEnabled("trade", flow({ hasTrade: false }))).toBe(true);
    expect(continueEnabled("warranty", flow())).toBe(false);
    expect(continueEnabled("warranty", flow({ hasWarranty: true }))).toBe(true);
  });

  it("always allows continuing on the slider/optional steps", () => {
    for (const step of ["specs", "price", "financing", "addons"] as StepKey[]) {
      expect(continueEnabled(step, flow())).toBe(true);
    }
  });

  it("has no footer button on the auto-advancing steps", () => {
    expect(continueEnabled("start", flow())).toBe(false);
    expect(continueEnabled("credit", flow())).toBe(false);
  });
});
