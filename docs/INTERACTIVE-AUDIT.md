# Interactive-Element Audit — Driveway Advocate

_Whole-app sweep of navigation, buttons/CTAs, forms, multi-step flows, auth,
empty/loading/error states, mobile nav, and accessibility. Conducted across all
27 page routes and 51 components._

## Summary

The app is in **good interactive health**. Navigation, buttons, mobile menus,
console auth, and most loading/error states are correctly wired — no dead
`href="#"`, no empty `onClick`, no placeholder handlers in user paths. The issues
found were a small, specific set, now **fixed**, plus a few items that depend on
**buyer accounts** (an explicitly deferred feature) and are flagged for a product
decision rather than silently "fixed."

| Area | Result |
|------|--------|
| Internal navigation (Link/router/redirect/`<a>`) | ✅ No true 404s; one redirect-hop tidied |
| Buttons / CTAs / tabs / modals / dropdowns | ✅ All functional; no dead/placeholder handlers |
| Mobile nav, dashboard drawer, sticky CTA | ✅ Open/close/auto-close + scroll-lock all wired |
| Forms (validation, loading, error, success) | ✅ Present across check, market-check, intake, login, operators |
| Console auth + operator management | ✅ Server-side gate + allowlist correct |
| Empty/loading/error states | ⚠️ One bare-text verdict fallback (fixed) |
| Data hand-off between steps | ⚠️ Deal Review missing a CTA (fixed); cross-device sessionStorage by-design |

## Fixed in this pass

1. **Verdict page crash on Quote-Review deals** — `/verdict/[id]` cast every
   `auto_result` to a fairness result and rendered `VerdictView`; a Quote-Review
   deal (branded `deal-review-1`) would crash. Now redirects those deals to
   `/deal-review/[id]`. (`src/app/verdict/[id]/page.tsx`)
2. **Bare-text "no verdict" fallback** — replaced the unstyled `<p>` with a
   proper card offering "Check a deal" and "Get human review" so the buyer is
   never stranded. (`src/app/verdict/[id]/page.tsx`)
3. **Deal Review page missing the human-review CTA** — `/deal-review/[dealId]`
   showed the analysis but, unlike the verdict page, offered no way to request a
   human review. Added `RequestReviewButton` (the deal is persisted there).
   (`src/app/deal-review/[dealId]/page.tsx`)
4. **`/deal-rescue` redirect hop** — two links pointed at `/deal-rescue` (a route
   that only redirects to `/post-sale-triage`); repointed directly.
   (`src/app/verdict/[id]/page.tsx`, `src/components/products/FocusedResult.tsx`)
5. **Centralized the `deal-review-1` schema check** — three places duplicated/
   inlined this guard; extracted to `src/lib/deal-engine/is-deal-review.ts`
   (`isDealReviewResult`), now used by the verdict, console, and deal-review
   pages. Unit-tested.

Validation after fixes: `next lint` clean, `tsc --noEmit` clean, **411 tests
pass** (39 files), `next build` compiles.

## Needs a product decision (not "fixed" — would require deferred features)

1. **Dashboard renders sample data only.** `/dashboard` shows
   `SAMPLE_MARKET_RESPONSE`, not the signed-in buyer's real deals — it is the
   most likely "page exists but isn't populating" symptom. Wiring real data
   requires **buyer accounts**, which the project explicitly defers (see
   README "Deferred"). Decision needed: (a) keep it an honest sample/preview, or
   (b) green-light buyer auth + per-user data (a feature, not a fix).
2. **Dashboard has no auth boundary.** Consistent with (1): it's effectively a
   public preview today. If it should be private, it needs the buyer-auth flow
   from (1). Currently ambiguous by design.
3. **Dashboard "Soon" sidebar items** route to a real "coming soon" placeholder
   (`/dashboard/[...rest]`) — intentional, but clicking them is a soft dead-end
   with a redundant "Soon" signal. Optional polish: disable them or enrich the
   placeholder with an "early access" intake.

## By-design (verified, no change needed)

- **Cross-device Deal Review via sessionStorage** — when Supabase is
  unconfigured, a Quote Review result lives only on the submitting device; the
  client fallback says so explicitly. Fixing cross-device access needs buyer
  accounts. In production (DB configured) results persist and load server-side.
- **Focused checks / market-check show inline/transient results** — quick-check
  tools by design; no per-result shareable URL.
- **Intake forms degrade gracefully** when the DB is unconfigured
  (`{ ok: true, stored: false }`). In production the DB is configured, so intakes
  persist. (Optional future polish: surface a request ID / demo-mode notice.)

## Still worth manual review

- The dashboard data/auth decision above (the one true "needs you" item).
- Live OAuth round-trip for the console (covered separately; Google verified
  working in production).
