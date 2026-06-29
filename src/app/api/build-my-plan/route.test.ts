import { describe, it, expect } from "vitest";
import { POST } from "./route";

/**
 * Route-level tests for Build My Plan. No MarketCheck key or Supabase env is set
 * in tests, so the market band comes from the deterministic mock (flagged via
 * pricing.isEstimate) and the sheet is returned inline (persisted: false).
 */
function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/build-my-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/build-my-plan", () => {
  it("builds a Target Deal Sheet from a valid intake", async () => {
    const res = await POST(
      jsonRequest({
        vehicle: { year: "2021", make: "Toyota", model: "RAV4", trim: "XLE", mileage: "30000" },
        condition: "used",
        zip: "21201",
        buyerState: "MD",
        creditBand: "good",
        termMonths: "60",
        downPayment: "3000",
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.planId).toBe("string");
    expect(data.persisted).toBe(false);
    expect(data.result.schemaVersion).toBe("target-plan-1");
    expect(data.result.vehicleLabel).toBe("2021 Toyota RAV4 XLE");
    expect(data.result.financing.aprBand.low).toBe(6.5); // "good" band
    expect(Array.isArray(data.result.gamePlan)).toBe(true);
    expect(data.result.gamePlan.length).toBeGreaterThan(0);
    // No real MarketCheck key in tests → mock band, flagged as an estimate.
    expect(data.result.pricing.isEstimate).toBe(true);
  });

  it("requires a vehicle (422)", async () => {
    const res = await POST(jsonRequest({ creditBand: "good", buyerState: "MD" }));
    expect(res.status).toBe(422);
  });

  it("rejects malformed JSON (400)", async () => {
    const bad = new Request("http://localhost/api/build-my-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    expect((await POST(bad)).status).toBe(400);
  });

  it("defaults credit band to unknown when omitted", async () => {
    const res = await POST(jsonRequest({ vehicle: { make: "Honda", model: "Civic" } }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result.financing.aprBand.low).toBe(5.0); // "unknown" band
  });
});
