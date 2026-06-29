# Driveway Advocate — Product Architecture

> Companion to `ROADMAP.md` (how we build) and `GO-TO-MARKET.md` (how we get
> bought). **This is the architectural constitution for the customer-facing
> platform: the journey, the layered data model, and the operating system that
> runs cases from intake to delivery.**
>
> **READ THIS FIRST — THE FOUR LAWS (do not drift):**
> 1. **No subscription tiers.** No Bronze/Silver/Gold; access is never unlocked by
>    capturing a payment. Access follows the **service the customer is engaged in**.
> 2. **No advance fee.** Payment is **captured after delivery** (Credit-to-Keys
>    monthly in arrears). See the **delivery definition (§16)** — it is the keystone.
> 3. **Every case produces a tangible deliverable.** If you can't name the
>    deliverable, it isn't a case — it's a feature subscription, which we don't sell.
> 4. **Every state change is logged and attributable.** Customers see a case
>    timeline; operators/admins act only through audited transitions.

## 0. The mental model

```
Customer
   ↓
Engagements      ← the service LINES a customer uses ("My Services")
   ↓
Cases            ← discrete units of WORK: lifecycle + SLA + primitives + a deliverable ("My Cases")
   ↓
Entitlements     ← capability flags DERIVED from engagements + cases (never tiers)
   +  Object permissions  ← can THIS principal touch THIS exact object (§8)
   ↓
Customer Home    ← the command center: "what do I need to do next?"
   ↓
Workspaces       ← per-case rooms (Overview + universal primitives)
   ↓
Deliverables     ← the tangible output every case must produce (capture trigger)
   ↓
Recommendations  ← signal-driven cross-sell to the next service
   ↓
Long-Term Ownership ← the post-purchase retention engine
```

### The layers, defined
- **Engagement** — relationship with a **service line** (Deal Check, Deal Rescue,
  Buyer Advocate, Credit-to-Keys). "My Services." Billing/relationship anchor.
- **Case** — a **discrete unit of work** under an engagement, with its own
  lifecycle, **SLA/ownership**, universal **primitives**, and a **mandatory
  deliverable**. A Deal Check is one case; Credit-to-Keys is one long-running,
  stage-driven case. **A customer has many cases.** All case logic lives here.
- **Entitlement** — a derived capability flag (§7). **Object permission** — whether
  a specific principal may touch a specific object (§8). Both gate access; neither
  is a tier.
- **Workspace** — the per-case UI room (§11).

---

# PART I — JOURNEY & MODEL

## 1. Current state vs target state

### Current (migrations 0001–0007)
- Free scan works anonymously (`/check` → `/api/deals` → `/verdict/[id]`; Quote Review → `/deal-review/[id]`).
- Buyer accounts exist; account creation is *before* value; `/dashboard` is a flat deal list.
- `deals.user_id` + owner-scoped RLS; anonymous deals are capability-URL only.
- Non-automated services → `POST /api/intake` → `product_intakes` (write-once). Operator console live + separate (`/console/*`, `operators` allowlist, `review_audit`).
- **Missing:** Cases, SLA/ownership, a canonical status taxonomy, universal primitives, customer-visible timeline, notifications, document lifecycle, delivery definition, cancellation rules, evidence/retention policy, recommendations, ownership engine, payments.

### Target
The layered spine (§4–§8) + the operating system (Part II) + the command center
(§9) and workspaces (§11), with delivery (§16) wired to the capture-after-delivery
compliance model.

## 2. Homepage 3-door journey
One question — **"Where are you in your car-buying journey?"** — three doors:

| Door | Buyer state | CTAs | Routes |
|---|---|---|---|
| **A — deal in hand** (panic) | About to sign | Scan My Deal · Upload Buyer's Order · Get My Verdict | `/check`, `/quote-review/intake` |
| **B — shopping** | No car yet | Start Credit-to-Keys · Get Pre-Qualified · Build My Plan | `/credit-to-keys`, `/build-my-plan` |
| **C — already bought** | Signed | Deal Rescue · Contract Review · Complaint Help | `/post-sale-triage` |

## 3. Free scan → post-scan account creation
1. **Free Red-Flag Scan** — no payment, no account. Verdict: Great · Fair · Questionable · Bad · Run Away.
2. **Soft paywall** — recommendations (§14), not tier upsell: "know **why**?" (Deal Check) · "review every fee?" (Junk Fee Audit) · "negotiation strategy?" · "want an advocate?".
3. **Account creation AFTER the scan** — "save your deal." Claims the anonymous deal (`user_id`) and opens a `deal_check` **case** (status `scanned`).
4. → **Customer Home**. The free scan is never gated by account or payment.

