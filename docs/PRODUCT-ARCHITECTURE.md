# Driveway Advocate — Product Architecture

> Companion to `ROADMAP.md` (how we build) and `GO-TO-MARKET.md` (how we get
> bought). **This is the architectural constitution for the customer-facing
> platform: the journey, the layered data model, and the dashboard-as-command-center.**
>
> **READ THIS FIRST, AND DO NOT DRIFT:**
> 1. Driveway Advocate is **not** a SaaS subscription product. There are **no
>    Bronze/Silver/Gold tiers**, and access is **never** unlocked by capturing a
>    payment. Access follows the **service the customer is engaged in**; money is
>    captured **after delivery**.
> 2. **Every case must produce a tangible deliverable.** A service that doesn't
>    end in a concrete artifact (a report, an action plan, a purchase plan, case
>    deliverables) is not a service — it's a feature subscription, which we don't
>    sell. If you can't name the deliverable, it's not a case.

## 0. The mental model

```
Customer
   ↓
Engagements      ← the service LINES a customer uses ("My Services")
   ↓
Cases            ← discrete units of WORK, each with a lifecycle + a deliverable ("My Cases")
   ↓
Entitlements     ← capability flags DERIVED from engagements + cases (never tiers)
   ↓
Customer Home    ← the command center: "what do I need to do next?"
   ↓
Workspaces       ← per-case rooms (Overview + the universal primitives)
   ↓
Deliverables     ← the tangible output every case must produce
   ↓
Recommendations  ← signal-driven cross-sell to the next service
   ↓
Long-Term Ownership ← the post-purchase retention engine (keeps customers for years)
```

**The dashboard is a customer workspace, not the product.** The products are the
services. The dashboard is the **command center** where a customer moves their
**cases** forward. What a customer sees is driven by **customer state (their
engagements + cases)**, never by a subscription level.

### The four layers, defined
- **Engagement** — the customer's relationship with a **service line** (Deal
  Check, Deal Rescue, Buyer Advocate, Credit-to-Keys). Answers *"what services
  does this customer use?"* This is the commercial/billing anchor. Surfaced as
  **My Services**.
- **Case** — a **discrete unit of work** under an engagement, with its own
  lifecycle, the universal primitives (messages/docs/tasks/timeline), and a
  **mandatory deliverable**. A Deal Check is one case; a Deal Rescue is one case;
  Credit-to-Keys is one long-running, stage-driven case. **A customer has many
  cases.** Surfaced as **My Cases**. *All case logic lives here — never pushed up
  into engagements.*
- **Entitlement** — a derived capability flag (see §6). Computed from the
  customer's engagements + cases. Never stored as a tier.
- **Workspace** — the per-case UI room (see §8): an Overview plus the universal
  primitives, gated by entitlement.

