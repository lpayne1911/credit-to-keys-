import { describe, it, expect } from "vitest";
import { POST as dealsPOST } from "./deals/route";
import { POST as loginPOST } from "./console/login/route";
import { POST as parsePOST } from "./parse/route";

/**
 * Integration tests that exercise the ACTUAL route handlers (not the rate-limit
 * / sniff helpers in isolation) to prove the security fixes fire end-to-end.
 *
 * The in-memory limiter is keyed by client IP and its store is shared across the
 * whole test process, so each test uses a DISTINCT x-forwarded-for value to stay
 * independent.
 */

function jsonReq(url: string, body: unknown, ip: string): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

/** Copy into a fresh ArrayBuffer so the File constructor gets a valid BlobPart. */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u8.byteLength);
  new Uint8Array(ab).set(u8);
  return ab;
}

function fileReq(url: string, bytes: Uint8Array, type: string, ip: string): Request {
  const form = new FormData();
  const name = "quote." + (type.split("/")[1] || "bin");
  form.append("file", new File([toArrayBuffer(bytes)], name, { type }));
  return new Request(url, {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: form,
  });
}

describe("rate limiting fires through the real route handlers", () => {
  it("/api/deals returns 429 after the per-IP limit (30/5min) is exceeded", async () => {
    const ip = "203.0.113.1";
    const body = { deal: { apr: "14.9", vehiclePrice: "28000", creditBand: "good" } };
    let last = 0;
    // 30 allowed, the 31st must be blocked.
    for (let i = 0; i < 31; i++) {
      const res = await dealsPOST(jsonReq("http://localhost/api/deals", body, ip));
      last = res.status;
    }
    expect(last).toBe(429);
  });

  it("a different IP is not affected by another IP's limit", async () => {
    const res = await dealsPOST(
      jsonReq(
        "http://localhost/api/deals",
        { deal: { apr: "14.9", vehiclePrice: "28000", creditBand: "good" } },
        "203.0.113.2",
      ),
    );
    expect(res.status).toBe(200);
  });

  it("/api/console/login returns 429 after 10 attempts and sets Retry-After", async () => {
    const ip = "203.0.113.3";
    let res!: Response;
    for (let i = 0; i < 11; i++) {
      res = await loginPOST(jsonReq("http://localhost/api/console/login", { password: "x" }, ip));
    }
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("upload hardening fires through the real /api/parse handler", () => {
  it("rejects a spoofed upload (claims image/png, bytes are HTML) with 415", async () => {
    const htmlBytes = new Uint8Array(
      [..."<html><script>alert(1)</script></html>"].map((c) => c.charCodeAt(0)),
    );
    const res = await parsePOST(
      fileReq("http://localhost/api/parse", htmlBytes, "image/png", "203.0.113.4"),
    );
    expect(res.status).toBe(415);
  });

  it("accepts a genuine PDF (correct magic bytes) with 200", async () => {
    const pdfBytes = new Uint8Array(
      [..."%PDF-1.7\n%mock pdf body"].map((c) => c.charCodeAt(0)),
    );
    const res = await parsePOST(
      fileReq("http://localhost/api/parse", pdfBytes, "application/octet-stream", "203.0.113.5"),
    );
    expect(res.status).toBe(200);
  });
});
