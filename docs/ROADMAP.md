# Driveway Advocate — Full Plan & Roadmap

> _"Credit is the trunk, everything else is a branch."_ Deal Check is the first
> branch. This document is the full plan: how we harden the shipped v1, drop in
> the owner's real fairness engine, and grow Deal Check into the complete
> credit‑and‑deal advocacy platform — without a rewrite at any step.

## Context

v1 (the buyer‑side **Deal Check**) is built and pushed: landing page, Deal Check
form (manual + upload→confirm), verdict with red/amber/green + warranty fairness
range + confidence, a private review console, and a Supabase schema with
RLS. All fairness math is isolated behind one swappable module
(`src/lib/fairness-engine.ts`), every pricing constant is a labeled
`PLACEHOLDER`, and compliance seams (buyer‑side only, decision‑support‑not‑advice,
no advance fee) are marked in code.

The full plan covers three tracks the owner asked for, sequenced so each lands on
the previous one's foundation:

- **Phase 0 — Productionize v1**: make the shipped app real, tested, secure, and
  deployed.
- **Phase 1 — Real fairness engine**: replace the placeholder engine internals
  with the owner's market‑research engine + seed data, behind the existing
  interface.
- **Phase 2+ — Platform**: accounts, payments (CROA/TSR‑compliant), full operator
  console, and the credit‑repair pipeline the rest of the business hangs from.

Guardrails that constrain **every** phase (never relax these):
1. **Strictly buyer‑side.** No money from / no steering toward dealers, lenders,
   F&I, or warranty sellers. Ever.
2. **Decision support, not advice.** Persistent disclaimer on landing + every
   verdict.
3. **No advance fee.** Any paid service charges **only after delivery**
   (CROA/TSR). Enforcement seams already marked; payments must honor them.
4. **No false precision.** Every estimate is a range + confidence level.

---

## Phase 0 — Productionize v1

Goal: turn the working v1 into something safe to put in front of real, stressed
buyers. Mostly self‑contained; no dependence on the owner's engine.

### 0.1 Lock in the fairness engine with tests _(in progress)_
- Add **Vitest**. Unit‑test `scoreDeal` in `src/lib/fairness-engine.ts`:
  good/amber/red rollups, warranty range math (brand tier × coverage × age/
  mileage × term), warranty rating thresholds, APR‑markup detection, junk‑fee
  rules, missing‑info notes, and confidence downgrades.
- Golden/snapshot tests so the **real engine swap in Phase 1 is diffable**.
- Test `deal-mapper.ts` normalization (string→number coercion, enum guarding).

### 0.2 Input validation & API hardening
- Introduce **Zod** schemas for every request body; share one source of truth
  between `deal-mapper.ts` and the API routes (`/api/deals`, `/api/parse`,
  `/api/deals/[id]/review-request`, `/api/console/...`).
- Add basic **rate limiting** to public routes (e.g. upstash or in‑memory token
  bucket) and a file‑type/size allow‑list on `/api/parse` (size cap already
  present).
- Return typed, friendly errors; never leak stack traces.

### 0.3 Provision Supabase + deploy _(needs owner go‑ahead — paid cloud actions)_
- Create the Supabase project (MCP `create_project`), apply
  `supabase/migrations/0001_init.sql`, verify RLS with `get_advisors`, confirm
  the `deal-uploads` bucket is private.
- Wire env vars; deploy to **Vercel** (MCP `deploy_to_vercel`). Smoke‑test the
  full manual + upload + review‑request + console publish loop in prod.
- Generate DB types (`generate_typescript_types`) to replace hand‑written row
  types in `src/lib/types.ts`.

### 0.4 Real console auth (retire the stopgap)
- Replace the `CONSOLE_PASSWORD` cookie (`src/lib/console-auth.ts`,
  `REPLACE WITH PROPER AUTH`) with **Supabase Auth** + an `operators` table and
  RLS. Keep `isConsoleAuthed()`’s call sites unchanged so route guards don't move.

### 0.5 VIN decode
- Add a server route `/api/vin/[vin]` calling the free **NHTSA vPIC** API to
  prefill year/make/model/trim. Pure enhancement to the form; degrades silently.

### 0.6 Real upload parsing (behind the existing seam)
- Replace the placeholder `extractFields` in `src/app/api/parse/route.ts` with a
  real extractor (Claude vision / document model or an OCR provider). Keep the
  return shape — the form already consumes it and the **confirm step stays**, so
  honesty about “not instant” is preserved.

