/**
 * Upstash Redis REST backend for the rate limiter — a SHARED, cluster-wide
 * fixed-window counter.
 *
 * Why REST + fetch (no SDK): the Upstash REST API is a plain HTTPS endpoint, so
 * this works in every runtime (Node + Edge) with zero dependencies, matching how
 * the rest of the app talks to external services (MarketCheck, NHTSA). Vercel KV
 * is Upstash under the hood and exposes the same REST URL + token, so this works
 * for either — just point the env vars at your instance.
 *
 * ENV:
 *   UPSTASH_REDIS_REST_URL    e.g. https://us1-xxxx.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN  the REST token (SERVER ONLY — never NEXT_PUBLIC_*)
 *
 * Window semantics (atomic, single round-trip pipeline):
 *   1. INCR key                  → counter for this window (1 on first hit)
 *   2. PEXPIRE key windowMs NX   → set TTL only on the first hit, so the window
 *                                  resets windowMs after it STARTED, not on every
 *                                  request (true fixed window, not sliding).
 *   3. PTTL key                  → remaining ms, used to compute resetAt.
 *
 * This file is SERVER ONLY.
 */

import type { RateLimitStore, RateLimitHit } from "../rate-limit";

interface PipelineEntry {
  result?: number | string | null;
  error?: string;
}

export function createUpstashStore(url: string, token: string): RateLimitStore {
  // Trim a trailing slash so `${base}/pipeline` is always well-formed.
  const base = url.replace(/\/+$/, "");

  return {
    async hit(compositeKey: string, windowMs: number, now: number): Promise<RateLimitHit> {
      const res = await fetch(`${base}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", compositeKey],
          ["PEXPIRE", compositeKey, String(windowMs), "NX"],
          ["PTTL", compositeKey],
        ]),
        // Never cache a rate-limit write.
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Upstash rate-limit store returned ${res.status}`);
      }

      const data = (await res.json()) as PipelineEntry[];
      if (!Array.isArray(data) || data[0]?.error) {
        throw new Error(data?.[0]?.error || "Upstash pipeline error");
      }

      const count = Number(data[0]?.result ?? 0);
      const pttl = Number(data[2]?.result ?? -1);
      // PTTL is -1 (no expiry) or -2 (no key) on edge cases; fall back to a full
      // window so resetAt / Retry-After stay sane.
      const resetAt = pttl > 0 ? now + pttl : now + windowMs;

      return { count, resetAt };
    },
  };
}
