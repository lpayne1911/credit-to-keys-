# Driveway Advocate — Product Architecture

> Companion to `ROADMAP.md` (how we build) and `GO-TO-MARKET.md` (how we get
> bought). **This doc defines the customer-facing architecture: the journey, the
> engagement→entitlement→workspace model, and the dashboard-as-home-base.**
>
> **READ THIS FIRST, AND DO NOT DRIFT:** Driveway Advocate is **not** a SaaS
> subscription product. There are **no Bronze/Silver/Gold tiers**, and access is
> **never** unlocked by capturing a payment. Access follows the **service the
> customer is engaged in**; money is captured **after delivery**. Any design that
> gates a workspace behind a prepaid subscription tier is wrong by definition.

## 0. The mental model

```
Homepage (3 doors)
      ↓
Free Red-Flag Scan        ← lead generator, no payment, no account required
      ↓
Soft paywall ("want to know WHY?")  ← where paid SERVICES begin
      ↓
Account Creation          ← AFTER the scan, to save the deal (friction kills conversion)
      ↓
Customer Home (Dashboard) ← the HOUSE / home base
      ↓
Service Workspaces        ← the ROOMS, unlocked by active engagements
      ↓
Delivered Outcomes        ← reports, scripts, advocate work; payment captured on delivery
```

**The dashboard is a customer workspace, not the product.** The products are the
services (Deal Check, Deal Rescue, Credit-to-Keys, Buyer Advocate). The dashboard
is where a customer moves through whatever services they're engaged in. What a
customer sees is driven by **customer state (their engagements)**, never by a
subscription level.

---

## 1. Current state vs target state

### Current state (as built — migrations 0001–0007)
- **Free scan works** anonymously: `/check` (`GamifiedDealCheck`) → `POST /api/deals` → `/verdict/[id]`. Quote Review: `/quote-review/intake` → `/api/deals` → `/deal-review/[id]`.
- **Buyer accounts exist** (`lib/buyer-auth.ts` `getBuyer()`), but account creation currently happens *before* value, and the dashboard (`/dashboard`) shows a **flat list of all the buyer's deals** — not workspace-driven.
- **Deals own a `user_id`** (owner-scoped SELECT RLS); anonymous deals are `user_id = null`, capability-URL only.
- **Non-automated services** (`human-review`, `deal-rescue`, `build-my-plan`, `concierge`) submit to `POST /api/intake` → `product_intakes` (write-once, `status = review_requested`). Quote Review and Deal Check write to `deals`.
- **Operator console** is live and **already separate** (`/console`, `/console/[id]`, `/console/operators`): Supabase Auth + `operators` allowlist + roles + `review_audit`.
- **No payments.** No unified "engagement" concept. No entitlements layer. No service workspaces. Homepage already self-segments into 4 funnel lanes (green/blue/gold/red).

### Target state
- Homepage asks **one question** ("where are you in your journey?") with **3 doors**.
- Free scan → **soft paywall** → **post-scan account creation** that claims the just-run deal.
- A single **`engagements`** spine unifies every service a customer is in.
- A pure **entitlements** function derives capability flags from engagements (never from tiers).
- One **customer dashboard** that **composes workspaces** from the customer's active engagements (Free, Deal Check, Deal Rescue, Credit-to-Keys, Buyer Advocate).
- Operator dashboard stays a **fully separate** internal surface.
- Payments (later) are **authorize-on-request / capture-on-delivery**, wired to delivery events — never capture-to-unlock.

---

## 2. Homepage 3-door journey

The homepage forces one question: **"Where are you in your car-buying journey?"**
(This consolidates today's 4 funnel cards into 3 intent doors; the existing
funnel routes are reused as destinations.)

