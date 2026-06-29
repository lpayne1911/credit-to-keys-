-- ============================================================================
--  Driveway Advocate — real console auth: operator allowlist + audit trail
--  Idempotent. Replaces the v1 shared-password gate (see docs/console-auth-plan.md).
-- ============================================================================
--
--  ACCESS MODEL
--  ---------------------------------------------------------------------------
--  Operators authenticate with Supabase Auth (email+password or an OAuth/social
--  provider). Being an authenticated Supabase user is NOT sufficient to reach
--  the review console — the user's id must also appear in `operators` with
--  `active = true`. Authorization = authentication (Supabase) + allowlist (here).
--
--  Both tables are RLS default-deny: only the server (service role) reads/writes
--  them, exactly like the rest of the schema. No anon/authenticated policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  operators — who may enter the review console, and at what role.
-- ---------------------------------------------------------------------------
create table if not exists public.operators (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  role        text not null default 'reviewer'
                check (role in ('reviewer', 'admin')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists operators_active_idx on public.operators (active);

-- ---------------------------------------------------------------------------
--  review_audit — attributable log of console actions (who published what).
--  Also the timestamped proof for the CROA/TSR advance-fee rule: a paid review
--  may only be charged AT or AFTER the reviewed verdict is delivered, and the
--  publish row here is when delivery happened.
-- ---------------------------------------------------------------------------
create table if not exists public.review_audit (
  id          uuid primary key default gen_random_uuid(),
  deal_id     uuid not null references public.deals (id) on delete cascade,
  operator    uuid references public.operators (user_id) on delete set null,
  operator_email text,
  action      text not null,            -- e.g. 'publish_review'
  verdict     text,
  created_at  timestamptz not null default now()
);

create index if not exists review_audit_deal_id_idx on public.review_audit (deal_id);
create index if not exists review_audit_operator_idx on public.review_audit (operator);

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
--  Seeding the first operator (run once, out of band, after the user exists in
--  auth.users — i.e. after they sign up / are invited via Supabase Auth):
--
--    insert into public.operators (user_id, email, role)
--    select id, email, 'admin' from auth.users where email = 'you@example.com'
--    on conflict (user_id) do update set role = 'admin', active = true;
-- ---------------------------------------------------------------------------
