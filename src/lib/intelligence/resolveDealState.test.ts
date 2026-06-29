import { describe, it, expect } from "vitest";
import {
  resolveDealState,
  zipToState,
  normalizeStateCode,
  stateSourceNote,
} from "./resolveDealState";

describe("normalizeStateCode", () => {
  it("accepts 2-letter codes and full names; rejects junk", () => {
    expect(normalizeStateCode("md")).toBe("MD");
    expect(normalizeStateCode("Maryland")).toBe("MD");
    expect(normalizeStateCode("District of Columbia")).toBe("DC");
    expect(normalizeStateCode("ZZ")).toBeNull();
    expect(normalizeStateCode("")).toBeNull();
    expect(normalizeStateCode(undefined)).toBeNull();
  });
});

describe("zipToState (verified ZIP3 prefixes, all 50 + DC)", () => {
  it("maps known ZIPs across regions", () => {
    expect(zipToState("20850")).toBe("MD"); // Rockville
    expect(zipToState("10001")).toBe("NY"); // NYC
    expect(zipToState("75201")).toBe("TX"); // Dallas
    expect(zipToState("19801")).toBe("DE"); // Wilmington
    expect(zipToState("20001")).toBe("DC"); // Washington
    expect(zipToState("22201")).toBe("VA"); // Arlington
    expect(zipToState("99501")).toBe("AK"); // Anchorage
    expect(zipToState("98101")).toBe("WA"); // Seattle
    expect(zipToState("96813")).toBe("HI"); // Honolulu
    expect(zipToState("02903")).toBe("RI"); // Providence
  });
  it("handles known split-prefix edges", () => {
    expect(zipToState("73301")).toBe("TX"); // Austin IRS — TX inside OK's range
    expect(zipToState("74103")).toBe("OK"); // Tulsa
    expect(zipToState("05501")).toBe("MA"); // Andover IRS — MA inside VT's range
    expect(zipToState("05601")).toBe("VT"); // Montpelier
  });
  it("returns null for partial ZIPs, territories, and military prefixes", () => {
    expect(zipToState("208")).toBeNull(); // too short
    expect(zipToState("00601")).toBeNull(); // Puerto Rico — omitted
    expect(zipToState("09001")).toBeNull(); // APO Europe — omitted
    expect(zipToState(null)).toBeNull();
  });
});

describe("resolveDealState — priority", () => {
  it("explicit registration state wins over everything", () => {
    const r = resolveDealState({
      registrationState: "MD",
      purchaseState: "VA",
      dealerZip: "10001",
    });
    expect(r.stateCode).toBe("MD");
    expect(r.source).toBe("explicit_registration_state");
    expect(r.confidence).toBe("high");
  });

  it("explicit purchase state (incl. buyerState) works", () => {
    expect(resolveDealState({ purchaseState: "TX" }).source).toBe("explicit_purchase_state");
    const b = resolveDealState({ buyerState: "ny" });
    expect(b.stateCode).toBe("NY");
    expect(b.source).toBe("explicit_purchase_state");
    expect(b.confidence).toBe("high");
  });

  it("registration ZIP resolves with medium confidence", () => {
    const r = resolveDealState({ registrationZip: "20850" });
    expect(r.stateCode).toBe("MD");
    expect(r.source).toBe("registration_zip");
    expect(r.confidence).toBe("medium");
    expect(r.limitations).toMatch(/ZIP/i);
  });

  it("registration ZIP is preferred over dealer ZIP", () => {
    const r = resolveDealState({ registrationZip: "20850", dealerZip: "10001" });
    expect(r.stateCode).toBe("MD");
    expect(r.source).toBe("registration_zip");
  });

  it("dealer ZIP is a medium-confidence fallback with a limitation", () => {
    const r = resolveDealState({ dealerZip: "10001" });
    expect(r.stateCode).toBe("NY");
    expect(r.source).toBe("dealer_zip");
    expect(r.confidence).toBe("medium");
    expect(r.limitations).toMatch(/may differ|verify/i);
  });

  it("dealer address (free text) resolves as a fallback", () => {
    const r = resolveDealState({ dealerAddress: "123 Main St, Rockville, MD 20850" });
    expect(r.stateCode).toBe("MD");
    expect(r.source).toBe("dealer_address");
  });

  it("registration state beats dealer state when they differ", () => {
    const r = resolveDealState({ registrationState: "MD", dealerState: "VA" });
    expect(r.stateCode).toBe("MD");
    expect(r.source).toBe("explicit_registration_state");
  });

  it("returns unknown (low) with a limitation when nothing resolves", () => {
    const r = resolveDealState({ dealerZip: "00601" }); // Puerto Rico — omitted
    expect(r.stateCode).toBeNull();
    expect(r.source).toBe("unknown");
    expect(r.confidence).toBe("low");
    expect(r.limitations).toBeTruthy();
  });
});

describe("stateSourceNote", () => {
  it("explains inferred sources, stays quiet for explicit purchase state", () => {
    expect(stateSourceNote(resolveDealState({ registrationZip: "20850" }))).toMatch(
      /Using Maryland from your ZIP/i,
    );
    expect(stateSourceNote(resolveDealState({ dealerZip: "10001" }))).toMatch(
      /dealer ZIP.*verify/i,
    );
    expect(stateSourceNote(resolveDealState({ buyerState: "MD" }))).toBe("");
    expect(stateSourceNote(resolveDealState({}))).toBe("");
  });
});
