import { describe, expect, it } from "vitest";
import { normalizeDealInput, toNum } from "./normalizeDealInput";

describe("toNum", () => {
  it("coerces formatted strings and rejects junk", () => {
    expect(toNum("$24,500")).toBe(24500);
    expect(toNum("6.9%")).toBe(6.9);
    expect(toNum(72)).toBe(72);
    expect(toNum("")).toBeNull();
    expect(toNum("abc")).toBeNull();
    expect(toNum(null)).toBeNull();
  });
});

describe("normalizeDealInput", () => {
  it("maps manual fields and partitions fees vs add-ons", () => {
    const d = normalizeDealInput({
      vehicle: { year: "2021", make: "Toyota", model: "Camry", mileage: "30,000" },
      pricing: { vehiclePrice: "$26,000", downPayment: "2000" },
      fees: [{ label: "Doc Fee", amount: "500" }],
      addOns: [{ label: "GAP", amount: "900", financed: true }],
      finance: { apr: "6.9", termMonths: "72", monthlyPayment: "480" },
      buyerState: "ca",
    });
    expect(d.vehicle.year).toBe(2021);
    expect(d.vehicle.mileage).toBe(30000);
    expect(d.pricing.vehiclePrice).toBe(26000);
    expect(d.fees).toHaveLength(1);
    expect(d.addOns[0]).toMatchObject({ rawLabel: "GAP", amount: 900, financed: true });
    expect(d.sourceMetadata.buyerState).toBe("CA");
    expect(d.finance.apr).toBe(6.9);
  });

  it("flags missing fields and lowers confidence on a thin deal", () => {
    const d = normalizeDealInput({ vehicle: { make: "Honda" } });
    expect(d.missingFields).toContain("Selling price");
    expect(d.missingFields).toContain("APR");
    expect(d.confidence).toBe("low");
    expect(d.trade).toBeNull();
  });

  it("builds a trade object only when a trade field is present", () => {
    const withTrade = normalizeDealInput({ trade: { offer: "10000" } });
    expect(withTrade.trade).toMatchObject({ offer: 10000 });
    const noTrade = normalizeDealInput({ trade: {} });
    expect(noTrade.trade).toBeNull();
  });
});
