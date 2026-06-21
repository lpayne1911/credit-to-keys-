import { describe, it, expect } from "vitest";
import { toFairnessInput, type DealSubmission } from "./deal-mapper";

/**
 * The mapper is the boundary between the form's loose wire format (strings,
 * partial objects) and the engine's typed input. These tests pin the coercion
 * and enum-guarding so a malformed submission can never reach the engine.
 */

describe("toFairnessInput", () => {
  it("coerces money/number strings (with symbols) into numbers", () => {
    const sub: DealSubmission = {
      vehicle: { year: "2020", make: "Honda", model: "Accord", mileage: "42,000" },
      deal: {
        vehiclePrice: "$24,500",
        apr: "9.9%",
        termMonths: "72",
        fees: [{ label: "Doc fee", amount: "$699" }],
      },
    };
    const input = toFairnessInput(sub);
    expect(input.vehicle.year).toBe(2020);
    expect(input.vehicle.mileage).toBe(42_000);
    expect(input.deal.vehiclePrice).toBe(24_500);
    expect(input.deal.apr).toBe(9.9);
    expect(input.deal.termMonths).toBe(72);
    expect(input.deal.fees).toEqual([{ label: "Doc fee", amount: 699 }]);
  });

  it("guards unknown credit bands to 'unknown'", () => {
    const input = toFairnessInput({ deal: { creditBand: "platinum" } });
    expect(input.deal.creditBand).toBe("unknown");
  });

  it("guards unknown coverage tiers to null", () => {
    const input = toFairnessInput({
      warranty: { coverageTier: "diamond", priceQuoted: "1000" },
    });
    expect(input.warranty?.coverageTier).toBeNull();
    expect(input.warranty?.priceQuoted).toBe(1000);
  });

  it("defaults a missing year to the current year and empty make/model", () => {
    const input = toFairnessInput({});
    expect(input.vehicle.year).toBe(new Date().getFullYear());
    expect(input.vehicle.make).toBe("");
    expect(input.vehicle.model).toBe("");
  });

  it("drops blank fee rows", () => {
    const input = toFairnessInput({
      deal: { fees: [{ label: "", amount: "" }, { label: "Nitrogen", amount: "299" }] },
    });
    expect(input.deal.fees).toEqual([{ label: "Nitrogen", amount: 299 }]);
  });
});
