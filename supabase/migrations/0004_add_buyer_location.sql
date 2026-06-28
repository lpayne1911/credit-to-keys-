-- ============================================================================
--  0002 — buyer location signal (internal analytics only)
--  Idempotent + additive: nullable columns, no RLS change.
-- ============================================================================
--
--  ZIP-derived location context captured on the Deal Check flow. These are an
--  INTERNAL signal for our own segmentation/analytics — never shown to the
--  buyer and never used in any buyer-facing advice or score.
--
--  `buyer_income_band` is a reserved seam (a future ZIP→ACS area-median band,
--  i.e. an area average, not the person's income). Added now as nullable so no
--  later migration is needed; it is not populated yet.
--
--  RLS is unchanged: the deals table keeps its default-deny base (no anon/auth
--  policies); these columns are written only server-side via the service role.
-- ============================================================================

alter table public.deals
  add column if not exists buyer_zip          text,
  add column if not exists buyer_state        text,
  add column if not exists buyer_income_band  text;
