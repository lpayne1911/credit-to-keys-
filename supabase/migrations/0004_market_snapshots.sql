-- ============================================================================
--  market_snapshots — saved MarketCheck reports, shared via capability URL
--  Idempotent. Stores the full normalized MarketCheckResponse as jsonb so a
--  saved report renders identically later. Reached only through an unguessable
--  UUID (/r/<id>), exactly like the deals capability-URL pattern.
--  RLS default-deny (no anon/auth policies); only the service role reads/writes,
--  server-side, like leads/deals/findings/product_intakes.
-- ============================================================================

create table if not exists public.market_snapshots (
  id          uuid primary key default gen_random_uuid(),
  response    jsonb not null,
  is_mock     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists market_snapshots_created_at_idx
  on public.market_snapshots (created_at desc);

alter table public.market_snapshots enable row level security;
alter table public.market_snapshots force row level security;
-- No permissive policies: anon/authenticated are denied; service role bypasses.