## 4. The core spine: Engagements → Cases

### 4.1 engagements (service-line relationship)
```
engagements(id, user_id->auth.users [nullable until claimed],
            service: deal_check|deal_rescue|buyer_advocate|credit_to_keys|concierge,
            status: active|closed, created_at, updated_at)
```

### 4.2 cases (the operational heart — lifecycle + SLA + ownership)
```
cases(
  id, engagement_id->engagements, user_id->auth.users [owner-scoped RLS],
  type,                       -- mirrors engagement.service
  status,                     -- canonical taxonomy, §5
  stage,                      -- Credit-to-Keys only (7 stages, §11)
  priority,                   -- queue priority, §15
  assigned_operator_id->operators [nullable],
  due_at timestamptz [nullable],         -- SLA target
  sla_status: on_track|at_risk|breached [derived],
  escalation_reason text [nullable],
  intake_completeness numeric [0..1],    -- §21
  deal_id->deals [nullable], intake_id->product_intakes [nullable],
  deliverable_id->deliverables [nullable],
  title, created_at, updated_at)
```
Free scan → `deal_check` case (`scanned`). Paid request advances the case through
the taxonomy (§5). Credit-to-Keys = one long-running `active` case driven by `stage`.

---

## 5. Status taxonomy (the ONE official list)

Every feature, dashboard, email, queue, and payment reads **this** enum. Do not
invent per-feature statuses.

```
scanned             -- free verdict generated; no paid service engaged
submitted           -- customer opened/requested a paid service (case created)
review_requested    -- queued for an operator (human services)
in_review           -- operator actively working it
needs_customer_info -- BLOCKED on the customer (drives a Customer Action, §10)
ready_for_delivery  -- work complete, awaiting publish
delivered           -- deliverable published to dashboard + delivery event recorded (§16)
payment_pending     -- delivered, awaiting capture (capture-AFTER-delivery)
active              -- long-running recurring case (Credit-to-Keys / Ownership)
closed              -- done (paid/complete or no further action)
cancelled           -- abandoned/cancelled (§19)
```

Allowed transitions are enforced in the service layer; every transition writes a
`timeline_event` (§6) and, for operator/admin actions, a `review_audit` row (§22).
`delivered` is the **only** gateway to `payment_pending` (no capture before it).

---

## 6. Universal primitives (every workspace inherits these)

Messages, Notifications, Tasks, Documents, and **Timeline** are universal, attached
to a **case**, built once. The Timeline is the **customer-visible event log**
(reduces support load, builds trust): "Deal uploaded → Review started → More info
requested → Report delivered → Payment captured → Case closed."

```
messages        (case_id, sender: customer|operator|system, body, created_at)
notifications   (user_id, case_id?, channel: dashboard|email|sms, kind, body, read_at, sent_at)  -- §17
tasks           (case_id, owner: customer|operator, label, blocking bool, done, due_at)            -- §10 when owner=customer
documents       (§15 — first-class lifecycle)
timeline_events (case_id, kind, summary, actor: customer|operator|system, visibility: customer|internal, created_at)
```
Every **Workspace** skeleton: `Overview · Messages · Documents · Tasks · Timeline`.
RLS owner-scoped to the case's `user_id`; operators via service client + assignment (§8).

## 7. Entitlements (derived capability flags)
```
entitlementsFor(engagements, cases): {
  can_scan, can_save_deals, can_view_reports, can_message_advocate,
  can_access_credit_to_keys, can_upload_documents, can_download_reports,
  can_track_ownership
}
```
Granted by engaged services + case state. **Never** by a tier. A
`plan`/`tier`/`subscription_level` field anywhere is a defect.

## 8. Object-level permissions (beyond entitlements)
Entitlements say what a user can do *in general*; **object permissions** answer
*"may this exact principal touch this exact object?"*:
- **Customer ↔ own data:** owner-scoped RLS (`user_id = auth.uid()`) on cases,
  deals, documents, messages, timeline (customer-visible only).
- **Operator ↔ case:** service-client access **plus assignment** —
  `assigned_operator_id` (and role) determine who may act on / message a case.
- **Document deletion/visibility:** governed by `document_permissions` (§15), not
  blanket entitlements (e.g., a customer may delete an unverified upload but not a
  delivered report; an advocate may message only their assigned buyer).
- Object-level checks are enforced server-side on every mutating action, in
  addition to RLS.

