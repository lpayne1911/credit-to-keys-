# Console Auth — Replacing the v1 Stopgap

> **STATUS: IMPLEMENTED.** The shared-password gate is gone. The console now uses
> Supabase Auth (email+password **and** social/OAuth — Google, Apple) gated by an
> `operators` allowlist, with a `review_audit` trail. See
> `supabase/migrations/0005_operators.sql`, `src/lib/console-auth.ts`,
> `src/lib/supabase/ssr.ts`, and the routes under `src/app/api/console/`. The
> design below is retained as the rationale + operator-onboarding runbook.
>
> **To go live:** (1) apply migration `0005`, (2) enable the Email + Google +
> Apple providers in the Supabase dashboard (+ set each provider's OAuth client),
> (3) seed the first admin operator (SQL at the bottom of the migration),
> (4) optionally set `NEXT_PUBLIC_SITE_URL` for stable OAuth redirects.

_Companion to [`docs/SECURITY-REVIEW.md`](./SECURITY-REVIEW.md) finding #3._

## Where we are today

The console is gated by `CONSOLE_PASSWORD` (`src/lib/console-auth.ts`):

- One shared password for all operators → no identity, **no per-operator audit
  trail**, no way to revoke one person without rotating everyone.
- The session cookie is `HMAC(password)` — it **cannot be revoked** without
  changing the password; the only expiry is the 8-hour cookie `maxAge`.
- No MFA, no roles. The interim brute-force brake is the new per-IP rate limit
  on `/api/console/login` (10 / 10 min).

This was a deliberate, well-marked stopgap (`>>> REPLACE WITH PROPER AUTH <<<`).
It is fine for a solo operator on an unlinked URL; it is **not** acceptable for
public launch or more than one operator.

## Design goals

1. **Real identities** — each operator is a distinct account; actions are
   attributable.
2. **Revocable sessions** — disable an operator without affecting others.
3. **Least privilege** — only approved operators reach the console; buyers never
   can, even if they authenticate.
4. **Audit trail** — who published which reviewed verdict, and when.
5. **Keep the interface stable** — preserve `isConsoleAuthed()` and the route
   guards so pages/routes don't churn. The migration swaps the *implementation*
   behind that function, exactly as the in-code note instructs.

## Recommended approach: Supabase Auth + an `operators` allowlist

Supabase Auth is already a dependency (`@supabase/ssr`, `@supabase/supabase-js`),
so this adds no new vendor.

### 1. Operator allowlist table

```sql
-- Operators allowed into the review console. Being an authenticated Supabase
-- user is NOT enough — the user id must appear here with an active role.
create table if not exists public.operators (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'reviewer'
               check (role in ('reviewer', 'admin')),
  active      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.operators enable row level security;
alter table public.operators force row level security;
-- No anon/authenticated policies: only the service role (server) reads this.

-- Audit: every published reviewed verdict, attributed to an operator.
create table if not exists public.review_audit (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals (id) on delete cascade,
  operator   uuid not null references public.operators (user_id),
  action     text not null,            -- e.g. 'publish_review'
  verdict    text,
  created_at timestamptz not null default now()
);
alter table public.review_audit enable row level security;
alter table public.review_audit force row level security;
```

### 2. Auth flow

- Operators sign in with Supabase Auth (email magic link or OAuth/SSO — no shared
  secret, MFA available through the provider).
- The SSR helper validates the session cookie server-side on every console
  request and resolves the user id.
- `isConsoleAuthed()` is rewritten to: **valid Supabase session AND a row in
  `operators` with `active = true`.** Same signature, so route guards
  (`/api/console/deals/[id]/publish`, the console pages) are unchanged.
- `passwordMatches` / `consoleCookieValue` / the `da_console` cookie are deleted
  once the new path is verified.

### 3. Roles & least privilege

- Default role `reviewer` can list deals and publish reviewed verdicts.
- `admin` additionally manages the `operators` table (invite/deactivate).
- The buyer-facing app gains no console access from merely being a Supabase user —
  authorization is the `operators` membership check, not authentication alone.

### 4. Audit

- The publish route (`/api/console/deals/[id]/publish`) writes a `review_audit`
  row with the operator's `user_id` on every publish. This also strengthens the
  **CROA/TSR advance-fee seam** already marked there: when paid review lands, the
  audit row is the timestamped proof that delivery preceded any charge.

### 5. Forward-compatible with buyer accounts

When buyers get accounts later, layer **owner-scoped RLS** on `deals`/`leads`
(e.g. `lead_id = auth.uid()`) on top of the existing default-deny base — per the
note in `0001_init.sql`. Operator access stays a separate, service-mediated path,
so the two authorization models don't entangle.

## Rollout

1. Add the migration (`operators`, `review_audit`) — no change to existing tables.
2. Implement the new `isConsoleAuthed()` behind the unchanged signature; wire
   Supabase SSR session reading.
3. Seed the first `admin` operator out-of-band (SQL insert against `auth.users`).
4. Ship login UI (magic link / SSO) replacing the password form in
   `ConsoleLogin`.
5. Verify end-to-end, then **delete** the `CONSOLE_PASSWORD` path and env var and
   remove the stopgap rate-limit comment's "until real auth" caveat.
6. Keep the per-IP login rate limit as defense-in-depth.

## Effort & dependencies

- No new vendor (Supabase Auth is already present).
- ~1 migration + ~1 rewritten module (`console-auth.ts`) + login UI swap.
- Route guards and console pages need **no** changes if the `isConsoleAuthed()`
  contract is preserved — which is the whole point of the existing seam.
