-- ============================================================================
--  Driveway Advocate — buyer accounts: own your deals
--  Idempotent. Lets a signed-in buyer (Supabase Auth) see the deals they ran.
-- ============================================================================
--
--  Deals were anonymous (reachable only via an unguessable capability UUID).
--  This adds optional ownership: when a buyer is signed in at submit time, the
--  deal is stamped with their auth user id. Legacy/anonymous deals keep
--  user_id = null and remain capability-URL only.
--
--  RLS stays default-deny; we ADD one owner-scoped SELECT policy so a logged-in
--  buyer can read ONLY their own deals (per the note in 0001_init.sql). The
--  dashboard reads server-side via the service role; this policy is the safe
--  base for any future direct client reads.
-- ============================================================================

alter table public.deals
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists deals_user_id_idx on public.deals (user_id);

-- A signed-in buyer may select only the deals they own. No insert/update/delete
-- policies: writes stay server-mediated via the service role.
drop policy if exists deals_owner_select on public.deals;
create policy deals_owner_select on public.deals
  for select
  to authenticated
  using (user_id = auth.uid());
