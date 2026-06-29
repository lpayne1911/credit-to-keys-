import { describe, it, expect } from "vitest";
import { POST } from "./route";

/**
 * Route-level tests for the Quote Review endpoint. No Supabase env is configured
 * in tests, so the route returns the DealReviewResult inline (persisted: false)
 * with a generated id — the graceful-degradation path the result page falls back
 * to via sessionStorage.
 */
function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/quote-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quote-review", () => {
  it("reviews a valid submission and returns a deal-review result inline", async () => {
    const res = await POST(
      jsonRequest({
        vehicle: { year: "2021", make: "Toyota", model: "Camry", mileage: "30000" },
        pricing: { vehiclePrice: "30000", downPayment: "2000" },
        fees: [{ label: "Nitrogen", amount: "399" }],
        finance: { apr: "6.9", termMonths: "72", monthlyPayment: "520", amountFinanced: "29000" },
        buyerState: "CA",
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.dealId).toBe("string");
    expect(data.persisted).toBe(false);
    expect(data.result.schemaVersion).toBe("deal-review-1");
    expect(typeof data.result.dealScore).toBe("number");
    expect(Array.isArray(data.result.riskFlags)).toBe(true);
  });

  it("rejects a truly empty submission (422)", async () => {
    const res = await POST(jsonRequest({}));
    expect(res.status).toBe(422);
  });

  it("rejects malformed JSON (400)", async () => {
    const bad = new Request("http://localhost/api/quote-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    expect((await POST(bad)).status).toBe(400);
  });

  it("rejects an oversized fees array (422)", async () => {
    const fees = Array.from({ length: 100 }, (_, i) => ({ label: `fee ${i}`, amount: "10" }));
    const res = await POST(jsonRequest({ vehicle: { make: "Toyota" }, fees }));
    expect(res.status).toBe(422);
  });
});
