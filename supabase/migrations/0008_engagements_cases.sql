-- ============================================================================
--  Driveway Advocate — engagements + cases spine (Phase A)
--  Idempotent. See docs/PRODUCT-ARCHITECTURE.md §4–§5.
-- ============================================================================
--
--  ENGAGEMENTS = the service LINES a customer uses ("My Services").
--  CASES       = discrete units of WORK, each with the canonical status
--                taxonomy, SLA/ownership fields, and (later) a deliverable.
--
--  ADDITIVE + NON-DESTRUCTIVE: cases MIRROR deals.status (legacy DealStatus is
--  untouched and still drives the operator console). Cases reference the deal/
--  intake; they do not replace it. Backfill below creates an engagement + case
--  for every owned deal (user_id not null). Intake-based cases come later (once
--  product_intakes carries a user_id).
--
--  RLS: enabled + forced, default-deny. One owner-scoped SELECT policy per table
--  (a buyer reads only their own rows), matching deals_owner_select. All writes
--  are server-mediated via the service role.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  engagements — one row per (customer, service line).
-- ---------------------------------------------------------------------------
create table if not exists public.engagements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users (id) on delete set null,
  service     text not null
                check (service in ('deal_check', 'quote_review', 'deal_rescue',
                                   'buyer_advocate', 'credit_to_keys', 'concierge')),
  status      text not null default 'active' check (status in ('active', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, service)
);

create index if not exists engagements_user_id_idx on public.engagements (user_id);

-- ---------------------------------------------------------------------------
--  cases — the operational unit of work. Canonical status taxonomy (§5).
-- ---------------------------------------------------------------------------
create table if not exists public.cases (
  id                   uuid primary key default gen_random_uuid(),
  engagement_id        uuid references public.engagements (id) on delete cascade,
  user_id              uuid references auth.users (id) on delete set null,  -- denormalized for RLS
  type                 text not null,   -- mirrors engagements.service
  status               text not null default 'scanned'
                         check (status in ('scanned', 'submitted', 'review_requested',
                                           'in_review', 'needs_customer_info',
                                           'ready_for_delivery', 'delivered',
                                           'payment_pending', 'active', 'closed', 'cancelled')),
  stage                text,            -- Credit-to-Keys 7-stage OS (else null)
  priority             integer not null default 0,
  assigned_operator_id uuid references public.operators (id) on delete set null,
  due_at               timestamptz,
  sla_status           text check (sla_status in ('on_track', 'at_risk', 'breached')),
  escalation_reason    text,
  intake_completeness  numeric,
  deal_id              uuid references public.deals (id) on delete cascade,
  intake_id            uuid references public.product_intakes (id) on delete cascade,
  title                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists cases_user_id_idx       on public.cases (user_id);
create index if not exists cases_engagement_id_idx on public.cases (engagement_id);
create index if not exists cases_status_idx        on public.cases (status);
-- One case per deal (Phase A); lets the backfill + ensureCaseForDeal stay idempotent.
create unique index if not exists cases_deal_id_uniq on public.cases (deal_id) where deal_id is not null;

-- ---------------------------------------------------------------------------
--  RLS: enable + force; owner-scoped SELECT only. No anon/authenticated
--  insert/update/delete — writes go through the service role.
-- ---------------------------------------------------------------------------
alter table public.engagements enable row level security;
alter table public.cases       enable row level security;
alter table public.engagements force  row level security;
alter table public.cases       force  row level security;

drop policy if exists engagements_owner_select on public.engagements;
create policy engagements_owner_select on public.engagements
  for select to authenticated using (user_id = auth.uid());

drop policy if exists cases_owner_select on public.cases;
create policy cases_owner_select on public.cases
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
--  Backfill (idempotent): owned deals -> engagement + case.
--  Service is quote_review when the stored result is a Deal Review (branded
--  schemaVersion 'deal-review-1'); otherwise deal_check.
-- ---------------------------------------------------------------------------
insert into public.engagements (user_id, service)
select distinct
  d.user_id,
  case when d.auto_result->>'schemaVersion' = 'deal-review-1' then 'quote_review' else 'deal_check' end
from public.deals d
where d.user_id is not null
on conflict (user_id, service) do nothing;

insert into public.cases (engagement_id, user_id, type, status, deal_id, title)
select
  e.id,
  d.user_id,
  case when d.auto_result->>'schemaVersion' = 'deal-review-1' then 'quote_review' else 'deal_check' end,
  case d.status
    when 'new'              then 'scanned'
    when 'review_requested' then 'review_requested'
    when 'in_review'        then 'in_review'
    when 'reviewed'         then 'delivered'
    when 'archived'         then 'closed'
    else 'scanned'
  end,
  d.id,
  coalesce(
    nullif(trim(concat_ws(' ', d.vehicle_year, d.vehicle_make, d.vehicle_model)), ''),
    'Your deal'
  )
from public.deals d
join public.engagements e
  on e.user_id = d.user_id
 and e.service = (case when d.auto_result->>'schemaVersion' = 'deal-review-1' then 'quote_review' else 'deal_check' end)
where d.user_id is not null
  and not exists (select 1 from public.cases c where c.deal_id = d.id);
