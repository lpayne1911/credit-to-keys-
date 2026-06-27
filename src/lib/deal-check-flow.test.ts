import { describe, it, expect } from "vitest";
import {
  STEPS,
  PROGRESS_STEPS,
  progressPercent,
  continueEnabled,
  stepsForFocus,
  type StepKey,
  type FlowState,
} from "./deal-check-flow";

describe("focused flows diverge (not all funneled through the brand picker)", () => {
  it("only the warranty check and full check ask for the brand", () => {
    expect(stepsForFocus("warranty")).toContain("brand");
    expect(stepsForFocus("full")).toContain("brand");
    expect(stepsForFocus("apr")).not.toContain("brand");
    expect(stepsForFocus("addons")).not.toContain("brand");
  });
  it("each focus has a distinct second screen after 'start'", () => {
    const second = (f: Parameters<typeof stepsForFocus>[0]) => stepsForFocus(f)[1];
    expect(second("warranty")).toBe("brand");
    expect(second("apr")).toBe("credit");
    expect(second("addons")).toBe("state");
    expect(new Set([second("warranty"), second("apr"), second("addons")]).size).toBe(3);
  });
  it("every focused flow starts with 'start' and has a real step after", () => {
    for (const f of ["warranty", "apr", "addons", "full"] as const) {
      const s = stepsForFocus(f);
      expect(s[0]).toBe("start");
      expect(s.length).toBeGreaterThanOrEqual(3);
    }
  });
});

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
  it("lets the buyer continue past the vehicle step without forcing a make", () => {
    // The vehicle step uses VehicleSelector with an explicit "I don't know",
    // so it must never block a stressed buyer with a validation message.
    expect(continueEnabled("brand", flow())).toBe(true);
    expect(continueEnabled("brand", flow({ make: "Toyota" }))).toBe(true);
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