### 0.7 CI, quality, a11y
- **GitHub Actions**: install → `lint` → `typecheck` → `test` → `build` on PRs.
- SessionStart hook so Claude‑on‑web sessions can build/test.
- Accessibility pass (labels, focus, contrast), loading/empty/error states,
  and a `/security-review` before launch.

---

## Phase 1 — Real fairness engine integration

Goal: swap placeholder pricing for the owner's real engine (TS + Python:
`research/`, `scoring/`, `database/`, `packages/warranty-engine/`,
`src/drivewayadvocate/`) **without touching UI or DB**.

- **Contract is already defined**: `scoreDeal(FairnessInput) → FairnessResult`.
  The swap re‑implements only this module's internals.
- **TypeScript engine** (`packages/warranty-engine`): vendor it in as
  `src/lib/fairness-engine/impl/*` and have `scoreDeal` delegate to it. Replace
  every `PLACEHOLDER` table (brand reliability, base ranges, multipliers, APR
  bands, fee rules) with the real seed data.
- **Python pieces** (risk‑scoring model): choose one —
  (a) port to TS, (b) expose as a **Supabase Edge Function / serverless Python**
  microservice the engine calls, or (c) precompute lookup tables from it into
  `database/` seed data. Recommend (c) where possible (no runtime Python),
  (b) for genuinely dynamic scoring.
- **Seed data** → Supabase tables (e.g. `warranty_price_bands`,
  `brand_risk`, `fee_norms`) with a documented import migration; engine reads
  them, so updates don't need redeploys.
- **Validation**: keep the Phase 0 golden tests; add a comparison harness that
  runs a fixture set through placeholder vs real engine and reports deltas, plus
  **confidence calibration** against any ground‑truth the owner has.
- **Versioning**: bump `engineVersion`; store it on each `deals` row for
  auditability (column already carried in `auto_result`).

---

## Phase 2 — Platform foundation

Goal: grow Deal Check into a multi‑module platform. Each item extends existing
records rather than replacing them.

### 2.1 Buyer accounts & customer profile
- Add **Supabase Auth** for buyers (optional sign‑in to save deals/history).
- Evolve `leads` → a richer **`customers`** profile (keep `leads` as the
  capture point; link `deals.lead_id`/`customer_id`). This is the join point to
  the broader platform and the future credit‑repair module.

### 2.2 Full operator console (grow the seed)
- From the v1 console: add operator **roles**, a **work queue** with assignment,
  status workflow, an **audit log**, internal notes, and SLA timers.
- The data model (`deals` + `findings` + statuses) already supports this; layer
  RBAC + RLS for operators.

### 2.3 Paid human review — payments (CROA/TSR‑critical)
- **Charge only after the reviewed verdict is delivered.** Implement with
  Stripe using **authorize‑on‑request, capture‑on‑publish**, or invoice‑after.
  The publish route (`/api/console/deals/[id]/publish`) is the delivery event and
  the **only** place a capture may fire — the seam is already marked.
- Clear pre‑purchase disclosures; no fee implied before service. Legal review of
  CROA/TSR copy before enabling.

### 2.4 Email automation
- Transactional email (e.g. Resend) on “review requested” and “verdict
  published.” Buyer‑side only, no marketing entanglement with sellers.

---

## Phase 3 — Credit‑repair pipeline (the trunk)

Goal: connect Deal Check (a branch) to the core credit‑repair business.

- Shared **customer profile** spans Deal Check and credit‑repair engagements.
- Credit‑repair intake, dispute pipeline, and reporting as a **separate module**
  that reuses the platform's auth, profiles, console, and payments — all built
  CROA/TSR‑compliant (advance‑fee rules, written contracts, disclosures, right to
  cancel). **Not built now**; the architecture above leaves room for it.

---

## Sequencing & checkpoints

1. **Now**: 0.1 tests + 0.2 validation + 0.7 CI (self‑contained). → commit/push.
2. **Checkpoint (owner go‑ahead)**: 0.3 provision Supabase + deploy to Vercel
   (paid cloud actions — confirm before creating projects).
3. Then 0.4 auth, 0.5 VIN, 0.6 real parsing.
4. **Needs owner's engine code**: Phase 1.
5. **Product decisions + legal review**: Phase 2 (esp. payments) and Phase 3.

## Verification (per increment)
- `npm run lint && npm run typecheck && npm test && npm run build` all green.
- Engine behavior pinned by Vitest golden tests (diffable across the Phase 1
  swap).
- Post‑deploy: manual end‑to‑end in prod (manual entry → verdict; upload →
  confirm → verdict; request review; console login → publish → buyer sees
  reviewed verdict); Supabase `get_advisors` shows no RLS gaps; `/security-review`.
