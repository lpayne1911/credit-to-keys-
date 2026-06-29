import { describe, it, expect } from "vitest";
import { buildPostSaleTriage } from "./buildPostSaleTriage";
import type { PostSaleInput } from "./types";

const base: PostSaleInput = {
  buyerState: "MD",
  daysSinceSigned: 5,
  financed: true,
  lienholder: "Ally",
  dealerName: "City Motors",
  addOns: [
    { rawLabel: "Extended service contract", amount: 2500, financed: true },
    { rawLabel: "GAP coverage", amount: 900, financed: true },
    { rawLabel: "Nitrogen tire fill", amount: 299, financed: false },
    { rawLabel: "VIN window etch", amount: 399, financed: false },
  ],
};

describe("buildPostSaleTriage", () => {
  it("brands the payload and leads with the cooling-off reality", () => {
    const r = buildPostSaleTriage(base);
    expect(r.schemaVersion).toBe("post-sale-1");
    expect(r.coolingOffNote).toMatch(/no automatic cooling-off/i);
  });

  it("flags contract products as often refundable and applied products as unlikely", () => {
    const r = buildPostSaleTriage(base);
    const byLabel = (s: string) => r.addOns.find((a) => a.rawLabel.toLowerCase().includes(s));
    expect(byLabel("service contract")?.outlook).toBe("often_refundable");
    expect(byLabel("gap")?.outlook).toBe("often_refundable");
    expect(byLabel("nitrogen")?.outlook).toBe("unlikely");
    expect(byLabel("etch")?.outlook).toBe("unlikely");
  });

  it("counts cancellable products and ceilings the refund at amounts paid", () => {
    const r = buildPostSaleTriage(base);
    expect(r.cancellableCount).toBe(2); // VSC + GAP
    expect(r.estimatedRefundCeiling).toBe(3400); // 2500 + 900, NOT the nitrogen/etch
  });

  it("includes the administrator and lender contacts plus escalation routes", () => {
    const r = buildPostSaleTriage(base);
    const who = r.contacts.map((c) => c.who.toLowerCase());
    expect(who.some((w) => w.includes("administrator"))).toBe(true);
    expect(who.some((w) => w.includes("ally"))).toBe(true); // named lienholder
    const escalations = r.contacts.filter((c) => c.escalation).map((c) => c.who.toLowerCase());
    expect(escalations.some((w) => w.includes("attorney general"))).toBe(true);
    expect(escalations.some((w) => w.includes("cfpb"))).toBe(true);
  });

  it("adds the payoff document only when financed", () => {
    const financed = buildPostSaleTriage(base);
    expect(financed.documents.some((d) => /payoff/i.test(d))).toBe(true);
    const cash = buildPostSaleTriage({ ...base, financed: false, lienholder: null });
    expect(cash.documents.some((d) => /payoff/i.test(d))).toBe(false);
    // No financed → no lender contact.
    expect(cash.contacts.some((c) => /lender|lienholder/i.test(c.who))).toBe(false);
  });

  it("handles an empty add-on list without inventing a refund", () => {
    const r = buildPostSaleTriage({ ...base, addOns: [] });
    expect(r.addOns).toHaveLength(0);
    expect(r.cancellableCount).toBe(0);
    expect(r.estimatedRefundCeiling).toBeNull();
    expect(r.summary).toMatch(/add the products/i);
  });

  it("routes financed refunds to the loan in the how-to-start guidance", () => {
    const r = buildPostSaleTriage(base);
    const vsc = r.addOns.find((a) => a.category === "vsc");
    expect(vsc?.howToStart).toMatch(/loan principal/i);
  });
});
