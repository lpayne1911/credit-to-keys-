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
  it("allows up to the limit, then blocks", async () => {
    const store = freshStore();
    const opts = { key: "t", limit: 3, windowMs: 1000 };
    const req = reqWithIp("9.9.9.9");
    expect((await rateLimit(req, opts, store, 0)).ok).toBe(true); // 1
    expect((await rateLimit(req, opts, store, 0)).ok).toBe(true); // 2
    const third = await rateLimit(req, opts, store, 0);
    expect(third.ok).toBe(true); // 3
    expect(third.remaining).toBe(0);
    const fourth = await rateLimit(req, opts, store, 0);
    expect(fourth.ok).toBe(false); // 4 — over
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it("isolates different IPs", async () => {
    const store = freshStore();
    const opts = { key: "t", limit: 1, windowMs: 1000 };
    expect((await rateLimit(reqWithIp("1.1.1.1"), opts, store, 0)).ok).toBe(true);
    expect((await rateLimit(reqWithIp("2.2.2.2"), opts, store, 0)).ok).toBe(true);
    expect((await rateLimit(reqWithIp("1.1.1.1"), opts, store, 0)).ok).toBe(false);
  });

  it("isolates different buckets for the same IP", async () => {
    const store = freshStore();
    const req = reqWithIp("1.1.1.1");
    expect((await rateLimit(req, { key: "a", limit: 1, windowMs: 1000 }, store, 0)).ok).toBe(true);
    expect((await rateLimit(req, { key: "b", limit: 1, windowMs: 1000 }, store, 0)).ok).toBe(true);
  });

  it("resets after the window elapses", async () => {
    const store = freshStore();
    const opts = { key: "t", limit: 1, windowMs: 1000 };
    const req = reqWithIp("5.5.5.5");
    expect((await rateLimit(req, opts, store, 0)).ok).toBe(true);
    expect((await rateLimit(req, opts, store, 500)).ok).toBe(false);
    expect((await rateLimit(req, opts, store, 1500)).ok).toBe(true); // window rolled over
  });

  it("degrades to the in-memory fallback when the shared store throws", async () => {
    const flakyStore: RateLimitStore = {
      hit() {
        throw new Error("redis down");
      },
    };
    const opts = { key: "degrade", limit: 1, windowMs: 1000 };
    const req = reqWithIp("7.7.7.7");
    // First call: store throws → fallback records 1 → allowed.
    expect((await rateLimit(req, opts, flakyStore, 0)).ok).toBe(true);
    // Second call same window: fallback now at 2 → blocked. Proves the limiter
    // still caps during a shared-store outage instead of failing open entirely.
    expect((await rateLimit(req, opts, flakyStore, 0)).ok).toBe(false);
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
