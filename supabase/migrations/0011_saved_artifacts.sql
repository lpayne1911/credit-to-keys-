-- ============================================================================
--  saved_artifacts — server-persisted results for the forward flows that used
--  to live only on-device: Build My Plan (Target Deal Sheet) and Post-Sale
--  Triage. One row per generated result, addressed by its unguessable id (a
--  capability URL), optionally owned by a buyer so it shows on their dashboard.
--
--  RLS default-deny like deals/intakes — only the service role reads/writes,
--  server-side. The id is the access control for anonymous capability URLs.
-- ============================================================================

create table if not exists public.saved_artifacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  kind        text not null check (kind in ('plan', 'triage')),
  title       text,
  payload     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists saved_artifacts_user_id_idx
  on public.saved_artifacts (user_id, created_at desc);

alter table public.saved_artifacts enable row level security;
alter table public.saved_artifacts force row level security;
-- No permissive policies: anon/authenticated are denied; service role bypasses.
