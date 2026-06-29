# Security Review — Driveway Advocate

_Whole-app review of the buyer-side Deal Check platform (Next.js App Router +
Supabase). Scope: data isolation, secret handling, auth, public API abuse,
uploads. This is a point-in-time review; re-run it as the surface grows._

## TL;DR

The **data-isolation core is sound** — the thing that would cause a catastrophic
"one buyer reads another buyer's deal" breach is closed. The remaining risk for
an app like this is **economic/abuse** (drain the paid MarketCheck quota, fill
storage, brute-force the one console password), not data exfiltration.

This review shipped fixes for the rate-limiting and upload-hardening findings
below. The console-auth replacement is specified separately in
[`docs/console-auth-plan.md`](./console-auth-plan.md).

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | No rate limiting on public/auth routes (brute-force + cost amplification) | High | **Fixed** |
| 2 | `/api/parse` trusted client MIME + user filename in storage key | Medium | **Fixed** |
| 3 | Console auth is a single shared password, no accounts/audit | Medium | **Fixed** (Supabase Auth + operators allowlist + audit) |
| 4 | In-memory rate limiter is per-instance on serverless | Low | **Fixed** (Upstash/KV shared store; in-memory fallback) |
| 5 | `email` fields validated for length only, not format | Low | Accept (not used for auth) |

## What's already strong (verified, not assumed)

- **RLS is genuinely default-deny.** `supabase/migrations/0001_init.sql` runs
  `enable row level security` **and** `force row level security` on `leads`,
  `deals`, and `findings`, with **zero** policies granted to `anon` /
  `authenticated`. The `deal-uploads` storage bucket is created `public = false`.
  Net effect: the public anon key shipped in `.env.production` can read and write
  **nothing** directly. ✅
- **Service-role key never reaches the browser.** `getServiceClient()` is
  imported only by API routes, server components (`console/[id]/page.tsx` is not
  a Client Component), and server-only libs (`lib/deals.ts`,
  `lib/market-snapshots.ts`). No `"use client"` file imports `lib/supabase/server`. ✅
- **Committed `.env.production` holds only public values** — the Supabase URL and
  the RLS-constrained anon key (designed to ship to the browser). Secrets
  (`SUPABASE_SERVICE_ROLE_KEY`, `CONSOLE_PASSWORD`) are excluded by `.gitignore`
  and live in Vercel encrypted env. ✅
- **Console cookie is not the raw password.** It's an HMAC-SHA256 of the password
  (`createHmac("sha256", pw)`), set `httpOnly`, `secure` in production,
  `sameSite: "lax"`, and compared with `timingSafeEqual` (constant-time). ✅
- **Capability-URL privacy model.** Buyers reach a verdict via an unguessable v4
  UUID (122 bits of entropy — not enumerable). All reads are server-mediated. ✅
- **Inputs are Zod-validated with bounded sizes.** `lib/schemas.ts` caps string
  lengths and array sizes (`.max(40)` on fees/add-ons, `.max(50)` on flags),
  which blunts oversized-payload abuse. ✅
- **VIN decode is injection-safe.** `looksLikeVin()` enforces an exact 17-char
  `[A-HJ-NPR-Z0-9]` pattern before the value is interpolated into the outbound
  NHTSA URL — no SSRF / URL injection. ✅
- **Internal diagnostic route is well-gated.** `/api/internal/warranty-detect`
  returns 404 unless `DIAGNOSTIC_SECRET` is set, requires the secret header,
  rate-limits, touches no DB/PII, and isn't linked in the UI. ✅

## Findings & fixes

### 1. No rate limiting on public / auth routes — **High** — Fixed

**Risk.** Several routes are unauthenticated by design (a buyer scores a deal
without an account) yet carry real cost or state, and none were throttled:

- `/api/console/login` — a single shared password with no lockout is
  **brute-forceable** once the app is public.
- `/api/market-check`, `/api/deals`, `/api/quote-review` — each can trigger a
  **paid MarketCheck API** call. Looping them is **cost/quota amplification**.
- `/api/parse` — accepts 15 MB uploads to storage and an LLM extraction call.
- `/api/intake`, `/api/deals/[id]/review-request` — unauthenticated DB writes
  (row/lead spam, status churn).

**Fix.** Added `src/lib/rate-limit.ts` — a per-IP fixed-window limiter (client IP
from `x-forwarded-for`) with standard `RateLimit-*` / `Retry-After` headers and a
`RateLimitStore` seam for a shared backend. Applied per route:

| Route | Limit | Window |
|-------|-------|--------|
| `console-login` | 10 | 10 min |
| `market-check` | 20 | 5 min |
| `deals` | 30 | 5 min |
| `quote-review` | 20 | 5 min |
| `parse-upload` | 10 | 10 min |
| `intake` | 20 | 10 min |
| `review-request` | 20 | 10 min |
| `vin-decode` | 60 | 5 min |

