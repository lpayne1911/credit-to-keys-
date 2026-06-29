/**
 * ============================================================================
 *  Rate limiting — abuse / cost-amplification / brute-force defense.
 * ============================================================================
 *
 *  WHY THIS EXISTS
 *  ---------------------------------------------------------------------------
 *  Several public routes are unauthenticated by design (a buyer scores a deal
 *  without an account) yet trigger real cost or state:
 *    - /api/market-check, /api/deals, /api/quote-review  → paid MarketCheck API
 *    - /api/parse                                        → 15 MB uploads to storage
 *    - /api/console/login                                → single shared password
 *  Without a throttle, any of these can be looped to drain a third-party quota,
 *  fill storage, or brute-force the console password. This module is the seam
 *  that closes that gap.
 *
 *  BACKEND SELECTION (automatic)
 *  ---------------------------------------------------------------------------
 *  - If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, the limiter
 *    uses a SHARED Redis counter (see `upstash-store.ts`). This is a HARD,
 *    cluster-wide cap that survives cold starts and is consistent across every
 *    serverless instance.
 *  - Otherwise it falls back to an in-process fixed-window counter. That is
 *    per-instance on serverless (effective limit = `limit × live-instances`,
 *    resets on cold start) — a real brake on a single attacker from one IP, but
 *    not a global guarantee. Configure Upstash/Vercel KV for production.
 *
 *  RESILIENCE: if the shared store errors (Redis outage, network blip) the
 *  limiter degrades to the in-memory fallback rather than failing the request —
 *  a limiter outage must never take down the buyer-facing API.
 *
 *  This file is SERVER ONLY.
 * ============================================================================
 */

import { createUpstashStore } from "./rate-limit/upstash-store";

export interface RateLimitResult {
  /** Whether the request is allowed (under the limit). */
  ok: boolean;
  /** The configured ceiling for the window. */
  limit: number;
  /** Requests remaining in the current window (never negative). */
  remaining: number;
  /** Seconds until the window resets — use for the Retry-After header. */
  retryAfterSec: number;
}

export interface RateLimitOptions {
  /** Logical bucket name, e.g. "console-login". Keeps separate routes isolated. */
  key: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/** A single window's state for one key. */
export interface RateLimitHit {
  count: number;
  resetAt: number;
}

/**
 * Swap-in seam for a shared/distributed store (Redis, KV, Supabase). May be
 * sync (in-memory) or async (network-backed) — callers always `await` it.
 */
export interface RateLimitStore {
  hit(
    compositeKey: string,
    windowMs: number,
    now: number,
  ): RateLimitHit | Promise<RateLimitHit>;
}

type Bucket = RateLimitHit;

/**
 * Default in-process fixed-window store. Best-effort on serverless (per
 * instance). Prunes expired buckets opportunistically so memory stays bounded
 * even under a flood of distinct keys (e.g. spoofed X-Forwarded-For values).
 */
class MemoryStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  hit(compositeKey: string, windowMs: number, now: number) {
    this.maybeSweep(now);
    const existing = this.buckets.get(compositeKey);
    if (!existing || now >= existing.resetAt) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.buckets.set(compositeKey, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  }

  private maybeSweep(now: number) {
    // Sweep at most once per 60s to keep this O(1) amortized.
    if (now - this.lastSweep < 60_000) return;
    this.lastSweep = now;
    for (const [k, b] of this.buckets) {
      if (now >= b.resetAt) this.buckets.delete(k);
    }
  }
}

/**
 * In-memory fallback, always available. Used directly when no shared store is
 * configured, and as the degradation path if the shared store errors.
 */
const memoryFallback = new MemoryStore();

let cachedStore: RateLimitStore | null = null;

/**
 * Resolve the active store once per process: Upstash Redis when configured,
 * otherwise the in-memory fallback. Cached so we don't re-read env per request.
 */
function getStore(): RateLimitStore {
  if (cachedStore) return cachedStore;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  cachedStore = url && token ? createUpstashStore(url, token) : memoryFallback;
  return cachedStore;
}

/**
 * Best-effort client IP from proxy headers. On Vercel, `x-forwarded-for` is set
 * by the platform; we take the FIRST hop (the original client). Falls back to a
 * shared "unknown" bucket so a missing header can't bypass the limit entirely.
 *
 * NOTE: clients can spoof X-Forwarded-For when not behind a trusted proxy. On
 * Vercel the platform overwrites it, so the first entry is trustworthy there.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Record a hit and report whether the caller is within its limit. Uses the
 * configured shared store (Upstash) when available, the in-memory fallback
 * otherwise. If the shared store throws, it degrades to in-memory rather than
 * failing the request. Pass an explicit `store` to override (used in tests).
 */
export async function rateLimit(
  req: Request,
  opts: RateLimitOptions,
  store: RateLimitStore = getStore(),
  now: number = Date.now(),
): Promise<RateLimitResult> {
  const composite = `${opts.key}:${clientIp(req)}`;
  let hit: RateLimitHit;
  try {
    hit = await store.hit(composite, opts.windowMs, now);
  } catch {
    // Shared-store outage: fall back to the per-instance counter so the limiter
    // still applies *some* cap and the request isn't dropped.
    hit = memoryFallback.hit(composite, opts.windowMs, now);
  }
  const remaining = Math.max(0, opts.limit - hit.count);
  return {
    ok: hit.count <= opts.limit,
    limit: opts.limit,
    remaining,
    retryAfterSec: Math.max(1, Math.ceil((hit.resetAt - now) / 1000)),
  };
}

/** Standard rate-limit headers for any response (RFC draft + Retry-After). */
export function rateLimitHeaders(r: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(r.limit),
    "RateLimit-Remaining": String(r.remaining),
  };
  if (!r.ok) headers["Retry-After"] = String(r.retryAfterSec);
  return headers;
}