> Why Cases are their own layer: customers will have multiple, concurrent,
> repeat units of work (Deal Check #1, Deal Check #2, a Deal Rescue). Modeling the
> unit of work explicitly is what lets this scale to millions of customers without
> cramming case logic into the engagement/service layer.

---

## 1. Current state vs target state

### Current state (as built — migrations 0001–0007)
- **Free scan works** anonymously: `/check` (`GamifiedDealCheck`) → `POST /api/deals` → `/verdict/[id]`. Quote Review: `/quote-review/intake` → `/api/deals` → `/deal-review/[id]`.
- **Buyer accounts exist** (`lib/buyer-auth.ts` `getBuyer()`), but account creation happens *before* value, and `/dashboard` shows a **flat list of all the buyer's deals** — not case/workspace-driven.
- **Deals own a `user_id`** (owner-scoped SELECT RLS); anonymous deals are `user_id = null`, capability-URL only.
- **Non-automated services** (`human-review`, `deal-rescue`, `build-my-plan`, `concierge`) submit to `POST /api/intake` → `product_intakes` (write-once). Quote Review + Deal Check write to `deals`.
- **Operator console** is live and **already separate** (`/console/*`): Supabase Auth + `operators` allowlist + roles + `review_audit`.
- **No payments. No Cases layer. No universal primitives (messages/docs/tasks/timeline). No recommendations. No ownership engine. No document system.** Homepage self-segments into 4 funnel lanes.

### Target state
- Homepage asks **one question** with **3 doors** (§2).
- Free scan → soft paywall → **post-scan account creation that claims the deal** and opens a Deal Check **case** (§3).
- A layered spine: **Engagements → Cases → Entitlements** (§4–§6), with **universal primitives** (§5) attached to cases.
- **Customer Home = command center** (§7) answering *"what do I need to do next?"*.
- **Workspaces compose per case** (§8); every case yields a **deliverable** (§9).
- A **recommendation engine** (§10) drives cross-sell; an **ownership engine** (§11) drives long-term retention.
- A **first-class document system** (§13). Operator console stays separate (§12).
- Payments (later) are **authorize-on-request / capture-on-delivery** — never capture-to-unlock.

---

## 2. Homepage 3-door journey

The homepage forces one question: **"Where are you in your car-buying journey?"**
(Consolidates today's 4 funnel cards into 3 intent doors; existing funnel routes
are reused as destinations.)

| Door | Buyer state | Primary CTAs | Routes (existing) |
|---|---|---|---|
| **A — "I have a deal in front of me"** (panic) | Has a quote/worksheet, about to sign | Scan My Deal · Upload Buyer's Order · Get My Verdict | `/check`, `/quote-review/intake` |
| **B — "I'm shopping for a vehicle"** | No car yet; wants a pro from the start | Start Credit-to-Keys · Get Pre-Qualified · Build My Purchase Plan | `/credit-to-keys`, `/build-my-plan` |
| **C — "I already bought, something's wrong"** | Already signed | Deal Rescue · Contract Review · Dealer Complaint Help | `/post-sale-triage` |

---

## 3. Free scan → post-scan account creation flow

1. **Free Red-Flag Scan** (Door A) — no payment, **no account required**. Verdict:
   **Great Deal · Fair Deal · Questionable · Bad Deal · Run Away** (engine
   green/amber/red + human-only `black` = walk away).
2. **Soft paywall** below the verdict — *where paid services begin*: "Want to know
   **why**?" (Deal Check) · "Review every fee?" (Junk Fee Audit) · "Negotiation
   strategy?" (scripts) · "Want an advocate?" (Deal Rescue / Buyer Advocate). Each
   is a **recommendation** (§10), not an upsell-to-tier.
3. **Account creation happens HERE — after the scan.** *"Create your free account
   to save your deal."* On signup the anonymous deal is **claimed** (`user_id`
   set) and a **Deal Check case** (status `scanned`) is opened under a Deal Check
   engagement.
4. Account → **Customer Home** (command center).

**Rule:** the free scan never requires an account or payment. The account is a
*save* action; paid services are *engagements/cases*, not unlocks.

---

## 4. The core spine: Engagements → Cases

**Engagements** and **Cases** are the source of truth. Existing artifacts
(`deals`, `product_intakes`, `market_snapshots`) are the **work products** a case
points at; the **case** carries lifecycle + deliverable + primitives.

### 4.1 Engagements (service-line relationship)
```
engagements
  id          uuid pk
  user_id     uuid -> auth.users           [nullable until claimed]
  service     text  -- 'deal_check' | 'deal_rescue' | 'buyer_advocate'
                    --  | 'credit_to_keys' | 'concierge'
  status      text  -- 'active' | 'closed'
  created_at  timestamptz
  updated_at  timestamptz
```
One row per service line a customer uses. Repeat work under the same service line
reuses the engagement (e.g. two Deal Checks = one Deal Check engagement, two
cases). This is the **billing/relationship anchor** (esp. recurring Credit-to-Keys).

### 4.2 Cases (the unit of work — the operational heart)
```
cases
  id            uuid pk
  engagement_id uuid -> engagements
  user_id       uuid -> auth.users          [denormalized for owner-scoped RLS]
  type          text  -- mirrors engagement.service (deal_check, deal_rescue, …)
  status        text  -- 'scanned' | 'requested' | 'in_progress' | 'in_review'
                      --  | 'delivered' | 'closed'
  stage         text  -- Credit-to-Keys only: 'prepare'|'qualify'|'shop'|'negotiate'
                      --  |'purchase'|'delivery'|'ownership' (else null)
  deal_id       uuid -> deals (nullable)            -- deal_check / quote_review
  intake_id     uuid -> product_intakes (nullable)  -- rescue / build / concierge
  deliverable_id uuid -> deliverables (nullable)    -- the tangible output (§9)
  title         text
  created_at    timestamptz
  updated_at    timestamptz
```
- A claimed free scan = a `deal_check` case, status `scanned`, → its `deals` row.
- A paid request moves the case `requested → in_progress/in_review → delivered`
  (the deliverable is ready; this is also the payment **capture** event).
- Credit-to-Keys = **one long-running case** driven by `stage`.
- **Every case must reference a deliverable by the time it's `delivered`** (§9, invariant 2).
- RLS: default-deny, owner-scoped SELECT (`user_id = auth.uid()`), like `deals`.