## 9. Customer Home — the command center
One home at `/dashboard`. Composes from engagements + cases. Answers **"what do I
need to do next?"**:
```
Next Actions   ← blocking customer tasks across all cases, deadline-sorted (§10) — the heartbeat
My Cases       ← every case + status (§5) + sla_status
My Services    ← engagements
My Deals       ← saved scans / verdict history
Documents      ← cross-case document center (§15)
Messages       ← unified inbox
Recommendations← next service (§14)
Progress       ← Credit-to-Keys stage progress
```

## 10. Customer Action System (the heartbeat)
The dashboard must tell the buyer **what to do**, not just show data. A "customer
action" is a **blocking task** (`tasks.owner = customer, blocking = true`) that
typically moves a case out of `needs_customer_info`. Examples: *Upload buyer's
order · Confirm lender approval · Answer trade-in question · Review delivered
report · Approve next step.* Next Actions on the home (§9) is the prioritized list
of these. Completing one writes a `timeline_event` and can auto-transition the case.

## 11. Workspaces (per case; Overview + primitives)
- **Free Customer:** saved deals · history · "engage this service" CTAs · recommendations.
- **Deal Check:** Overview = status + notes + **delivered report** + scripts.
- **Deal Rescue:** Overview = advocate + next actions + **action plan**.
- **Credit-to-Keys (guided OS):** 7 stages — Prepare → Qualify → Shop → Negotiate →
  Purchase → Delivery → **Ownership** (`case.stage`); deliverable = **purchase plan**;
  recurring, billed monthly in arrears; hands off to Ownership (§ below).
- **Buyer Advocate:** case-management portal; deliverable = **case strategy/bundle**.

## 12. Deliverables + templates (invariant: every case produces one)
```
deliverables(id, case_id, kind, title, document_id->documents [nullable], delivered_at)
```
No case reaches `delivered` without a deliverable. **Templates per service:**

| Service | Deliverable |
|---|---|
| Deal Check | Report (fee-by-fee verdict) |
| Junk Fee Audit | Fee challenge sheet |
| F&I Product Review | Product / value analysis |
| Deal Rescue | Action plan |
| Credit-to-Keys | Staged purchase plan |
| Buyer Advocate | Case strategy / bundle |

## 13. Recommendation engine (cross-sell)
`recommend(customerState) -> { reason, service, cta }[]`, signal-driven, never a tier prompt:

| Signal | Recommendation |
|---|---|
| Bad Deal / Run Away | Deal Check (full report) |
| Negative equity | Credit-to-Keys |
| Already purchased | Ownership Tracker |
| Questionable / padded fees | Junk Fee Audit |
| Subprime APR / thin credit | Credit-to-Keys |

Signals come from `findings` / `auto_result` / `fee_categories` + case state.
Surfaces in the soft paywall (§3), the home (§9), and workspaces.

## 14. Long-term Ownership engine (retention)
Begins at the Credit-to-Keys Ownership stage or when a buyer marks a vehicle
purchased. An `ownership` engagement + long-lived `active` case:
Warranty tracking · Service reminders · Recall alerts (NHTSA by VIN) · Equity
tracking · Trade-in readiness · Refinance opportunities · Next-purchase planning.
Each opportunity becomes a **recommendation** back into a new engagement.

---

# PART II — THE OPERATING SYSTEM

## 15. Case ownership, SLA & queue priority
Cases carry **ownership + urgency** (fields on `cases`, §4.2):
- `assigned_operator_id` — who owns it internally; unassigned cases surface in the queue.
- `priority` — computed (see below); orders the operator queue.
- `due_at` + `sla_status` (`on_track|at_risk|breached`) — SLA timers; breaches set
  `escalation_reason` and raise an operator alert (§17).
- **Queue priority logic** weighs: *buyer signing today · dealer deadline ·
  bad-deal severity · high dollar risk · post-sale rescue · paid human review
  requested.* No case is silently stuck — unassigned/at-risk/breached cases are
  always visible in the operator queue (§ Operator dashboard).

## 16. Delivery & payment-trigger definition  ⭐ (the keystone)
> **A service is DELIVERED when, and only when:** the case's **deliverable**
> (§12) is **published to the customer's dashboard** AND a **`delivered` timeline
> event** is recorded on the case (the case transitions to `delivered`).

Consequences (binding):
- **Payment may be authorized at request** but **captured only at/after the
  `delivered` event** (case then `payment_pending` → `closed`). Credit-to-Keys is
  billed **monthly in arrears** for work already delivered.
