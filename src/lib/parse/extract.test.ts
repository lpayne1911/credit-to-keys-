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
  });
});