---

## 5. Universal primitives (every workspace inherits these)

Every service becomes communication. So **Messages, Notifications, Tasks,
Documents, and Timeline are universal primitives** attached to a **case** (and,
where relevant, the customer). They are built **once** and every workspace inherits
them — this is the single biggest future-dev simplifier.

```
messages        (case_id, sender: 'customer'|'operator', body, created_at)
notifications   (user_id, case_id?, kind, body, read_at, created_at)
tasks           (case_id, owner: 'customer'|'operator', label, done, due_at)
documents       (see §13 — first-class system)
timeline_events (case_id, kind, summary, actor, created_at)   -- append-only audit/history
```

Every **Workspace** (§8) therefore has the same skeleton:
```
Workspace
├── Overview      (service-specific summary + the deliverable)
├── Messages
├── Documents
├── Tasks
└── Timeline
```
RLS owner-scoped to the case's `user_id`; operators access via the service client.

---

## 6. Entitlements model

Entitlements are **derived, never stored as tiers.** A pure, unit-testable
function maps a customer's engagements + cases → capability flags:

```
entitlementsFor(engagements, cases): {
  can_scan:                  boolean  // always true (free)
  can_save_deals:            boolean  // has an account
  can_view_reports:          boolean  // has a delivered deal_check/quote_review case
  can_message_advocate:      boolean  // has an active rescue/advocate/credit_to_keys case
  can_access_credit_to_keys: boolean  // has a credit_to_keys engagement
  can_upload_documents:      boolean  // has an active case that needs docs
  can_download_reports:      boolean  // has a delivered deliverable
  can_track_ownership:       boolean  // has reached the ownership stage / bought a vehicle
}
```

Granted by **engaged services + open/delivered cases + customer state** — **never**
by `Bronze | Silver | Gold`. There is no subscription level in the data model, the
UI, or the code. A `plan`/`tier`/`subscription_level` field anywhere is a defect.

---

## 7. Customer Home — the command center

There is **one** customer home at `/dashboard`. It does **not** switch by tier; it
**composes** from the customer's engagements + cases and answers the only question
a stressed buyer cares about: **"What do I need to do next?"**

```
Customer Home
├── Next Actions     ← open tasks across all cases, deadline-sorted (the answer to "what next?")
├── My Cases         ← every case (Deal Check #1/#2, Deal Rescue, Credit-to-Keys …) + status
├── My Services      ← engagements (service lines the customer uses)
├── My Deals         ← saved scans / verdict history
├── Documents        ← cross-case document center (§13)
├── Messages         ← unified inbox across cases
├── Recommendations  ← suggested next service (§10)
└── Progress         ← e.g. Credit-to-Keys stage progress
```

Clicking a case opens its **Workspace** (§8). A brand-new free customer sees the
Free experience: saved deals, **recommendations**, and "engage this service" CTAs
(never "upgrade to Gold").

---

## 8. Workspace definitions

Each workspace is **per case**, gated by entitlement, and built on the §5 skeleton
(Overview + Messages + Documents + Tasks + Timeline). Reuse existing data: `deals`
(verdict/findings/reviewed_*), `product_intakes` (intake payloads), `review_audit`
(delivery proof), `market_snapshots`.

- **Free Customer (no paid case):** saved deals · scan/verdict history · locked
  features with **"engage this service"** CTAs · recommendations.
- **Deal Check case:** Overview = status (`deals.status`) + analyst notes + the
  **delivered report** (deliverable) + negotiation scripts; + primitives.
- **Deal Rescue case:** Overview = assigned advocate + next actions + the **action
  plan** (deliverable); + Timeline/Documents/Tasks/Messages.
- **Credit-to-Keys case (guided OS):** Overview = the **7-stage** progress —
  Prepare → Qualify → Shop → Negotiate → Purchase → Delivery → **Ownership**
  (driven by `case.stage`); deliverable = the **purchase plan**; recurring,
  billed monthly **in arrears**. (Supersedes the 3-stage marketing copy on
  `/credit-to-keys`.) On reaching Ownership, hands off to the Ownership engine (§11).
- **Buyer Advocate case (case-management portal):** Overview = case status +
  advocate + deadlines; deliverable = **case deliverables**; + Documents/Messages/Tasks.

---

## 9. Deliverables (invariant: every case produces one)

A first-class record of the tangible output a case produces. **No case may reach
`delivered` without a deliverable.** This is the honesty mechanism (invariant 2,
§0): it keeps services as services, not feature subscriptions.

