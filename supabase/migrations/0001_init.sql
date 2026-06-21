-- ============================================================================
--  Driveway Advocate — initial schema
--  Idempotent: safe to run multiple times (IF NOT EXISTS / guarded policies).
-- ============================================================================
--
--  ACCESS MODEL (v1, no user accounts yet)
--  ---------------------------------------------------------------------------
--  Row Level Security is ENABLED on every table, and NO permissive policies are
--  granted to the `anon` or `authenticated` roles. That means the public anon
--  key (used in the browser) can read/write NOTHING directly — it can never see
--  another buyer's deal, which is the hard requirement.
--
--  All reads and writes are mediated SERVER-SIDE:
--    - Buyer submissions are inserted by a server route using the SERVICE ROLE
--      key (which bypasses RLS).
--    - A buyer views their own verdict through an unguessable deal UUID
--      (a capability URL), resolved on the server — not via direct anon reads.
--    - The private review console uses the service role key, server-side only.
--
--  When real user auth is added later, layer owner-scoped policies on top of
--  this (e.g. `lead_id = auth.uid()`), without weakening the default-deny base.
-- ============================================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
--  leads — the person. A deal belongs to a lead. Kept minimal + extensible so
--  it can later connect to a broader customer profile in the larger platform.
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  deals — the submitted offer plus auto and (later) human-reviewed verdicts.
-- ---------------------------------------------------------------------------
create table if not exists public.deals (
  id                      uuid primary key default gen_random_uuid(),
  lead_id                 uuid references public.leads (id) on delete set null,

  -- Vehicle
  vehicle_year            integer,
  vehicle_make            text,
  vehicle_model           text,
  vehicle_trim            text,
  vehicle_mileage         integer,
  vehicle_vin             text,

  -- Deal numbers
  vehicle_price           numeric,
  fees                    jsonb,            -- [{ "label": "...", "amount": 0 }]
  down_payment            numeric,
  apr                     numeric,
  term_months             integer,
  monthly_payment         numeric,
  credit_band             text,

  -- Warranty / VSC offer (optional)
  warranty_provider       text,
  warranty_coverage_tier  text,
  warranty_term_months    integer,
  warranty_term_miles     integer,
  warranty_price          numeric,

  -- Upload path
  uploaded_file_path      text,
  input_path              text not null default 'manual'
                            check (input_path in ('manual', 'upload')),

  -- Auto verdict (full fairness-engine result kept as jsonb for forward-compat)
  auto_verdict            text check (auto_verdict in ('green', 'amber', 'red')),
  auto_result             jsonb,

  -- Human-reviewed verdict (null until an operator publishes one)
  reviewed_verdict        text check (reviewed_verdict in ('green', 'amber', 'red')),
  reviewed_headline       text,
  reviewed_flags          jsonb,
  reviewed_at             timestamptz,

  status                  text not null default 'new'
                            check (status in ('new', 'review_requested',
                                              'in_review', 'reviewed', 'archived')),

  created_at              timestamptz not null default now()
);

create index if not exists deals_lead_id_idx     on public.deals (lead_id);
create index if not exists deals_status_idx      on public.deals (status);
create index if not exists deals_created_at_idx  on public.deals (created_at desc);

-- ---------------------------------------------------------------------------
--  findings — normalized red flags / findings for a deal. Mirrors the flags in
--  auto_result/reviewed_flags so the console can query and filter them. Named
--  `findings` (extensible) rather than only `red_flags`; `red_flags` view alias
--  provided below for the spec's naming.
-- ---------------------------------------------------------------------------
create table if not exists public.findings (
  id           uuid primary key default gen_random_uuid(),
  deal_id      uuid not null references public.deals (id) on delete cascade,
  type         text not null,
  severity     text not null
                 check (severity in ('info', 'low', 'medium', 'high')),
  title        text not null default '',
  explanation  text not null default '',
  source       text not null default 'auto'
                 check (source in ('auto', 'reviewed')),
  created_at   timestamptz not null default now()
);

create index if not exists findings_deal_id_idx on public.findings (deal_id);

-- Convenience alias matching the spec's "red_flags" name.
create or replace view public.red_flags as
  select * from public.findings;

-- ---------------------------------------------------------------------------
--  Row Level Security: enable everywhere, default-deny (no anon/auth policies).
-- ---------------------------------------------------------------------------
alter table public.leads     enable row level security;
alter table public.deals     enable row level security;
alter table public.findings  enable row level security;

-- Force RLS even for the table owner role, so nothing leaks accidentally.
alter table public.leads     force row level security;
alter table public.deals     force row level security;
alter table public.findings  force row level security;

-- NOTE: We intentionally create NO policies for `anon` or `authenticated`.
-- With RLS enabled and no permissive policies, those roles are denied all
-- access. The service role bypasses RLS and is used only on the server.

-- ---------------------------------------------------------------------------
--  Storage bucket for uploaded quotes (photos / PDFs). Private — accessed only
--  via the service role on the server. No public/anon storage policies.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('deal-uploads', 'deal-uploads', false)
on conflict (id) do nothing;
