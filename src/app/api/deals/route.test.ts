import { describe, it, expect } from "vitest";
import { POST } from "./route";

/**
 * Route-level tests for the manual-entry scoring endpoint. No Supabase env is
 * configured in tests, so the route returns the scored verdict inline
 * (persisted: false) — which is exactly the graceful-degradation path we want
 * to verify, alongside validation behavior.
 */

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/deals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/deals", () => {
  it("scores a valid submission and returns a verdict inline", async () => {
    const res = await POST(
      jsonRequest({
        vehicle: { year: "2021", make: "Toyota", model: "Camry", mileage: "30000" },
        deal: { apr: "16.9", creditBand: "good", fees: [{ label: "Nitrogen", amount: "399" }] },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBeNull();
    expect(data.persisted).toBe(false);
    expect(["green", "amber", "red"]).toContain(data.result.overallVerdict);
  });

  it("rejects a submission with no vehicle make or model (422)", async () => {
    const res = await POST(jsonRequest({ deal: { apr: "7" } }));
    expect(res.status).toBe(422);
  });

  it("accepts an optional VIN and internal location, still scoring inline", async () => {
    const res = await POST(
      jsonRequest({
        vehicle: { make: "Honda", model: "Accord", vin: "1HGCV1F4XMA000000" },
        deal: { apr: "7", creditBand: "good" },
        location: { zip: "90210", state: "CA" },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.persisted).toBe(false);
    expect(["green", "amber", "red"]).toContain(data.result.overallVerdict);
  });

  it("returns a state-aware feeRisk channel alongside the verdict", async () => {
    const res = await POST(
      jsonRequest({
        vehicle: { make: "Honda", model: "Accord" },
        deal: { apr: "7", creditBand: "good", fees: [{ label: "Doc fee", amount: "500" }] },
        location: { state: "CA" },
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.feeRisk).toBeTruthy();
    expect(data.feeRisk.state).toBe("CA");
    // CA caps doc fees, so a $500 doc fee surfaces a critical message.
    expect(
      data.feeRisk.messages.some(
        (m: { severity: string }) => m.severity === "critical",
      ),
    ).toBe(true);
  });

  it("rejects malformed JSON (400)", async () => {
    const bad = new Request("http://localhost/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });

  it("rejects an oversized fees array (422)", async () => {
    const fees = Array.from({ length: 100 }, (_, i) => ({
      label: `fee ${i}`,
      amount: "10",
    }));
    const res = await POST(
      jsonRequest({ vehicle: { make: "Toyota", model: "Camry" }, deal: { fees } }),
    );
    expect(res.status).toBe(422);
  });
});