```
deliverables
  id          uuid pk
  case_id     uuid -> cases
  kind        text  -- 'report' | 'action_plan' | 'purchase_plan' | 'case_bundle'
  title       text
  document_id uuid -> documents (nullable)   -- the downloadable artifact, if any
  delivered_at timestamptz
```

| Service | Deliverable |
|---|---|
| Deal Check | Report (fee-by-fee verdict) |
| Deal Rescue | Action Plan |
| Buyer Advocate | Case deliverables |
| Credit-to-Keys | Purchase Plan |

Delivery is also the **only** moment a paid case's payment may be captured (§14).

---

## 10. Recommendation engine (the cross-sell)

A signal-driven engine that suggests the **next service** based on case findings /
verdicts / state. It is the polite, buyer-side cross-sell — recommendations, never
forced upsells, and never tier prompts.

```
recommend(customerState) -> Recommendation[]   // each: { reason, service, cta }
```

| Signal | Recommendation |
|---|---|
| Bad Deal / Run Away verdict | Deal Check (full report) |
| Negative equity detected | Credit-to-Keys |
| Already purchased | Ownership Tracker (§11) |
| Questionable / padded fees | Junk Fee Audit |
| Subprime APR / thin credit | Credit-to-Keys |

Recommendations surface in the soft paywall (§3), the Customer Home (§7), and case
workspaces. Signals come from `findings` / `auto_result` / `fee_categories` and
case state — no new scoring engine required.

---

## 11. Long-term Ownership engine (retention)

Ownership is **not** a dead end after purchase — it's its own long-running engine
that keeps customers for years and feeds future engagements (the next car, a
refinance, a trade-in). It begins when a Credit-to-Keys case reaches the Ownership
stage, or when a buyer marks a vehicle purchased.

```
Ownership
├── Warranty tracking          (expiry, coverage, claims)
├── Service reminders          (mileage/time-based)
├── Recall alerts              (NHTSA by VIN)
├── Equity tracking            (loan payoff vs market value over time)
├── Trade-in readiness         (when equity/positioning is favorable)
├── Refinance opportunities    (rate/credit improvements → re-engage)
└── Next purchase planning     (re-enters the funnel at Door B)
```

Modeled as an `ownership` engagement with a long-lived case; reuses Documents
(warranty/registration/insurance), Notifications, and Timeline. Each opportunity it
surfaces is a **Recommendation** (§10) back into a new paid engagement.

---

## 12. Operator dashboard separation

The operator dashboard is a **completely separate, internal-only** surface — it is
**not** a customer workspace and shares no entitlement logic with buyers.

- Lives under `/console/*`; gated by `getConsoleOperator()` (Supabase Auth +
  `operators` allowlist + `active` + role).
- Shows: case queue, assignments, SLA timers, customer management, analytics,
  revenue metrics, and the publish/delivery actions (the `review_audit` event).
- `getBuyer` and `getConsoleOperator` are distinct; being a buyer never grants
  operator access and vice-versa.

**Invariant:** customer workspaces and the operator console never merge. Two
applications, one database.

---

## 13. Document management (first-class system)

Documents accumulate fast — Buyer's Orders, Contracts, Finance Agreements,
Warranty Contracts, trade paperwork, Registration, Insurance, generated Reports.
Treat documents as a first-class subsystem from the start (not per-feature blobs):

```
documents            (id, user_id, case_id?, kind, storage_path, current_version_id, created_at)
document_versions    (id, document_id, version, storage_path, uploaded_by, created_at)
document_tags        (document_id, tag)                 -- e.g. 'buyers_order','contract','warranty'
document_permissions (document_id, principal, access)   -- customer/operator scoping
```
- Stored in the private `deal-uploads` bucket (extend or add buckets); served via
  short-lived signed URLs only (the console already does this).
- Versioned (re-uploads keep history); tagged by type; permissioned per principal.
- Deliverables (§9) that are downloadable point at a `documents` row.

---

## 14. Database / schema recommendations

Current schema is migrations `0001`–`0007` (leads, deals, findings,
product_intakes, market_snapshots, operators, review_audit) — all RLS default-deny,
forced; service-role mediated; owner-scoped SELECT on `deals`.

Additive changes (no destructive edits), introduced phase-by-phase:
- **`0008_engagements_cases.sql`** — `engagements` (§4.1) + `cases` (§4.2) with
  owner-scoped SELECT RLS + indexes; backfill: each claimed `deal` → a Deal
  Check/Quote Review engagement + case; each `product_intakes` row → its case.
- **`0009_case_primitives.sql`** — `messages`, `notifications`, `tasks`,
  `timeline_events` (§5), owner-scoped to the case.
