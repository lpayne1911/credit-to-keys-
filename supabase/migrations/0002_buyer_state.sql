-- ============================================================================
--  Add buyer_state to deals
--  Idempotent. Stores the two-letter US state code where the buyer is
--  purchasing, for state-aware copy/disclaimers now and state fee caps later.
-- ============================================================================

alter table public.deals
  add column if not exists buyer_state text;

comment on column public.deals.buyer_state is
  'Two-letter US state code where the buyer is purchasing (state-aware copy + future fee caps).';
