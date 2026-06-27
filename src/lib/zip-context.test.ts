import { describe, it, expect } from "vitest";
import { isValidZip, zip3ToState, deriveZipContext } from "./zip-context";

describe("isValidZip", () => {
  it("accepts a clean 5-digit ZIP (with surrounding whitespace)", () => {
    expect(isValidZip("90210")).toBe(true);
    expect(isValidZip("07030")).toBe(true);
    expect(isValidZip("  10001 ")).toBe(true);
  });

  it("rejects anything that isn't exactly five digits", () => {
    expect(isValidZip("1234")).toBe(false);
    expect(isValidZip("123456")).toBe(false);
    expect(isValidZip("abcde")).toBe(false);
    expect(isValidZip("902 1")).toBe(false);
    expect(isValidZip("")).toBe(false);
  });
});

describe("zip3ToState", () => {
  it("maps known prefixes to the right state", () => {
    expect(zip3ToState("90001")).toBe("CA");
    expect(zip3ToState("10001")).toBe("NY");
    expect(zip3ToState("75001")).toBe("TX");
    expect(zip3ToState("60601")).toBe("IL");
    expect(zip3ToState("33101")).toBe("FL");
    expect(zip3ToState("99501")).toBe("AK");
  });

  it("resolves range boundaries correctly", () => {
    expect(zip3ToState("75000")).toBe("TX"); // 750 low edge
    expect(zip3ToState("79999")).toBe("TX"); // 799 high edge
    expect(zip3ToState("80000")).toBe("CO"); // next range starts
    expect(zip3ToState("88500")).toBe("TX"); // 885 island inside NM territory
  });

  it("returns null for invalid input and unassigned prefixes", () => {
    expect(zip3ToState("1234")).toBeNull();
    expect(zip3ToState("00000")).toBeNull(); // below first range
  });
});

describe("deriveZipContext", () => {
  it("returns null for an invalid ZIP", () => {
    expect(deriveZipContext("abc")).toBeNull();
    expect(deriveZipContext("1234")).toBeNull();
  });

  it("derives state + Census region for known ZIPs", () => {
    expect(deriveZipContext("90001")).toEqual({
      zip: "90001", state: "CA", region: "West", incomeContext: null,
    });
    expect(deriveZipContext("10001")).toEqual({
      zip: "10001", state: "NY", region: "Northeast", incomeContext: null,
    });
    expect(deriveZipContext("75001")).toEqual({
      zip: "75001", state: "TX", region: "South", incomeContext: null,
    });
    expect(deriveZipContext("60601")).toEqual({
      zip: "60601", state: "IL", region: "Midwest", incomeContext: null,
    });
  });

  it("returns null state/region for a valid-but-unrecognized prefix", () => {
    const ctx = deriveZipContext("00000");
    expect(ctx).toEqual({ zip: "00000", state: null, region: null, incomeContext: null });
  });

  it("never populates incomeContext (reserved seam)", () => {
    expect(deriveZipContext("90001")?.incomeContext).toBeNull();
  });
});
