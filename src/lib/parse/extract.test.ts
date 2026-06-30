import { describe, it, expect } from "vitest";
import { normalize } from "./extract";

describe("normalize() — service-contract recognition", () => {
  it("promotes a service-contract fee line to the warranty price", () => {
    const out = normalize({
      vehiclePrice: "28000",
      fees: [
        { label: "Doc Fee", amount: "499" },
        { label: "Endurance Vehicle Service Contract", amount: "2500" },
        { label: "Nitrogen", amount: "299" },
      ],
    });
    expect(out.warrantyPrice).toBe("2500");
    // ...and it's removed from fees so it isn't double-counted.
    const labels = (out.fees ?? []).map((f) => f.label);
    expect(labels).toEqual(["Doc Fee", "Nitrogen"]);
  });

  it("does not override a warranty price the model already reported", () => {
    const out = normalize({
      warrantyPrice: "3000",
      fees: [{ label: "Honda Care", amount: "2500" }],
    });
    expect(out.warrantyPrice).toBe("3000");
    // The fee stays put — we only promote when no warranty price was found.
    expect((out.fees ?? []).map((f) => f.label)).toEqual(["Honda Care"]);
  });

  it("leaves genuine junk fees alone", () => {
    const out = normalize({
      fees: [
        { label: "Paint & Fabric Protection", amount: "799" },
        { label: "VIN Etch", amount: "299" },
      ],
    });
    expect(out.warrantyPrice).toBeUndefined();
    expect((out.fees ?? []).length).toBe(2);
    expect(out.addOns).toBeUndefined();
  });
});

describe("normalize() — fee vs. F&I add-on routing", () => {
  it("moves optional F&I products off the fee schedule into add-ons", () => {
    const out = normalize({
      fees: [
        { label: "Dealer Processing Charge", amount: "799" },
        { label: "Applicable Taxes", amount: "2776.61" },
        { label: "Vehicle Freight", amount: "1295" },
        { label: "Service/Maintenance Contract", amount: "3324" },
        { label: "Title Fee", amount: "200" },
      ],
    });
    // Dealer/government charges stay as fees…
    expect((out.fees ?? []).map((f) => f.label)).toEqual([
      "Dealer Processing Charge",
      "Applicable Taxes",
      "Vehicle Freight",
      "Title Fee",
    ]);
    // …and the maintenance contract is routed to add-ons.
    expect((out.addOns ?? []).map((a) => a.label)).toEqual([
      "Service/Maintenance Contract",
    ]);
    expect((out.addOns ?? [])[0]?.amount).toBe(3324);
  });

  it("keeps add-ons the model already separated and merges reclassified ones", () => {
    const out = normalize({
      addOns: [{ label: "GAP", amount: "999" }],
      fees: [{ label: "Tire & Wheel Protection", amount: "1200" }],
    });
    expect((out.addOns ?? []).map((a) => a.label)).toEqual([
      "GAP",
      "Tire & Wheel Protection",
    ]);
    expect(out.fees).toBeUndefined();
  });
});

describe("normalize() — field guards", () => {
  it("rejects an implausible placeholder financing term", () => {
    expect(normalize({ termMonths: "1" }).termMonths).toBeUndefined();
    expect(normalize({ termMonths: "0" }).termMonths).toBeUndefined();
    expect(normalize({ termMonths: "72" }).termMonths).toBe("72");
  });

  it("captures deposit and a clean 2-letter dealer state", () => {
    const out = normalize({ deposit: "452.61", dealerState: "md" });
    expect(out.deposit).toBe("452.61");
    expect(out.dealerState).toBe("MD");
    expect(normalize({ dealerState: "Maryland" }).dealerState).toBeUndefined();
  });
});
