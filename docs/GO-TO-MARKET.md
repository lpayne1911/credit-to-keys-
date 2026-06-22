# Driveway Advocate — Go-to-Market Strategy

> _Companion to [`ROADMAP.md`](./ROADMAP.md)._ The roadmap covers **how we build**;
> this covers **how we get bought**. It captures the repositioning, the offer
> ladder, a 90-day launch plan, and the content engine that feeds it.

## 1. Positioning

We are **buyer-side car-deal protection** sold at the **panic moment** — the
hours between getting a quote and signing the paperwork. We are not a research
site, a calculator, or a lead-gen funnel for dealers. The brand's loudest line
is the one promise no one else in the car-buying stack can make:

> **You're the only one paying us.** Never the dealer, lender, finance office, or
> warranty company. No commissions, no kickbacks, ever.

Everything downstream — pricing, copy, channels, content — has to reinforce that
single trust claim. The moment we appear to be paid by the other side, the
product is dead.

### Who we talk to
Three buyers, three doors (all live on the landing page):
1. **"Check my deal"** — has a quote/worksheet in hand and a bad feeling. _Live._
2. **"Help me buy"** — hasn't picked the car; wants a pro from the start.
3. **"Fix my credit first"** — 3–9 months out; score is about to cost them
   thousands. This is the **Credit-to-Keys** flagship and the recurring engine.

## 2. The offer ladder

The repriced menu (live at `/services`), each product framed by the buyer fear it
answers. Front doors are cheap and fast to build trust; the flagship is where the
recurring revenue lives.

| Tier | Product | The fear it answers | Price | Status |
|---|---|---|---|---|
| Free front door | Free Red-Flag Scan | "Should I even be worried?" | Free | **Live** |
| Paid front door | Deal Check | "Is this quote fair?" | $99–$149 | **Live** |
| Paid front door | Junk Fee Audit | "What can I challenge?" | $149–$249 | Soon |
| Paid front door | F&I Product Review | "Should I buy/cancel this?" | $149–$299 | Soon |
| Paid front door | Used-Car Risk Report | "Is this car a mistake?" | $199–$399 | Soon |
| Core | Deal Rescue | "Help me fix this offer." | $349–$599 | Soon |
| Premium | Buyer Advocate | "Help me buy the right car." | $899–$1,499 | Soon |
| Premium | Concierge | "Handle the process with me." | $1,999+ | Soon |
| Flagship | Credit-to-Keys | "Fix my score, then help me buy." | Staged | Soon (page live) |

**Ladder logic:** the free scan and Deal Check capture buyers at the panic
moment and earn trust cheaply. Satisfied Deal Check buyers are the warm list for
Deal Rescue and Buyer Advocate. The 3–9-month-out segment routes to
Credit-to-Keys, which is the only product billed on a recurring basis and the one
that turns a one-time transaction into a months-long relationship.

## 3. The 90-day launch plan

Three 30-day sprints. Each ends on a checkpoint that gates the next.

### Days 0–30 — Prove the front door
- **Goal:** validate that the panic-moment funnel converts and the verdict is
  trusted.
- Ship: harden the live Deal Check (tests, validation, real upload parsing —
  see ROADMAP Phase 0), deploy to production, instrument the funnel.
- Sell: free Red-Flag Scan as the top-of-funnel hook; Deal Check as the first
  paid step. Hand-fulfill every paid review personally to learn the objections.
- **Checkpoint:** ≥ 50 free scans, ≥ 10 paid Deal Checks, a repeatable verdict
  turnaround under 24h, and at least 3 testimonials in the buyer's own words.

### Days 31–60 — Build the ladder up
- **Goal:** turn one-time Deal Check buyers into higher-tier and recurring
  revenue.
- Ship: make `Junk Fee Audit`, `F&I Product Review`, and `Deal Rescue` real
  (each is a structured intake + the existing fairness engine + a verdict).
  Stand up CROA/TSR-compliant payments (authorize-on-request, capture-on-deliver).
