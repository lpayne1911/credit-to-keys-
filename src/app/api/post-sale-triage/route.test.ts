import { describe, it, expect } from "vitest";
import { POST } from "./route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/post-sale-triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/post-sale-triage", () => {
  it("triages signed add-ons and returns the result inline", async () => {
    const res = await POST(
      jsonRequest({
        buyerState: "MD",
        financed: true,
        lienholder: "Ally",
        dealerName: "City Motors",
        addOns: [
          { rawLabel: "Extended service contract", amount: "2500", financed: true },
          { rawLabel: "Nitrogen", amount: "299", financed: false },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.triageId).toBe("string");
    expect(data.persisted).toBe(false);
    expect(data.result.schemaVersion).toBe("post-sale-1");
    expect(data.result.cancellableCount).toBe(1); // VSC only
    expect(data.result.estimatedRefundCeiling).toBe(2500);
    expect(Array.isArray(data.result.contacts)).toBe(true);
  });

  it("accepts an empty intake without inventing a refund (200)", async () => {
    const res = await POST(jsonRequest({ buyerState: "CA", addOns: [] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.result.estimatedRefundCeiling).toBeNull();
  });

  it("rejects malformed JSON (400)", async () => {
    const bad = new Request("http://localhost/api/post-sale-triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    expect((await POST(bad)).status).toBe(400);
  });

  it("rejects an oversized add-on array (422)", async () => {
    const addOns = Array.from({ length: 100 }, (_, i) => ({ rawLabel: `p${i}`, amount: "10" }));
    expect((await POST(jsonRequest({ addOns }))).status).toBe(422);
  });
});