| Door | Buyer state | Primary CTAs | Routes (existing) |
|---|---|---|---|
| **A — "I have a deal in front of me"** (panic) | Has a quote/worksheet, about to sign | Scan My Deal · Upload Buyer's Order · Get My Verdict | `/check`, `/quote-review/intake` |
| **B — "I'm shopping for a vehicle"** | No car yet; wants a pro from the start | Start Credit-to-Keys · Get Pre-Qualified · Build My Purchase Plan | `/credit-to-keys`, `/build-my-plan` |
| **C — "I already bought, something's wrong"** | Already signed | Deal Rescue · Contract Review · Dealer Complaint Help | `/post-sale-triage` |

Door A is the panic-moment hook and feeds the free scan. Door B routes to the
flagship recurring engine (Credit-to-Keys). Door C routes to post-sale triage.

---

## 3. Free scan → post-scan account creation flow

1. **Free Red-Flag Scan** (Door A) — no payment, **no account required**. Buyer
   uploads a buyer's order or enters numbers; receives a **verdict**:
   **Great Deal · Fair Deal · Questionable · Bad Deal · Run Away.**
   (Maps onto the engine's green/amber/red + the human-only `black` = walk away.)
2. **Soft paywall** below the verdict — *this is where paid services begin*:
   - "Want to know **why**?" → full fee-by-fee report (Deal Check)
   - "Want us to review **every fee**?" → Junk Fee Audit
   - "Want a **negotiation strategy**?" → scripts
   - "Want an **advocate**?" → Deal Rescue / Buyer Advocate
3. **Account creation happens HERE — after the scan, not before.** Prompt:
   *"Create your free account to save your deal."* On signup, the anonymous deal
   just produced is **claimed** (its `user_id` is set to the new account). Friction
   before value kills conversion; value first, then capture the lead.
4. Account → lands on the **Customer Home** (dashboard).

**Rule:** the free scan must never require an account or payment. The account is
a *save* action; paid services are *engagements*, not unlocks.

---

## 4. Engagements data model

**Engagements are the source of truth.** One row per service a customer is in.
Existing artifacts (`deals`, `product_intakes`, `market_snapshots`) are the
*work products* an engagement points at; the engagement carries lifecycle state.

Proposed table (migration `0008`, additive — see §9):

```
engagements
  id            uuid pk
  user_id       uuid  -> auth.users (the customer)        [nullable until claimed]
  type          text  -- 'deal_check' | 'quote_review' | 'deal_rescue'
                      --  | 'credit_to_keys' | 'buyer_advocate' | 'concierge'
  status        text  -- 'scanned' | 'requested' | 'in_progress' | 'in_review'
                      --  | 'delivered' | 'active' | 'closed'
  stage         text  -- Credit-to-Keys only: 'prepare'|'qualify'|'shop'
                      --  |'negotiate'|'purchase'|'delivery'|'ownership' (else null)
  deal_id       uuid  -> deals (nullable)            -- deal_check / quote_review
  intake_id     uuid  -> product_intakes (nullable)  -- rescue / build / concierge
  created_at    timestamptz
  updated_at    timestamptz
```

- A free scan that's been claimed = an `engagement` of type `deal_check`,
  status `scanned`, pointing at the `deals` row.
- Requesting a paid service moves/creates an engagement to `requested` →
  `in_progress`/`in_review` → `delivered` (the report/outcome is ready; this is
  also the payment **capture** event when payments land).
- Credit-to-Keys uses `stage` to drive its 7-stage workspace.
- RLS: default-deny, owner-scoped SELECT (`user_id = auth.uid()`), consistent
  with `deals`. All writes server-mediated via service role.

> The engagement spine is what makes "different dashboards per customer state"
> work without tiers: the dashboard renders the workspace(s) for the customer's
> active engagements.

---

## 5. Entitlements model

Entitlements are **derived, never stored as tiers.** A pure, unit-testable
function maps a customer's engagements → capability flags:

```
entitlementsFor(engagements: Engagement[]): {
  can_scan:                 boolean  // always true (free)
  can_save_deals:           boolean  // has an account
  can_view_reports:         boolean  // has a delivered deal_check/quote_review
  can_message_advocate:     boolean  // active deal_rescue/buyer_advocate/credit_to_keys
  can_access_credit_to_keys boolean  // has a credit_to_keys engagement
  can_upload_documents:     boolean  // active engagement that needs docs
  can_download_reports:     boolean  // has a delivered report
}
```

Granted by: **purchased services, active engagements, customer state.**
**Never** by `Bronze | Silver | Gold`. There is no subscription level in the
data model, the UI, or the code. If a future change introduces a `plan`/`tier`
column on the customer, it is wrong — re-read §0.

The flags are the gate the dashboard and routes check (e.g. a workspace renders
iff its entitlement is true). This keeps "what's available is based on their
level" true — where "level" = which services they're engaged in.

---

## 6. Customer dashboard composition model

There is **one** customer dashboard at `/dashboard` — the **home base**. It does
**not** switch by tier. It **composes** from the customer's engagements:

```
DashboardHome(buyer):
  engagements   = listEngagementsForUser(buyer.id)
  entitlements  = entitlementsFor(engagements)
  render:
    - Header: who you are + saved deals/scan history (always)
    - For each ACTIVE engagement, render its WORKSPACE block (see §7)
    - If no paid engagements: Free workspace (saved deals, locked features, upgrade CTAs)
    - Locked features show an "engage this service" CTA (NOT "upgrade to Gold")
```

Same URL, different rooms. A customer with a Deal Check in review **and** a
Credit-to-Keys engagement sees both workspaces stacked. A brand-new free customer
sees the Free workspace.

---

## 7. Workspace definitions

Each workspace is gated by an entitlement / active engagement. Reuse existing
data: `deals` (verdict, findings, reviewed_*), `product_intakes` (intake
payloads), `review_audit` (delivery proof), `market_snapshots`.

### 7.1 Free Customer workspace
- Saved deals · scan history · verdict history
- Locked features shown with **"engage this service"** CTAs (not tier upsell)
- Upgrade options = links to start a paid service (Deal Check, Deal Rescue, …)

### 7.2 Deal Check Customer workspace
- Deal status (maps to `deals.status`: new → review_requested → in_review → reviewed)
- Analyst notes · review progress
- **Delivered report** (the full fee-by-fee report; `reviewed_*` / `auto_result`)
- Negotiation scripts

### 7.3 Deal Rescue Customer workspace
- Timeline · documents uploaded · assigned advocate
- Tasks · messages · next actions
- (Backed by a `deal_rescue` engagement + its `product_intakes` row + docs)

### 7.4 Credit-to-Keys Customer workspace (the guided OS)
A **distinct** workspace — a 7-stage operating system driven by `engagement.stage`:
1. Prepare → 2. Qualify → 3. Shop → 4. Negotiate → 5. Purchase → 6. Delivery → 7. Ownership

(Supersedes the current 3-stage marketing description on `/credit-to-keys`.)
This is the recurring engine; billed monthly **in arrears** (see §11).

### 7.5 Buyer Advocate workspace (case-management portal)
- Case status · advocate assigned · notes · deadlines
- Document center · communication center

---

## 8. Operator dashboard separation

The operator dashboard is a **completely separate, internal-only** surface — it
is **not** a customer workspace and shares no entitlement logic with buyers.

- Lives under `/console/*`; gated by `getConsoleOperator()` (Supabase Auth +
  `operators` allowlist + `active` + role).
- Shows: deal queue, case assignments, SLA timers, customer management, analytics,
  revenue metrics, publish/delivery actions (the `review_audit` delivery event).
- Buyer auth (`getBuyer`) and operator auth (`getConsoleOperator`) are distinct;
  being a buyer never grants operator access and vice-versa.

**Invariant:** customer workspaces and the operator console never merge. They are
two different applications sharing one database.

---

## 9. Database / schema recommendations

Current schema is migrations `0001`–`0007` (leads, deals, findings,
product_intakes, market_snapshots, operators, review_audit). All RLS default-deny,
forced; service-role mediated; owner-scoped SELECT on `deals`.

Additive changes for this architecture (no destructive edits):
- **`0008_engagements.sql`** — create `engagements` (§4) with owner-scoped SELECT
  RLS + indexes on `user_id`, `type`, `status`. Backfill: each claimed `deal`
  with a `user_id` gets a `deal_check`/`quote_review` engagement row.
- **Reuse, don't replace:** `deals.status` already models the deal-check lifecycle;
  `product_intakes` already captures rescue/build/concierge requests;
  `review_audit` already records the delivery event (capture seam). Engagements
  *reference* these, not duplicate them.
- **Later (payments phase):** a `payments`/`charges` table keyed to an engagement,
  recording authorize + capture timestamps tied to delivery. **No `plan`/`tier`
  column anywhere.**
- Keep generating types; extend `DealRow`-style types with an `EngagementRow`.

---

## 10. Phased build plan

Each phase is independently shippable, verified with
`lint && typecheck && test && build`, and never violates §11.

- **Phase A — Foundation (next, separate approval):** `engagements` table +
  backfill; pure `entitlements` module (unit-tested); rework `/dashboard` to
  compose Free + Deal Check workspaces from engagements/entitlements. No payments.
- **Phase B — Front of funnel:** homepage 3-door; move account creation to
  *after* the scan (claim the anonymous deal); soft paywall under the verdict.
- **Phase C — Deeper workspaces:** Deal Rescue (timeline/docs/messages), then the
  Credit-to-Keys 7-stage OS, then Buyer Advocate case portal.
- **Phase D — Payments (legal review first):** Stripe authorize-on-request /
  capture-on-delivery, wired to the publish/delivery event; clear pre-purchase
  disclosures. Capture **only** at delivery.

---

## 11. Compliance guardrails (binding on every phase)

From `GO-TO-MARKET.md` §6 and `ROADMAP.md` §Guardrails — these constrain the
architecture itself:

1. **Strictly buyer-side.** No revenue from / steering toward dealers, lenders,
   F&I, or warranty sellers. Ever.
2. **Decision support, not advice.** Persistent disclaimer on every verdict/recommendation.
3. **NO ADVANCE FEE — access is never sold as a prepaid unlock.** Paid services
   are **authorize-on-request, capture-on-delivery** (Credit-to-Keys billed
   monthly **in arrears**). The workspace/entitlement for a paid service is
   granted when the customer **engages** it (intake/request) and its deliverable
   unlocks **on delivery**, which is also the only moment payment may be captured.
   **A workspace must never be gated behind a captured prepayment.** The free scan
   is always free and never behind an account or paywall.
4. **No false precision / no guarantees.** Every estimate is a range + confidence.

> Architectural test for any future PR: *"Does access depend on money captured
> before a service was delivered?"* If yes, it violates this spec — reject it.

---

## 12. Acceptance criteria for Phase A

Phase A is done when ALL of the following hold (implemented in a later,
separately approved step — not in the spec step):

1. **Schema:** `engagements` table exists (migration `0008`) with owner-scoped
   SELECT RLS and indexes; existing claimed deals are backfilled to a
   `deal_check`/`quote_review` engagement. `get_advisors` shows no new RLS gaps.
2. **Entitlements:** a pure `entitlementsFor(engagements)` function exists with
   unit tests covering: free (scan only), saved-deals, delivered-report,
   credit-to-keys access, advocate messaging — and a test asserting **no tier/plan
   input exists** in the signature.
3. **Dashboard composition:** `/dashboard` renders workspaces composed from the
   buyer's engagements — Free workspace for a no-paid-engagement customer; Deal
   Check workspace when a deal_check engagement exists. Locked features show
   "engage this service" CTAs, **not** tier upsell.
4. **No regressions:** existing free scan, verdict, deal-review, console, and
   operator flows still work; anonymous deals still reachable by capability URL.
5. **No subscription model introduced:** no `plan`/`tier`/`subscription_level`
   column, type, or UI anywhere; grep confirms.
6. **Quality gates:** `npm run lint && npm run typecheck && npm test && npm run build`
   all green; the buyer dashboard verified live (sign in → see composed workspace).
</content>