- A deliverable that exists but is **not yet published** is **not delivered** — no
  capture. Internal "ready" work is `ready_for_delivery`, never `delivered`.
- The publish action (today's `/api/console/deals/[id]/publish`, extended to
  cases) is the **single delivery event** and the only place a capture may fire.
- Every delivery writes `review_audit` (who delivered, when) + a customer-visible
  `timeline_event`.

## 17. Notifications
Every meaningful status change (§5) fans out to the right channel(s):
`dashboard` (always) · `email` (transactional, e.g. Resend) · `sms` (later) ·
`operator alert` (queue/SLA breaches). Buyer-side only — no marketing entanglement
with sellers. Recorded in `notifications` (§6). Triggers include: review started,
needs_customer_info, ready_for_delivery, **delivered**, payment captured, case closed.

## 18. Document lifecycle
Documents are not just uploads; they move through a lifecycle and carry type +
version + visibility:
```
uploaded → classified → parsed → needs_review → verified → used_in_report → archived
```
```
documents            (id, user_id, case_id?, kind, status[lifecycle], visibility: customer|internal,
                       current_version_id, created_at)
document_versions    (id, document_id, version, storage_path, uploaded_by, created_at)
document_tags        (document_id, tag)   -- buyers_order|contract|finance|warranty|trade|registration|insurance|report
document_permissions (document_id, principal, access: view|download|delete)
```
- Stored in the private bucket; served via short-lived signed URLs only.
- Deletion governed by `document_permissions` + status (e.g. a `verified`
  doc used in a delivered report is **archive-only**, not deletable by the customer).
- Generated deliverables (§12) point at a `documents` row.

