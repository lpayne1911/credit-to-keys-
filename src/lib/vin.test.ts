import { describe, it, expect } from "vitest";
import { parseVpicResult, parseVpicEquipment, looksLikeVin, vinCheckDigitValid } from "./vin";

describe("parseVpicResult", () => {
  it("maps a vPIC record into a clean vehicle shape", () => {
    const v = parseVpicResult({
      ModelYear: "2021",
      Make: "TOYOTA",
      Model: "CAMRY",
      Trim: "XSE",
      ErrorCode: "0",
    });
    expect(v).toEqual({ year: 2021, make: "Toyota", model: "Camry", trim: "XSE" });
  });

  it("returns nulls for an empty/missing record", () => {
    expect(parseVpicResult(undefined)).toEqual({
      year: null,
      make: null,
      model: null,
      trim: null,
    });
  });

  it("drops an implausible year", () => {
    const v = parseVpicResult({ ModelYear: "0", Make: "Honda" });
    expect(v.year).toBeNull();
    expect(v.make).toBe("Honda");
  });
});

describe("parseVpicEquipment", () => {
  it("maps equipment and builds an engine string from displacement + cylinders", () => {
    const e = parseVpicEquipment({
      BodyClass: "Sport Utility Vehicle (SUV)/Multipurpose Vehicle (MPV)",
      DriveType: "AWD/All-Wheel Drive",
      DisplacementL: "2.5",
      EngineCylinders: "4",
      FuelTypePrimary: "Gasoline",
      TransmissionStyle: "Continuously Variable Transmission (CVT)",
    });
    expect(e.bodyStyle).toContain("SUV");
    expect(e.drivetrain).toBe("AWD/All-Wheel Drive");
    expect(e.engine).toBe("2.5L 4-Cyl");
    expect(e.fuelType).toBe("Gasoline");
    expect(e.transmission).toContain("CVT");
  });

  it("drops vPIC placeholder / empty values", () => {
    const e = parseVpicEquipment({ BodyClass: "", DriveType: "Not Applicable", FuelTypePrimary: "  " });
    expect(e.bodyStyle).toBeNull();
    expect(e.drivetrain).toBeNull();
    expect(e.fuelType).toBeNull();
    expect(e.engine).toBeNull();
  });

  it("returns all null for an empty record", () => {
    expect(parseVpicEquipment(undefined)).toEqual({
      bodyStyle: null, drivetrain: null, engine: null, transmission: null, fuelType: null,
    });
  });
});

describe("looksLikeVin", () => {
  it("accepts a valid 17-char VIN", () => {
    expect(looksLikeVin("4T1BZ1HK5KU019876")).toBe(true);
  });
  it("rejects wrong length or illegal letters (I/O/Q)", () => {
    expect(looksLikeVin("12345")).toBe(false);
    expect(looksLikeVin("4T1BZ1HK5KU01987I")).toBe(false);
  });
});

describe("vinCheckDigitValid", () => {
  it("accepts a VIN with a valid check digit (ISO 3779 example)", () => {
    expect(vinCheckDigitValid("1HGCM82633A004352")).toBe(true);
  });
  it("rejects a VIN whose character was altered (typo)", () => {
    expect(vinCheckDigitValid("1HGCM82633A004351")).toBe(false);
  });
  it("rejects anything that isn't a 17-char VIN shape", () => {
    expect(vinCheckDigitValid("ABC")).toBe(false);
    expect(vinCheckDigitValid("1HGCM82633A00435I")).toBe(false); // contains I
  });
});
