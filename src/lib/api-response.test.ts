import { describe, it, expect } from "vitest";
import { apiError, apiOk } from "./api-response";

describe("apiError", () => {
  it("builds the { ok:false, error, code } envelope with a default status", async () => {
    const res = apiError("validation", "Bad input.");
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ ok: false, error: "Bad input.", code: "validation" });
  });

  it("honors a status override and extra headers", async () => {
    const res = apiError("rate_limited", "Slow down.", {
      headers: { "Retry-After": "30" },
    });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("maps each code to a sensible default status", () => {
    expect(apiError("invalid_json", "x").status).toBe(400);
    expect(apiError("unauthorized", "x").status).toBe(401);
    expect(apiError("forbidden", "x").status).toBe(403);
    expect(apiError("not_found", "x").status).toBe(404);
    expect(apiError("payload_too_large", "x").status).toBe(413);
    expect(apiError("unsupported_media", "x").status).toBe(415);
    expect(apiError("server_error", "x").status).toBe(500);
  });
});

describe("apiOk", () => {
  it("wraps the payload with ok:true and preserves legacy keys", async () => {
    const res = apiOk({ dealId: "abc", result: { score: 81 }, persisted: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, dealId: "abc", result: { score: 81 }, persisted: true });
  });
});
