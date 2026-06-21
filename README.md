# Driveway Advocate

**The KBB for car deals and extended warranties.** A buyer pastes or uploads a
car dealer's offer and gets a clear, buyer-side verdict on whether it's fair or a
rip-off — with the specific red flags explained — and can optionally request a
deeper human review.

This is **phase one** of a larger credit-and-deal advocacy platform ("credit is
the trunk, everything else is a branch"). It ships standalone, but the data model
and architecture are kept clean so it can become one module of a larger system
later (client app, operator console, credit-repair pipeline).

## Positioning & compliance (non-negotiable)

- **Strictly buyer-side.** Never takes money from, or steers buyers toward,
  dealers, lenders, F&I offices, or warranty companies. Every verdict serves the
  buyer alone.
- **Decision support, not advice.** A persistent disclaimer appears on the
  landing page and on every verdict.
- **No advance fees.** v1 has no payments. Any future paid review must charge
  **only after the review is delivered** (CROA/TSR). The enforcement seams are
  marked in code (search `ADVANCE-FEE`).
- **No false precision.** Every estimate is a **range** with a **confidence
  level**. The engine never fabricates an exact "fair price."

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS · Supabase (Postgres, Storage,
RLS) · deploy on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values (see below)
npm run dev
```

The app runs without Supabase configured — you'll get verdicts inline (not saved,
no shareable link, console disabled). Configure Supabase for the full flow.

### Environment variables

| Var | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — RLS-constrained, can read nothing directly |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Bypasses RLS; used by server routes + console |
| `CONSOLE_PASSWORD` | v1 stopgap password gating the review console |

### Database

Apply the idempotent migration in `supabase/migrations/0001_init.sql` (via the
Supabase SQL editor or CLI). It creates `leads`, `deals`, `findings`
(+ a `red_flags` view), enables **Row Level Security with default-deny** (no
anon/authenticated policies — all access is server-mediated), and creates a
private `deal-uploads` storage bucket.

## Architecture map

| Path | What it is |
| --- | --- |
| `src/app/page.tsx` | Landing page (value, 3 steps, disclaimer) |
| `src/app/check` | Deal Check form — manual entry **and** upload→confirm path |
| `src/app/verdict/[id]` | Buyer verdict (auto, or human-reviewed if published) |
| `src/app/console` | Private review console (list) — gated by `CONSOLE_PASSWORD` |
| `src/app/console/[id]` | Console deal detail + reviewed-verdict editor |
| `src/lib/fairness-engine.ts` | **The fairness brain.** All pricing math lives here |
| `src/lib/deal-mapper.ts` | Form payload ⇄ engine input ⇄ DB row |
| `src/app/api/*` | Server routes: score, parse upload, review request, console auth/publish |

### The fairness engine (the important part)

`src/lib/fairness-engine.ts` is a single, swappable module behind one function:
`scoreDeal(input) → result`. It estimates a fair **range** for extended
warranties from vehicle risk (age, mileage, brand reliability), coverage tier,
and term; flags junk/padded fees, APR markup, and overpriced/redundant add-ons;
and labels every estimate with a confidence level.

**Every constant is a documented PLACEHOLDER** (search
`PLACEHOLDER — replace with real engine value`) sourced to a stated assumption,
not a fabricated figure. The owner's real engine (warranty pricing model, risk
scoring, seed data from `backup/main-warranty-pricing-app`) drops in by replacing
**only this module's internals** — the exported types are the contract, so the
UI and database need zero changes.

## Two input paths (deliberately not conflated)

- **Manual entry → instant verdict.** Typed numbers are scored immediately.
- **Photo/PDF upload → parse, then verdict.** Not instant. The file is stored,
  fields are extracted (v1 uses a clearly-labeled placeholder parser in
  `src/app/api/parse/route.ts`), and the buyer **confirms/fills** before scoring.

## Deferred (do not build yet)

User accounts, payments, email automation, live third-party pricing APIs, and
**proper console auth** (the password gate is a marked stopgap — search
`REPLACE WITH PROPER AUTH`).
