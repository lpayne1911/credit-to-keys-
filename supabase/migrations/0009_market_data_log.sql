-- ============================================================================
--  0009 — deal_market_data: de-identified market-intelligence log
--  Idempotent (IF NOT EXISTS). Default-deny RLS, server-only writes.
-- ============================================================================
--
--  PURPOSE
--  ---------------------------------------------------------------------------
--  An append-only, analytics-grade record of every deal we review: the vehicle,
--  the full pricing/fee/add-on/finance breakdown, the trade-in, and the dealer
--  ("seller") details. This is the compiled dataset for internal analysis and
--  potential future data products.
--
--  WHAT IS DELIBERATELY EXCLUDED (buyer PII)
--  ---------------------------------------------------------------------------
--  No buyer name, date of birth, driver's license, insurance, email, phone, or
--  home address — none of which the app collects in the first place. There is
--  also NO user_id / lead_id here, so a row cannot be linked back to an account.
--  This separation is what lets the intake screen honestly tell buyers we don't
--  store their personal identifying information.
--
--  RE-IDENTIFICATION NOTES (read before selling/sharing externally)
--  ---------------------------------------------------------------------------
--    - vehicle_vin uniquely identifies a vehicle and can be tied to an owner via
--      third-party records. It is kept because it is core vehicle data, but any
--      external/sold export should consider dropping or hashing it.
--    - salesperson is an individual dealer employee's name (not the buyer). Kept
--      as requested "seller information," but treat it as personal data of that
--      employee in any external release (drop or pseudonymize before sale).
--  Selling consumer-derived data also carries disclosure/opt-out obligations
--  (e.g. CCPA/CPRA "sale" rules) that must be handled in the privacy policy —
--  this table is the storage layer only, not the compliance layer.
--
--  RLS: enabled + forced, with NO anon/authenticated policies. The anon key can
--  touch nothing; rows are inserted only server-side via the service role.
-- ============================================================================

create table if not exists public.deal_market_data (
  id                    uuid primary key default gen_random_uuid(),
  captured_at           timestamptz not null default now(),

  -- How the deal arrived + the engine that scored it (provenance, not identity).
  input_path            text not null default 'manual'
                          check (input_path in ('manual', 'upload')),
  engine_version        text,

  -- Vehicle
  vehicle_year          integer,
  vehicle_make          text,
  vehicle_model         text,
  vehicle_trim          text,
  vehicle_condition     text,
  vehicle_color         text,
  vehicle_mileage       integer,
  vehicle_vin           text,

  -- Pricing
  vehicle_price         numeric,
  msrp                  numeric,
  dealer_discount       numeric,
  rebates               numeric,
  out_the_door          numeric,
  down_payment          numeric,
  total_vehicle_price   numeric,   -- dealer-stated total
  balance_due           numeric,   -- dealer-stated balance due on delivery

  -- Fees & add-ons (classified line items)
  fees                  jsonb,     -- [{ "label", "amount", "category" }]
  add_ons               jsonb,     -- [{ "label", "amount", "financed", "category" }]
  total_fees            numeric,
  total_add_ons         numeric,

  -- Finance
  apr                   numeric,
  term_months           integer,
  monthly_payment       numeric,
  amount_financed       numeric,
  credit_band           text,

  -- Trade-in (vehicle identity + dollars; no owner identity)
  trade_year            integer,
  trade_make            text,
  trade_model           text,
  trade_mileage         integer,
  trade_offer           numeric,
  trade_payoff          numeric,

  -- Dealer / seller
  dealer_name           text,
  dealer_address        text,
  dealer_phone          text,
  dealer_zip            text,
  dealer_state          text,
  salesperson           text,
  stock_number          text,

  -- Computed outcome
  deal_score            integer,
  market_low            numeric,
  market_high           numeric
);

create index if not exists deal_market_data_captured_at_idx
  on public.deal_market_data (captured_at desc);
create index if not exists deal_market_data_vehicle_idx
  on public.deal_market_data (vehicle_make, vehicle_model, vehicle_year);
create index if not exists deal_market_data_dealer_state_idx
  on public.deal_market_data (dealer_state);

-- Default-deny RLS, consistent with every other table here. No anon/auth
-- policies are created, so only the server-side service role can read or write.
alter table public.deal_market_data enable row level security;
alter table public.deal_market_data force row level security;