Over-limit requests return `429` with `Retry-After`. Unit-tested in
`src/lib/rate-limit.test.ts`.

### 2. `/api/parse` trusted client MIME and user filename — **Medium** — Fixed

**Risk.** The route gated on `file.type` (client-declared, spoofable) and built
the storage key from `file.name.split(".").pop()` (user-controlled). A request
could (a) claim `image/png` while uploading arbitrary bytes, and (b) inject path
characters via the extension (e.g. a crafted filename) into the storage key.
Impact was limited by the private bucket, but the input was untrusted.

**Fix.** Added `src/lib/parse/sniff-upload.ts`, which inspects the **magic bytes**
and returns a canonical content type + a fixed safe extension (`pdf`, `jpg`,
`png`, `gif`, `webp`, `heic`) or `null`. The route now rejects anything whose
bytes aren't a real image/PDF (`415`) and builds the storage path from a
server-generated UUID + the sniffed extension only — `file.name` never touches
the key. Unit-tested in `src/lib/parse/sniff-upload.test.ts`, including a spoofed
HTML/script payload that is correctly rejected.

### 3. Console auth is a single shared password — **Medium** — Fixed

The shared password is gone. The console now uses **Supabase Auth** (email+password
and social/OAuth — Google, Apple) **plus an `operators` allowlist**: a valid
Supabase session is necessary but not sufficient — the user id must also be an
`active` row in `public.operators`. Sessions are real (revocable per-user, JWT
validated against the auth server via `getUser()`, not just trusting the cookie),
there are roles (`reviewer`/`admin`), and every publish writes an attributable
`review_audit` row (also the CROA/TSR delivery-timestamp proof).

The allowlist is **email-keyed** (admins can invite before first login; the row
links to the auth user on first verified sign-in) and managed from an admin-only
view at `/console/operators` (invite by email, deactivate/reactivate, role
change — with a guard preventing an admin from locking themselves out).

Implementation: `0005_operators.sql`, `src/lib/console-auth.ts` (authorization
gate, unit-tested in `console-auth.test.ts`), `src/lib/operators.ts`,
`src/lib/supabase/ssr.ts` (cookie session), routes under `src/app/api/console/`
(login, oauth, callback, logout, publish, operators — admin gate unit-tested).
To activate: apply migration 0005, enable providers in Supabase, seed the first
admin operator by email. See [`docs/console-auth-plan.md`](./console-auth-plan.md).

### 4. In-memory limiter is per-instance on serverless — **Low** — Fixed

Originally the limiter was in-memory only, so on Vercel the effective ceiling was
`limit × live-instances` and counters reset on cold start — not a hard cap.

**Fix.** The limiter now auto-selects a **shared Upstash Redis** store
(`src/lib/rate-limit/upstash-store.ts`) when `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN` are set, giving a hard, cluster-wide fixed-window cap
that survives cold starts (atomic `INCR` + `PEXPIRE … NX` + `PTTL` in one REST
round-trip; no new npm dependency; Vercel KV exposes the same URL+token). When
the env vars are absent it uses the in-memory counter, and **if the shared store
errors it degrades to in-memory** rather than failing requests — a limiter
outage can't take down the buyer-facing API. Unit-tested with a mocked `fetch`
(`upstash-store.test.ts`) and a degradation test in `rate-limit.test.ts`.

Set the two env vars in Vercel to activate the hard cap in production.

### 5. `email` validated for length only — **Low** — Accept

`schemas.ts` bounds `email` to 320 chars but doesn't enforce `.email()` format.
It's stored for operator follow-up, never used for auth or as a redirect target,
so the risk is cosmetic (junk leads). Add `.email()` if/when email automation is
built (it's on the deferred list).

## Notes considered and judged acceptable

- **IDOR on `/api/deals/[id]/*`** — `review-request` and the verdict page key on
  the deal UUID with no ownership check. This is intentional: the unguessable
  UUID **is** the capability (there are no accounts yet). Rate limiting now caps
  abuse. Revisit when real buyer accounts land (layer owner-scoped RLS, per the
  migration's note).
- **CSRF on state-changing POSTs** — public routes have no session to forge
  against; the console cookie is `sameSite: lax` and the endpoints expect JSON
  bodies, which blocks classic cross-site form POSTs. Acceptable for v1; revisit
  with real auth.

## Recommended next steps (priority order)

1. Activate the new console auth: apply migration `0005_operators.sql`, enable
   the Email/Google/Apple providers in Supabase, and seed the first operator.
2. Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel to turn on
   the hard cluster-wide rate-limit cap (code is wired; it just needs the store).
3. Add `.email()` validation when email automation is introduced.
4. Re-run this review whenever payments, accounts, or a live parser provider land
   — each adds materially new surface (CROA/TSR advance-fee seam, owner-scoped
   RLS, third-party keys).
