import { describe, it, expect } from "vitest";
import { FOCUSED_FLOWS, getFocusedFlow } from "./focused-flows";

describe("focused flows ask only product-relevant questions", () => {
  const ids = (focus: "warranty" | "apr" | "addons") =>
    FOCUSED_FLOWS[focus].questions.map((q) => q.id);

  it("warranty asks for the vehicle (warranty pricing uses brand reliability)", () => {
    expect(ids("warranty")).toContain("vehicle");
    expect(FOCUSED_FLOWS.warranty.questions.find((q) => q.id === "vehicle")?.kind).toBe("vehicle");
  });

  it("APR and add-on flows do NOT ask for the vehicle/make/brand", () => {
    for (const f of ["apr", "addons"] as const) {
      expect(ids(f)).not.toContain("vehicle");
      expect(ids(f)).not.toContain("make");
      expect(FOCUSED_FLOWS[f].questions.some((q) => q.kind === "vehicle")).toBe(false);
    }
  });

  it("each flow leads with its own first question", () => {
    expect(FOCUSED_FLOWS.warranty.questions[0].id).toBe("vehicle");
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

  it("APR carries the buyer's outside pre-approval and signed flag", () => {
    const sub = FOCUSED_FLOWS.apr.toSubmission(
      { creditBand: "good", apr: 16.9, outsideApproval: true, signed: true },
      null,
    );
    expect(sub.deal?.outsideApproval).toBe(true);
    expect(sub.alreadySigned).toBe(true);
  });

  it("warranty carries deductible, mileage cap, and the signed flag", () => {
    const sub = FOCUSED_FLOWS.warranty.toSubmission(
      { make: "Honda", coverageTier: "stated_component", deductible: "100", termMiles: 75000, priceQuoted: 3500, signed: false },
      null,
    );
    expect(sub.warranty?.deductible).toBe(100);
    expect(sub.warranty?.termMiles).toBe(75000);
    expect(sub.alreadySigned).toBe(false);
  });

  it("add-on carries financing signals (financed + apr/term) and keeps categories separate", () => {
    const sub = FOCUSED_FLOWS.addons.toSubmission(
      { __addons: "gap,nitrogen,service contract", financed: true, addOnApr: 14.9, addOnTermMonths: "72" },
      null,
    );
    expect(sub.deal?.addOnsFinanced).toBe(true);
    expect(sub.deal?.addOnApr).toBe(14.9);
    expect(sub.deal?.addOnTermMonths).toBe(72);
    // service contract is a warranty, not a fee; the others stay fees
    expect(sub.warranty).toBeTruthy();
    const labels = (sub.deal?.fees ?? []).map((f) => (f.label ?? "").toLowerCase());
    expect(labels.some((l) => l.includes("gap"))).toBe(true);
    expect(labels.some((l) => l.includes("service contract"))).toBe(false);
  });

  it("add-on without financing leaves the financing signals off", () => {
    const sub = FOCUSED_FLOWS.addons.toSubmission({ __addons: "gap", financed: false }, null);
    expect(sub.deal?.addOnsFinanced).toBe(false);
    expect(sub.deal?.addOnApr).toBeUndefined();
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

  it("uses the buyer-entered amount per add-on, falling back to an estimate when blank", () => {
    const sub = FOCUSED_FLOWS.addons.toSubmission(
      { __addons: "gap,nitrogen,service contract", amount_gap: 1495, amount_nitrogen: "", "amount_service contract": 3200 },
      null,
    );
    const fees = sub.deal?.fees ?? [];
    const gap = fees.find((f) => (f.label ?? "").toLowerCase().includes("gap"));
    const nitro = fees.find((f) => (f.label ?? "").toLowerCase().includes("nitrogen"));
    // entered amount is honored…
    expect(gap?.amount).toBe(1495);
    // …blank falls back to the typical estimate (not 0)
    expect(nitro?.amount).toBeGreaterThan(0);
    // service-contract amount flows to the warranty price
    expect(sub.warranty?.priceQuoted).toBe(3200);
  });
});
