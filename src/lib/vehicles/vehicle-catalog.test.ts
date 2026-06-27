import { describe, it, expect } from "vitest";
import { VEHICLE_MAKES, MODELS_BY_MAKE, modelsForMake, normalizeMake } from "./vehicle-catalog";

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

describe("normalizeMake resolves aliases to a canonical, selectable make", () => {
  it("maps common aliases to the dropdown's exact make", () => {
    expect(normalizeMake("Chevy")).toBe("Chevrolet");
    expect(normalizeMake("chevrolet")).toBe("Chevrolet");
    expect(normalizeMake("VW")).toBe("Volkswagen");
    expect(normalizeMake("volkswagen")).toBe("Volkswagen");
    expect(normalizeMake("Mercedes")).toBe("Mercedes-Benz");
    expect(normalizeMake("mercedes-benz")).toBe("Mercedes-Benz");
    expect(normalizeMake("Range Rover")).toBe("Land Rover");
    expect(normalizeMake("Land Rover")).toBe("Land Rover");
  });

  it("every canonical make resolves to itself (case-insensitive)", () => {
    for (const m of VEHICLE_MAKES) {
      expect(normalizeMake(m.toLowerCase()), m).toBe(m);
    }
  });

  it("every alias resolves to a make that actually exists in the dropdown", () => {
    for (const alias of ["chevy", "vw", "mercedes", "range rover", "benz", "ram", "gmc"]) {
      const canon = normalizeMake(alias);
      expect(canon, alias).not.toBeNull();
      expect(VEHICLE_MAKES, alias).toContain(canon as string);
    }
  });

  it("returns null for the unknown / empty so the buyer falls back to manual or 'I don't know'", () => {
    expect(normalizeMake("Studebaker")).toBeNull();
    expect(normalizeMake("")).toBeNull();
    expect(normalizeMake(undefined)).toBeNull();
    expect(normalizeMake(null)).toBeNull();
  });
});