- **`0010_documents.sql`** — `documents`, `document_versions`, `document_tags`,
  `document_permissions` (§13).
- **`0011_deliverables.sql`** — `deliverables` (§9).
- **Reuse, don't replace:** `deals.status` feeds case status; `product_intakes`
  remains the intake payload; `review_audit` remains the delivery/capture seam.
  Cases *reference* these.
- **Later (payments):** a `payments` table keyed to a **case**, recording
  authorize + capture tied to delivery. **No `plan`/`tier` column anywhere.**

---

## 15. Phased build plan

Each phase is independently shippable, verified with
`lint && typecheck && test && build`, and never violates §16.

- **Phase A — Spine + command center (next; separate approval):** `engagements` +
  `cases` (+ backfill); pure `entitlements` module (unit-tested); rework
  `/dashboard` into the **command center** composing Free + Deal Check cases.
  Deliverables for Deal Check. No payments.
- **Phase B — Front of funnel:** homepage 3-door; move account creation to *after*
  the scan (claim the deal → open a case); soft paywall = recommendations.
- **Phase C — Universal primitives + deeper workspaces:** messages/tasks/timeline +
  the document system; Deal Rescue workspace; then the Credit-to-Keys 7-stage OS;
  then Buyer Advocate case portal.
- **Phase D — Recommendations + Ownership engine:** signal-driven recommendations
  surfaced across home/paywall/workspaces; the long-term ownership engine.
- **Phase E — Payments (legal review first):** Stripe authorize-on-request /
  capture-on-delivery, keyed to a case's delivery event. Capture **only** at delivery.

---

## 16. Compliance guardrails & invariants (binding on every phase)

From `GO-TO-MARKET.md` §6 and `ROADMAP.md` §Guardrails:

1. **Strictly buyer-side.** No revenue from / steering toward dealers, lenders,
   F&I, or warranty sellers. Ever.
2. **Decision support, not advice.** Persistent disclaimer on every verdict/recommendation.
3. **NO ADVANCE FEE — access is never sold as a prepaid unlock.** Paid services are
   **authorize-on-request, capture-on-delivery** (Credit-to-Keys monthly **in
   arrears**). A workspace/entitlement is granted when the customer **engages** a
   service (opens a case); its deliverable unlocks **on delivery**, which is also
   the only moment payment may be captured. **Never gate a workspace behind a
   captured prepayment.** The free scan is always free, never behind an account or paywall.
4. **No false precision / no guarantees.** Every estimate is a range + confidence.
5. **No subscription tiers.** No `plan`/`tier`/`subscription_level` anywhere —
   entitlements derive from engagements + cases only.
6. **Every case produces a tangible deliverable.** If you can't name the
   deliverable, it isn't a case — it's a feature subscription, which we don't sell.

> Architectural tests for any future PR:
> - *"Does access depend on money captured before a service was delivered?"* → reject.
> - *"Is access gated by a tier/plan rather than an engagement/case?"* → reject.
> - *"Does this case reach `delivered` without a deliverable?"* → reject.

---

## 17. Acceptance criteria for Phase A

Phase A is done when ALL hold (implemented in a later, separately approved step):

1. **Schema:** `engagements` + `cases` exist (migration `0008`) with owner-scoped
   SELECT RLS + indexes; existing claimed deals/intakes are backfilled to an
   engagement + case. `get_advisors` shows no new RLS gaps.
2. **Entitlements:** a pure `entitlementsFor(engagements, cases)` function with
   unit tests covering free (scan only), saved-deals, delivered-report,
   credit-to-keys access, advocate messaging — and a test asserting **no
   tier/plan input exists** in the signature.
3. **Command center:** `/dashboard` renders the home from §7 (Next Actions, My
   Cases, My Services, My Deals, Recommendations stub) composed from the buyer's
   engagements + cases; Free experience for a no-paid-case customer; a Deal Check
   case opens its workspace. Locked features show "engage this service" CTAs, **not**
   tier upsell.
4. **Deliverable invariant honored:** a Deal Check case exposes its report as a
   `deliverable`; a case cannot be marked `delivered` without one (enforced in the
   service layer).
5. **No regressions:** existing free scan, verdict, deal-review, console, and
   operator flows still work; anonymous deals still reachable by capability URL.
6. **No subscription model introduced:** grep confirms no `plan`/`tier`/`subscription_level`.
7. **Quality gates:** `npm run lint && npm run typecheck && npm test && npm run build`
   all green; the buyer command center verified live (sign in → see composed home).
</content>