## 19. Cancellation / abandonment / refund rules
Because there's **no advance fee**, most cancellations are clean:
- **Cancelled before work starts** (`submitted`/`review_requested`): close, no charge.
- **Cancelled after review begins** (`in_review`): close as `cancelled`; no capture
  unless a deliverable was already published (it wasn't → no charge).
- **Customer never responds** (`needs_customer_info` past SLA): auto-nudge (§17),
  then auto-`cancelled` after a defined window; no charge.
- **Duplicate submission:** merge/close the duplicate; link to the original case.
- **Bad/unreadable documents:** → `needs_customer_info` with a customer action to re-upload.
- **Refunds** apply only to already-captured (i.e. already-delivered) work and are
  an audited admin action (§22) with a recorded reason.

## 20. Evidence, retention & audit policy
- **Evidence preservation** (critical for Deal Rescue / Buyer Advocate disputes):
  preserve original uploads (immutable first version), timestamps, customer
  statements, dealer quote details, operator notes, and final recommendations. The
  customer-visible timeline + `review_audit` + immutable `document_versions` form
  the evidentiary record.
- **Retention & deletion:** define per-class retention windows (contracts, IDs,
  loan docs, messages) honoring legal + CROA/TSR record-keeping; support
  customer-initiated deletion **except** where a legal hold or active dispute
  applies. Deletions are audited.
- **Audit:** operator/admin actions → `review_audit`; customer-facing history →
  customer-visible `timeline_events`. Nothing material changes without a record.

## 21. Intake completeness scoring
Before an operator touches a case, the system scores intake completeness
(`cases.intake_completeness`) against the service's required fields and flags
what's missing — e.g. *missing VIN · missing buyer's order · missing APR · missing
trade payoff · missing lender approval.* Incomplete intake auto-creates customer
actions (§10) and holds the case in `needs_customer_info` rather than burning
operator time.

## 22. Admin / support overrides (all audited)
Stuck cases need safe, **logged** admin tools (admin role only): reassign case ·
mark delivered · reopen case · refund / cancel · attach report · correct customer
ownership. **Every override writes a `review_audit` row** with actor + reason; no
silent edits. Overrides respect the delivery/compliance laws (e.g. "mark delivered"
publishes a real deliverable + delivery event).

## 23. Operator dashboard separation
Completely separate, internal-only (`/console/*`, `getConsoleOperator()` —
Supabase Auth + `operators` allowlist + role). Shows the **case queue** (ordered
by priority/SLA, §15), assignments, SLA timers, customer management, analytics,
revenue, and the publish/delivery action (§16). Buyer auth and operator auth are
disjoint. **Customer workspaces and the operator console never merge** — two apps,
one database.

---

# PART III — BUILD

## 24. Database / schema recommendations
Current: migrations `0001`–`0007` (all RLS default-deny, forced, service-mediated;
owner-scoped SELECT on `deals`). Additive, phase-by-phase:
- **`0008_engagements_cases.sql`** — `engagements` (§4.1) + `cases` (§4.2, incl.
  SLA/ownership/priority/completeness fields, canonical status §5); backfill deals
  + intakes → engagements + cases.
- **`0009_case_primitives.sql`** — `messages`, `notifications`, `tasks`,
  `timeline_events` (§6, §10, §17).
- **`0010_documents.sql`** — `documents` (+ lifecycle status, visibility),
  `document_versions`, `document_tags`, `document_permissions` (§18).
- **`0011_deliverables.sql`** — `deliverables` (§12).
- **Later (payments):** `payments` keyed to a **case** (authorize + capture tied to
  the §16 delivery event). **No `plan`/`tier` column anywhere.**
- **Reuse:** `deals` (verdict/findings), `product_intakes` (intake payload),
  `review_audit` (delivery/override audit), `operators` (assignment). Cases
  reference these.

## 25. Phased build plan
Each phase ships independently; `lint && typecheck && test && build` green; never
violates §26.
- **Phase A — Spine + command center (next; separate approval):** `engagements` +
  `cases` (canonical status, SLA fields) + backfill; pure `entitlements`
  (unit-tested); rework `/dashboard` into the command center (Next Actions / My
  Cases / My Services / My Deals / Recommendations stub) for Free + Deal Check;
  Deal Check **deliverable** + the **delivery definition** enforced. No payments.
- **Phase B — Front of funnel:** homepage 3-door; account-after-scan (claim deal →
  open case); soft paywall = recommendations.
- **Phase C — Operating system:** universal primitives (messages/tasks/timeline) +
  notifications + the document lifecycle system; intake completeness; SLA/queue +
  customer actions; cancellation/abandonment rules.
- **Phase D — Deeper workspaces + engines:** Deal Rescue, Credit-to-Keys 7-stage
  OS, Buyer Advocate portal; recommendations engine; Ownership engine.
- **Phase E — Payments (legal review first):** Stripe authorize-on-request /
  **capture-on-delivery** (§16), keyed to a case; admin refund/override (§22).

## 26. The Four Laws + guardrails (binding on every phase)
From `GO-TO-MARKET.md` §6 / `ROADMAP.md` §Guardrails, plus this doc's laws:
1. **Strictly buyer-side** — no revenue from / steering toward dealers, lenders, F&I, warranty sellers.
2. **Decision support, not advice** — persistent disclaimer on every verdict/recommendation.
3. **No advance fee** — authorize-on-request, **capture-on-delivery** (§16); Credit-to-Keys monthly in arrears; the free scan is always free.
4. **No false precision** — every estimate is a range + confidence.
5. **No subscription tiers** — entitlements derive from engagements + cases only.
6. **Every case produces a deliverable** — named, published, then capture (§12, §16).
7. **Everything material is logged** — customer timeline + operator/admin audit (§20, §22).

> PR rejection tests:
> - Access depends on money captured **before** delivery? → reject.
> - Access gated by a **tier/plan** rather than engagement/case? → reject.
> - A case reaches `delivered` **without** a published deliverable + delivery event? → reject.
> - A material state change with **no** audit/timeline record? → reject.

## 27. Acceptance criteria for Phase A
1. **Schema:** `engagements` + `cases` (migration `0008`, canonical status §5 + SLA
   fields) with owner-scoped SELECT RLS + indexes; deals/intakes backfilled;
   `get_advisors` clean.
2. **Entitlements:** pure `entitlementsFor(engagements, cases)` unit-tested (free,
   saved-deals, delivered-report, credit-to-keys, advocate messaging) + a test
   asserting **no tier/plan input** in the signature.
3. **Command center:** `/dashboard` renders §9 (Next Actions, My Cases, My
   Services, My Deals, Recommendations stub) composed from engagements + cases;
   Free experience for no-paid-case; Deal Check case opens its workspace; locked
   features show "engage this service", **not** tier upsell.
4. **Delivery + deliverable enforced:** a Deal Check case exposes its report as a
   `deliverable`; the service layer forbids `delivered` without a published
   deliverable + a `delivered` timeline event (§16).
5. **No regressions:** free scan, verdict, deal-review, console, operator flows
   still work; anonymous deals still reachable by capability URL.
6. **No subscription model:** grep confirms no `plan`/`tier`/`subscription_level`.
7. **Quality gates:** lint + typecheck + test + build green; command center
   verified live (sign in → composed home).
</content>
