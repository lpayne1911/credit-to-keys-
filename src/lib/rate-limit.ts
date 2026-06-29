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
 *  IMPLEMENTATION & ITS LIMITS (read before trusting this in prod)
 *  ---------------------------------------------------------------------------
 *  The default store is an in-process fixed-window counter. On a serverless
 *  platform (Vercel) each instance has its OWN memory, so the effective limit
 *  is `limit × live-instances`, and counters reset on cold start. That makes
 *  this a strong *courtesy* guard and a real brake on a single attacker from one
 *  IP — but NOT a hard, cluster-wide cap.
 *
 *  >>> For a hard guarantee, back this with a shared store (Upstash Redis,
 *      Supabase, Vercel KV). The `RateLimitStore` interface below is the seam:
 *      implement it against Redis and pass it in — no route changes needed. <<<
 *
 *  This file is SERVER ONLY.
 * ============================================================================
 */

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

/** Swap-in seam for a shared/distributed store (Redis, KV, Supabase). */
export interface RateLimitStore {
  hit(compositeKey: string, windowMs: number, now: number): {
    count: number;
    resetAt: number;
  };
}

interface Bucket {
  count: number;
  resetAt: number;
}

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

const defaultStore = new MemoryStore();

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
 * Record a hit and report whether the caller is within its limit.
 * Pass `store` to use a shared/distributed backend; defaults to in-memory.
 */
export function rateLimit(
  req: Request,
  opts: RateLimitOptions,
  store: RateLimitStore = defaultStore,
  now: number = Date.now(),
): RateLimitResult {
  const composite = `${opts.key}:${clientIp(req)}`;
  const { count, resetAt } = store.hit(composite, opts.windowMs, now);
  const remaining = Math.max(0, opts.limit - count);
  return {
    ok: count <= opts.limit,
    limit: opts.limit,
    remaining,
    retryAfterSec: Math.max(1, Math.ceil((resetAt - now) / 1000)),
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
