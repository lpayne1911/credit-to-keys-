import { describe, it, expect } from "vitest";
import { rateLimit, clientIp, rateLimitHeaders, type RateLimitStore } from "./rate-limit";

function reqWithIp(ip: string): Request {
  return new Request("https://example.com", {
    headers: { "x-forwarded-for": ip },
  });
}

/** Fresh in-memory store per test so cases don't bleed into each other. */
function freshStore(): RateLimitStore {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    hit(key, windowMs, now) {
      const b = buckets.get(key);
      if (!b || now >= b.resetAt) {
        const fresh = { count: 1, resetAt: now + windowMs };
        buckets.set(key, fresh);
        return fresh;
      }
      b.count += 1;
      return b;
    },
  };
}

describe("clientIp", () => {
  it("takes the first hop of x-forwarded-for", () => {
    expect(clientIp(reqWithIp("1.2.3.4, 10.0.0.1"))).toBe("1.2.3.4");
  });

  it("falls back to a shared bucket when no IP header is present", () => {
    expect(clientIp(new Request("https://example.com"))).toBe("unknown");
  });
});

describe("rateLimit", () => {
  it("allows up to the limit, then blocks", () => {
    const store = freshStore();
    const opts = { key: "t", limit: 3, windowMs: 1000 };
    const req = reqWithIp("9.9.9.9");
    expect(rateLimit(req, opts, store, 0).ok).toBe(true); // 1
    expect(rateLimit(req, opts, store, 0).ok).toBe(true); // 2
    const third = rateLimit(req, opts, store, 0);
    expect(third.ok).toBe(true); // 3
    expect(third.remaining).toBe(0);
    const fourth = rateLimit(req, opts, store, 0);
    expect(fourth.ok).toBe(false); // 4 — over
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates different IPs", () => {
    const store = freshStore();
    const opts = { key: "t", limit: 1, windowMs: 1000 };
    expect(rateLimit(reqWithIp("1.1.1.1"), opts, store, 0).ok).toBe(true);
    expect(rateLimit(reqWithIp("2.2.2.2"), opts, store, 0).ok).toBe(true);
    expect(rateLimit(reqWithIp("1.1.1.1"), opts, store, 0).ok).toBe(false);
  });

  it("isolates different buckets for the same IP", () => {
    const store = freshStore();
    const req = reqWithIp("1.1.1.1");
    expect(rateLimit(req, { key: "a", limit: 1, windowMs: 1000 }, store, 0).ok).toBe(true);
    expect(rateLimit(req, { key: "b", limit: 1, windowMs: 1000 }, store, 0).ok).toBe(true);
  });

  it("resets after the window elapses", () => {
    const store = freshStore();
    const opts = { key: "t", limit: 1, windowMs: 1000 };
    const req = reqWithIp("5.5.5.5");
    expect(rateLimit(req, opts, store, 0).ok).toBe(true);
    expect(rateLimit(req, opts, store, 500).ok).toBe(false);
    expect(rateLimit(req, opts, store, 1500).ok).toBe(true); // window rolled over
  });
});

describe("rateLimitHeaders", () => {
  it("omits Retry-After when allowed and includes it when blocked", () => {
    const ok = rateLimitHeaders({ ok: true, limit: 5, remaining: 4, retryAfterSec: 30 });
    expect(ok["Retry-After"]).toBeUndefined();
    expect(ok["RateLimit-Remaining"]).toBe("4");
    const blocked = rateLimitHeaders({ ok: false, limit: 5, remaining: 0, retryAfterSec: 30 });
    expect(blocked["Retry-After"]).toBe("30");
  });
});
