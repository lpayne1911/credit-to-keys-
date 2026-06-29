-- ============================================================================
--  Driveway Advocate — real console auth: operator allowlist + audit trail
--  Idempotent. Replaces the v1 shared-password gate (see docs/console-auth-plan.md).
-- ============================================================================
--
--  ACCESS MODEL
--  ---------------------------------------------------------------------------
--  Operators authenticate with Supabase Auth (email+password or an OAuth/social
--  provider). Being an authenticated Supabase user is NOT sufficient to reach
--  the review console — the user's (verified) EMAIL must also appear in
--  `public.operators` with `active = true`. Authorization = authentication
--  (Supabase, verified email) + allowlist (here).
--
--  The allowlist is keyed by EMAIL so an admin can invite someone before they
--  have ever signed in. On that person's first authenticated login, the matching
--  row is linked to their auth user id (`user_id` / `linked_at`).
--
--  Both tables are RLS default-deny: only the server (service role) reads/writes
--  them, exactly like the rest of the schema. No anon/authenticated policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  operators — who may enter the review console, and at what role.
--  `email` is the allowlist key (store lower-cased). `user_id` is filled in on
--  first login; null means "invited, not yet signed in".
-- ---------------------------------------------------------------------------
create table if not exists public.operators (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  user_id     uuid references auth.users (id) on delete set null,
  role        text not null default 'reviewer'
                check (role in ('reviewer', 'admin')),
  active      boolean not null default true,
  invited_by  text,                       -- operator email who added this row
  created_at  timestamptz not null default now(),
  linked_at   timestamptz                 -- when user_id was first linked
);

create index if not exists operators_user_id_idx on public.operators (user_id);
create index if not exists operators_active_idx   on public.operators (active);

-- ---------------------------------------------------------------------------
--  review_audit — attributable log of console actions (who published what).
--  Also the timestamped proof for the CROA/TSR advance-fee rule: a paid review
--  may only be charged AT or AFTER the reviewed verdict is delivered, and the
--  publish row here is when delivery happened.
-- ---------------------------------------------------------------------------
create table if not exists public.review_audit (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references public.deals (id) on delete cascade,
  operator_id     uuid references public.operators (id) on delete set null,
  operator_email  text,
  action          text not null,          -- e.g. 'publish_review'
  verdict         text,
  created_at      timestamptz not null default now()
);

create index if not exists review_audit_deal_id_idx  on public.review_audit (deal_id);
create index if not exists review_audit_operator_idx on public.review_audit (operator_id);

-- ---------------------------------------------------------------------------
--  RLS: enable + force, default-deny. Server (service role) only.
-- ---------------------------------------------------------------------------
alter table public.operators    enable row level security;
alter table public.review_audit enable row level security;
alter table public.operators    force  row level security;
alter table public.review_audit force  row level security;

-- NO policies for anon/authenticated: both roles are denied all direct access.
-- The service role bypasses RLS and is used only on the server.

-- ---------------------------------------------------------------------------
--  Seed the first admin operator (run once). Because the allowlist is keyed by
--  email, this works BEFORE the person has ever signed in — they just need to
--  log in later with this email (password or Google/Apple) to be linked:
--
--    insert into public.operators (email, role)
--    values (lower('you@example.com'), 'admin')
--    on conflict (email) do update set role = 'admin', active = true;
-- ---------------------------------------------------------------------------
