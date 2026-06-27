import { describe, it, expect } from "vitest";
import { FOCUSED_FLOWS, getFocusedFlow } from "./focused-flows";

describe("focused flows ask only product-relevant questions", () => {
  const ids = (focus: "warranty" | "apr" | "addons") =>
    FOCUSED_FLOWS[focus].questions.map((q) => q.id);

  it("warranty asks for the make (warranty pricing uses brand reliability)", () => {
    expect(ids("warranty")).toContain("make");
  });

  it("APR and add-on flows do NOT ask for the make/brand", () => {
    expect(ids("apr")).not.toContain("make");
    expect(ids("addons")).not.toContain("make");
  });

  it("each flow leads with its own first question", () => {
    expect(FOCUSED_FLOWS.warranty.questions[0].id).toBe("make");
    expect(FOCUSED_FLOWS.apr.questions[0].id).toBe("creditBand");
    expect(FOCUSED_FLOWS.addons.questions[0].id).toBe("state");
  });

  it("every flow offers an 'I don't know'/optional path somewhere", () => {
    for (const f of ["warranty", "apr", "addons"] as const) {
      expect(
        FOCUSED_FLOWS[f].questions.some((q) => q.idk || q.optional),
        f,
      ).toBe(true);
    }
  });

  it("getFocusedFlow returns null for the full inspector", () => {
    expect(getFocusedFlow("full")).toBeNull();
    expect(getFocusedFlow("warranty")).toBeTruthy();
  });
});

describe("focused submissions map to the right scoring shape", () => {
  it("warranty submits a warranty + no APR", () => {
    const sub = FOCUSED_FLOWS.warranty.toSubmission(
      { make: "Honda", year: 2021, mileage: 40000, coverageTier: "stated_component", termMonths: "60", priceQuoted: 3500 },
      null,
    );
    expect(sub.warranty?.priceQuoted).toBe(3500);
    expect(sub.deal?.apr).toBeUndefined();
    expect(sub.vehicle?.make).toBe("Honda");
  });

  it("APR submits financing + no warranty and no make", () => {
    const sub = FOCUSED_FLOWS.apr.toSubmission(
      { creditBand: "good", vehiclePrice: 28000, apr: 14.9, termMonths: "72" },
      null,
    );
    expect(sub.deal?.apr).toBe(14.9);
    expect(sub.warranty).toBeUndefined();
    expect(sub.vehicle?.make ?? "").toBe("");
  });

  it("add-on keeps government title fee as a fee (not dropped, not warranty)", () => {
    const sub = FOCUSED_FLOWS.addons.toSubmission(
      { __addons: "gap,title,service contract", state: "CA" },
      null,
    );
    const labels = (sub.deal?.fees ?? []).map((f) => (f.label ?? "").toLowerCase());
    expect(labels.some((l) => l.includes("title"))).toBe(true);
    expect(labels.some((l) => l.includes("gap"))).toBe(true);
    // the service contract becomes a warranty, not a fee
    expect(sub.warranty).toBeTruthy();
    expect(labels.some((l) => l.includes("service contract"))).toBe(false);
    expect(sub.buyerState).toBe("CA");
  });
});
