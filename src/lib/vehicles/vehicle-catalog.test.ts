import { describe, it, expect } from "vitest";
import { VEHICLE_MAKES, MODELS_BY_MAKE, modelsForMake } from "./vehicle-catalog";

describe("vehicle catalog", () => {
  it("has a practical set of makes", () => {
    expect(VEHICLE_MAKES.length).toBeGreaterThanOrEqual(25);
    for (const m of ["Toyota", "Honda", "Ford", "Tesla", "Genesis", "MINI"]) {
      expect(VEHICLE_MAKES, m).toContain(m);
    }
  });

  it("Toyota lists Camry and Sienna", () => {
    expect(modelsForMake("Toyota")).toEqual(expect.arrayContaining(["Camry", "Sienna"]));
  });

  it("Honda lists Accord and CR-V", () => {
    expect(modelsForMake("Honda")).toEqual(expect.arrayContaining(["Accord", "CR-V"]));
  });

  it("returns an empty list for an unknown make (→ manual entry)", () => {
    expect(modelsForMake("Studebaker")).toEqual([]);
    expect(modelsForMake("")).toEqual([]);
    expect(modelsForMake(undefined)).toEqual([]);
  });

  it("every listed make has at least one model", () => {
    for (const m of VEHICLE_MAKES) {
      expect((MODELS_BY_MAKE[m] ?? []).length, m).toBeGreaterThan(0);
    }
  });
});
