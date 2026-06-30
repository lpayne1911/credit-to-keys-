-- ============================================================================
--  Intake ownership — let a signed-in (or post-signup) buyer's application
--  become a dashboard case.
--
--  product_intakes gains a nullable user_id (anonymous leads still allowed).
--  When set, the application's service line opens an engagement + a `submitted`
--  case, so it shows on the buyer's dashboard. One case per intake.
-- ============================================================================

alter table public.product_intakes
  add column if not exists user_id uuid references auth.users (id) on delete set null;

create index if not exists product_intakes_user_id_idx
  on public.product_intakes (user_id);

-- Idempotent claim/creation: at most one case per intake.
create unique index if not exists cases_intake_id_uniq
  on public.cases (intake_id) where intake_id is not null;
