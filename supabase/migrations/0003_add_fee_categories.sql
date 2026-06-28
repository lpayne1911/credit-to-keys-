-- ============================================================================
--  0003 — normalized fee categories
--  Idempotent + additive: one nullable jsonb column, no RLS change.
-- ============================================================================
--
--  Stores the state-aware fee classification computed at submission time, e.g.
--    [{ "label": "Documentation fee", "amount": 699, "category": "doc_fee" }]
--
--  This is a durable analytics record. The buyer-facing fee-risk guidance is
--  recomputed deterministically from `fees` + `buyer_state` at render time, so
--  this column is not required for display.
--
--  RLS is unchanged: the deals table keeps its default-deny base; this column is
--  written only server-side via the service role.
-- ============================================================================

alter table public.deals
  add column if not exists fee_categories jsonb;