- Sell: post-Deal-Check upsell to Deal Rescue; open the Credit-to-Keys waitlist
  to the 3–9-month segment captured by the landing page.
- **Checkpoint:** first Deal Rescue sales, first Credit-to-Keys intake calls
  booked, payment flow live and compliance-reviewed.

### Days 61–90 — Light the recurring engine
- **Goal:** Credit-to-Keys live, billed in stages, generating monthly revenue.
- Ship: Credit-to-Keys intake → staged billing (monthly in arrears) → the
  Prepare/Qualify/Buy pipeline, reusing the shared customer profile.
- Sell: convert the waitlist; every Credit-to-Keys customer is a guaranteed
  future Buyer Advocate / Deal Check at the "Buy" stage.
- **Checkpoint:** ≥ 10 active Credit-to-Keys engagements, documented
  stage-conversion rate, and a content engine running weekly (below).

## 4. The content engine

Content mirrors the product: **every piece answers a real fear a buyer has at the
dealership.** No generic "car buying tips." Each post ends with the relevant door
(free scan / Deal Check / Credit-to-Keys) as the CTA.

**Cadence:** 2 short pieces/week (social + email), 1 long piece/month (the
authority asset). Repurpose every long piece into 4–6 shorts.

### Sample 4-week calendar

| Week | Long asset | Short #1 | Short #2 | CTA |
|---|---|---|---|---|
| 1 | "The 8 junk fees on every car deal — and what each should cost" | "Nitrogen-filled tires: the $199 air" | "What 'doc fee' is actually legal in your state" | Free Red-Flag Scan |
| 2 | "How the finance office makes more than the salesperson" | "GAP insurance: keep or cancel?" | "Payment-packing: when the monthly hides the markup" | Deal Check |
| 3 | "Subprime vs. prime: what a few credit points really costs on a car" | "Why the dealer wants you to finance through them" | "The score tier that changes your rate" | Credit-to-Keys |
| 4 | "Walk-away stories: deals we told buyers to leave" | "Red / Yellow / Green: how we score a deal" | "One buyer, $2,400 saved in 20 minutes" | Free Red-Flag Scan |

**Channels (priority order):** organic short-form video (the walk-away and
fee-exposé content performs), an email list seeded by the free scan, and SEO on
fear-keyword long pieces ("is my doc fee legal," "should I buy GAP insurance").
Paid acquisition only after the organic funnel converts — we don't buy traffic
into an unproven offer.

## 5. Funnel & metrics

```
Content / SEO ─▶ Free Red-Flag Scan ─▶ Deal Check ($) ─▶ Deal Rescue ($$)
                        │                                      │
                        └────────── 3–9 mo out ──▶ Credit-to-Keys ($/mo) ──▶ Buyer Advocate ($$)
```

Track per stage: scan starts → completes, scan → Deal Check conversion, Deal
Check → higher-tier upsell, Credit-to-Keys waitlist → intake → active, and stage
conversion within Credit-to-Keys (Prepare → Qualify → Buy). The north-star is
**dollars saved for buyers**, surfaced as testimonials — it is both the marketing
asset and the proof the trust promise is real.

## 6. Non-negotiable guardrails

These bind GTM exactly as they bind engineering (see ROADMAP §Guardrails). Copy,
pricing, and partnerships must never violate them:

1. **Strictly buyer-side.** No revenue from, or steering toward, dealers,
   lenders, F&I, or warranty sellers — ever. No affiliate deals that compromise
   this, no matter how lucrative.
2. **Decision support, not advice.** Persistent disclaimer everywhere a verdict
   or recommendation appears.
3. **No advance fee.** Credit-to-Keys and any paid service charge **only after
   delivery** — billed monthly in arrears for the credit work, flat fee for the
   car help, never a pre-paid bundle. Marketing must not imply otherwise.
4. **No false precision and no guarantees.** Every estimate is a range with a
   confidence level; we never promise a specific score increase or an exact
   "fair price."
