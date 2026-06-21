import { describe, it, expect } from "vitest";
import { parseVpicResult, looksLikeVin } from "./vin";

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

describe("looksLikeVin", () => {
  it("accepts a valid 17-char VIN", () => {
    expect(looksLikeVin("4T1BZ1HK5KU019876")).toBe(true);
  });
  it("rejects wrong length or illegal letters (I/O/Q)", () => {
    expect(looksLikeVin("12345")).toBe(false);
    expect(looksLikeVin("4T1BZ1HK5KU01987I")).toBe(false);
  });
});
