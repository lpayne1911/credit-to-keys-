import { describe, it, expect } from "vitest";
import { toFairnessInput, toDealRow, type DealSubmission } from "./deal-mapper";
import { scoreDeal } from "./fairness-engine";

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

  it("coerces trade-in fields and leaves omitted ones null", () => {
    const input = toFairnessInput({
      tradeIn: { offer: "$7,000", loanPayoff: "11000" },
    });
    expect(input.tradeIn?.offer).toBe(7_000);
    expect(input.tradeIn?.loanPayoff).toBe(11_000);
    expect(input.tradeIn?.estimatedValue).toBeNull();
  });

  it("maps trade-in to null when the buyer has no trade", () => {
    expect(toFairnessInput({}).tradeIn).toBeNull();
  });

  it("ignores the internal location signal (not a scoring input)", () => {
    const input = toFairnessInput({
      vehicle: { make: "Honda" },
      location: { zip: "90210", state: "CA" },
    });
    // FairnessInput has no zip/state — location must not leak into scoring.
    expect(input.vehicle.make).toBe("Honda");
    expect(JSON.stringify(input)).not.toContain("90210");
  });
});

describe("toDealRow — buyer location signal", () => {
  function row(sub: DealSubmission) {
    const input = toFairnessInput(sub);
    return toDealRow(sub, input, scoreDeal(input), null);
  }

  it("persists ZIP-derived buyer_zip/buyer_state and a null income band", () => {
    const r = row({
      vehicle: { make: "Honda", model: "Accord", vin: "1HGCV1F4XMA000000" },
      location: { zip: "90210", state: "CA" },
    });
    expect(r.buyer_zip).toBe("90210");
    expect(r.buyer_state).toBe("CA");
    expect(r.buyer_income_band).toBeNull();
    expect(r.vehicle_vin).toBe("1HGCV1F4XMA000000");
  });

  it("leaves location columns null when no location is provided", () => {
    const r = row({ vehicle: { make: "Honda" } });
    expect(r.buyer_zip).toBeNull();
    expect(r.buyer_state).toBeNull();
    expect(r.buyer_income_band).toBeNull();
  });
});
