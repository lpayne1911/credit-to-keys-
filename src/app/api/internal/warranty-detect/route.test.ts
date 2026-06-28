import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

function post(body: unknown, secret?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret !== undefined) headers["x-diagnostic-secret"] = secret;
  return new Request("http://localhost/api/internal/warranty-detect", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

const SECRET = "test-diagnostic-secret";

describe("POST /api/internal/warranty-detect", () => {
  beforeEach(() => {
    process.env.DIAGNOSTIC_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.DIAGNOSTIC_SECRET;
  });

  it("404s when the diagnostic secret is not configured (disabled by default)", async () => {
    delete process.env.DIAGNOSTIC_SECRET;
    const res = await POST(post({ text: "Honda Care" }, SECRET));
    expect(res.status).toBe(404);
  });

  it("401s without the correct secret header", async () => {
    const res = await POST(post({ text: "Honda Care" }));
    expect(res.status).toBe(401);
    const res2 = await POST(post({ text: "Honda Care" }, "wrong"));
    expect(res2.status).toBe(401);
  });

  it("400s on a missing/empty text field", async () => {
    const res = await POST(post({ text: "" }, SECRET));
    expect(res.status).toBe(400);
  });

  it("classifies a service contract as warranty-like", async () => {
    const res = await POST(post({ text: "Zurich VSC - $3,995" }, SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isWarrantyLike).toBe(true);
    expect(json.matchedTerm).toBeTruthy();
    expect(json.excludedReason).toBeNull();
  });

  it("classifies an excluded F&I product as NOT warranty, with a reason", async () => {
    const res = await POST(post({ text: "GAP Coverage - $995" }, SECRET));
    const json = await res.json();
    expect(json.isWarrantyLike).toBe(false);
    expect(json.excludedReason).toBeTruthy();
  });

  it("does not false-positive on ambiguous tier words", async () => {
    const res = await POST(post({ text: "Platinum Package - $899" }, SECRET));
    const json = await res.json();
    expect(json.isWarrantyLike).toBe(false);
  });
});
