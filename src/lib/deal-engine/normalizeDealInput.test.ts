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

  it("builds a trade object from trade-vehicle identity alone (no dollars)", () => {
    const d = normalizeDealInput({
      trade: { year: "2018", make: "Honda", model: "Civic", mileage: "62,000" },
    });
    expect(d.trade).toMatchObject({
      year: 2018,
      make: "Honda",
      model: "Civic",
      mileage: 62000,
    });
  });

  it("captures condition, color, dealer identity, and stated totals", () => {
    const d = normalizeDealInput({
      vehicle: { make: "Toyota", model: "Camry", condition: "new", color: "Blue" },
      pricing: { vehiclePrice: "40509", totalVehiclePrice: "45693.61", balanceDue: "52260" },
      dealerName: "Waldorf Toyota",
      dealerAddress: "2600 Crain Highway, Waldorf, MD 20601",
      dealerPhone: "301-843-3700",
      salesperson: "Swann, D'Marius",
      stockNumber: "00N40400",
    });
    expect(d.vehicle.condition).toBe("new");
    expect(d.vehicle.color).toBe("Blue");
    expect(d.pricing.totalVehiclePrice).toBe(45693.61);
    expect(d.pricing.balanceDue).toBe(52260);
    expect(d.sourceMetadata).toMatchObject({
      dealerName: "Waldorf Toyota",
      dealerPhone: "301-843-3700",
      salesperson: "Swann, D'Marius",
      stockNumber: "00N40400",
    });
  });
});
