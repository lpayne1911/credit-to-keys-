-- ============================================================================
--  product_intakes — non-automated product requests (human review, deal rescue)
--  Idempotent. Stores the focused-intake payload as jsonb and a review status.
--  RLS default-deny (no anon/auth policies); only the service role writes/reads,
--  server-side, exactly like leads/deals/findings.
-- ============================================================================

create table if not exists public.product_intakes (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null,
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'review_requested'
                check (status in ('review_requested', 'in_review', 'closed')),
  created_at  timestamptz not null default now()
);

create index if not exists product_intakes_status_idx
  on public.product_intakes (status);
create index if not exists product_intakes_created_at_idx
  on public.product_intakes (created_at desc);

alter table public.product_intakes enable row level security;
alter table public.product_intakes force row level security;
-- No permissive policies: anon/authenticated are denied; service role bypasses.
