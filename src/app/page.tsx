import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/ui/Reveal";
import { SeverityScale } from "@/components/ui/SeverityScale";
import { MatrixCard } from "@/components/ui/MatrixCard";
import { MatrixIcon, type IconName } from "@/components/ui/icons";
import { FUNNELS, ACCENT_CLASSES, getFunnel, type Funnel } from "@/lib/funnels";
import { ProcessTimeline } from "@/components/funnels/ProcessTimeline";
import { FunnelIcon } from "@/components/funnels/icons";
import { TrustBar, CTASection, SectionHeading } from "@/components/funnels/primitives";

/**
 * Homepage — the buyer's command center. Leads with the buyer's situation, not a
 * service menu: a three-door journey router ("deal in hand", "still shopping",
 * "already signed") gets a stressed buyer to the right lane by recognizing where
 * they are, while Concierge stays a quiet apply-link for the few who want it
 * handled for them. Below the fold we still explain what each lane delivers.
 * Navy/white SaaS, one action color per lane, no fake social proof.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <AfterYouChoose />
        <Outcomes />
        <WhatEachDelivers />
        <TrustBar />
        <RedFlagMatrix />
        <CTASection
          accent="green"
          headline="Get the right deal. Every time."
          body="Start with a quote review, or choose the path that fits where you are. You make the final decision."
          cta="Review My Quote"
          href="/quote-review"
        />
      </main>
      <SiteFooter />
    </>
  );
}

/* ========================================================================== */
/*  HERO — BUYER-JOURNEY ROUTER (3 DOORS)                                       */
/* ========================================================================== */

/**
 * The three buyer states, in the order a buyer moves through them. Each door
 * reuses an existing funnel's accent + route, but leads with the buyer's
 * situation and an emotionally direct next step instead of a product name.
 */
interface BuyerDoor {
  /** Funnel to borrow the accent + icon from. */
  funnelId: string;
  /** Journey-router page this door opens into. */
  href: string;
  state: string;
  desc: string;
  cta: string;
}

const DOORS: BuyerDoor[] = [
  {
    funnelId: "quote-review",
    href: "/deal-in-hand",
    state: "I have a deal in front of me",
    desc: "Upload the quote, check the math, and get a pushback plan you can use right now.",
    cta: "Scan My Deal",
  },
  {
    funnelId: "build-my-plan",
    href: "/still-shopping",
    state: "I'm still shopping",
    desc: "Know your target price, payment, APR, and negotiation plan before you walk in.",
    cta: "Build My Buying Plan",
  },
  {
    funnelId: "post-sale-triage",
    href: "/already-signed",
    state: "I already signed",
    desc: "Understand what may be cancellable, disputable, or worth escalating — without panic.",
    cta: "Review My Options",
  },
];

function Hero() {
  const concierge = getFunnel("concierge");
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy to-navy" />
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="orb right-[-8rem] -top-20 h-[26rem] w-[26rem] bg-blue/25" />
        <div className="orb left-[-6rem] bottom-0 h-72 w-72 bg-gold/10" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-gold" />
              Buyer-side car-deal protection
            </span>
          </Reveal>
          <Reveal delay={60}>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
              The dealer has a team.{" "}
              <span className="text-gold">Now you do too.</span>
            </h1>
          </Reveal>
          <Reveal delay={120}>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Before you sign, we check the price, fees, financing, add-ons,
              trade-in, and paperwork — so you know what to push back on, and what
              to walk away from.
            </p>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <p className="mt-12 text-center text-sm font-bold uppercase tracking-[0.18em] text-white/60">
            Where are you in the car-buying process?
          </p>
        </Reveal>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {DOORS.map((door, i) => {
            const funnel = getFunnel(door.funnelId);
            if (!funnel) return null;
            return (
              <Reveal key={door.funnelId} delay={200 + i * 80}>
                <BuyerDoorCard door={door} funnel={funnel} />
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={460}>
          <div className="mt-8 flex flex-col items-center gap-3 pb-12 text-center">
            {concierge && (
              <p className="text-sm text-white/70">
                Want us to handle the whole process?{" "}
                <Link href={concierge.route} className="font-semibold text-gold hover:underline">
                  Apply for Concierge →
                </Link>
              </p>
            )}
            <p className="text-sm text-white/65">
              Just want market pricing?{" "}
              <Link href="/market-check" className="font-semibold text-blue-soft hover:underline">
                Check the Market →
              </Link>
            </p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-white/50">
              We do not sell cars, loans, or warranties. We only sit on the
              buyer&apos;s side.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * A single buyer-state door. The whole card is the link (big tap target); the
 * CTA at the bottom is a styled span so we don't nest anchors.
 */
function BuyerDoorCard({ door, funnel }: { door: BuyerDoor; funnel: Funnel }) {
  const a = ACCENT_CLASSES[funnel.accent];
  return (
    <Link
      href={door.href}
      className="group flex h-full flex-col rounded-2xl border border-edge bg-white p-6 text-ink shadow-card transition hover:-translate-y-1 hover:shadow-lg"
    >
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
        <FunnelIcon name={funnel.heroIcon} className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-xl font-extrabold leading-snug text-navy">{door.state}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{door.desc}</p>
      <span className={`${a.btn} mt-5 w-full text-sm`}>{door.cta}</span>
    </Link>
  );
}

/* ========================================================================== */
/*  WHAT HAPPENS AFTER YOU CHOOSE A PATH                                       */
/* ========================================================================== */

function AfterYouChoose() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">
              What happens after you choose a path
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-slate">
              Each lane collects the right details, produces a specific deliverable, and
              points you to the best next step.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-4">
          {FUNNELS.map((f, i) => {
            const a = ACCENT_CLASSES[f.accent];
            return (
              <Reveal key={f.id} delay={i * 60}>
                <div className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
                    <FunnelIcon name={f.heroIcon} className="h-5 w-5" />
                  </span>
                  <p className={`mt-3 text-xs font-bold uppercase tracking-wide ${a.text}`}>
                    {f.homeEyebrow}
                  </p>
                  <h3 className="mt-0.5 text-base font-bold text-navy">{f.homeTitle}</h3>
                  <div className="mt-4 flex-1">
                    <ProcessTimeline steps={f.steps} accent={f.accent} variant="compact" />
                  </div>
                  <Link
                    href={f.route}
                    className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${a.text} hover:underline`}
                  >
                    {f.homeCta} →
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  OUTCOMES & NEXT STEPS                                                      */
/* ========================================================================== */

function Outcomes() {
  return (
    <section className="border-y border-edge bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Reveal>
          <h2 className="text-center text-xs font-bold uppercase tracking-[0.18em] text-slate">
            Outcomes &amp; next steps
          </h2>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FUNNELS.map((f, i) => {
            const a = ACCENT_CLASSES[f.accent];
            return (
              <Reveal key={f.id} delay={i * 60}>
                <div className={`h-full rounded-2xl ${a.soft} p-5`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white ${a.softText} shadow-sm`}>
                    <FunnelIcon name={f.heroIcon} className="h-5 w-5" />
                  </span>
                  <p className={`mt-3 text-sm font-bold ${a.textDark}`}>{f.outcome.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">{f.outcome.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  WHAT EACH PATH DELIVERS                                                    */
/* ========================================================================== */

function WhatEachDelivers() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <SectionHeading sub="A specific, useful deliverable for every lane — not a generic contact form.">
            What each path delivers
          </SectionHeading>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FUNNELS.map((f, i) => {
            const a = ACCENT_CLASSES[f.accent];
            return (
              <Reveal key={f.id} delay={i * 60}>
                <div className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card">
                  <span aria-hidden className={`h-1 w-12 rounded-full ${a.bar}`} />
                  <h3 className="mt-4 text-base font-bold text-navy">{f.homeTitle}</h3>
                  <ul className="mt-3 flex-1 space-y-2">
                    {f.deliverables.slice(0, 4).map((d) => (
                      <li key={d.label} className="flex items-start gap-2 text-sm text-ink">
                        <span className={`mt-0.5 ${a.softText}`}>
                          <FunnelIcon name={d.icon} className="h-4 w-4" />
                        </span>
                        {d.label}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={f.route}
                    className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${a.text} hover:underline`}
                  >
                    Learn more →
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  RED FLAG MATRIX — compact                                                  */
/* ========================================================================== */

const MATRIX: { title: string; icon: IconName; body: string; detail: string }[] = [
  { title: "Price", icon: "tag", body: "Markups and out-the-door numbers that do not add up.", detail: "a “market adjustment” quietly baked into the out-the-door number." },
  { title: "Fees", icon: "receipt", body: "Doc, prep, nitrogen, VIN-etch, and vague dealer padding.", detail: "dealer-installed packages bundled in as if they were mandatory." },
  { title: "Financing", icon: "percent", body: "APR markup, stretched terms, and payment packing.", detail: "the payment looks right, but the APR is marked up over what you qualify for." },
  { title: "Trade-in", icon: "swap", body: "Lowball values and buried negative-equity games.", detail: "a lowball trade with your negative equity rolled into the new loan." },
  { title: "Warranty & F&I", icon: "shield", body: "Overpriced VSCs, GAP, tire/wheel, and add-on bundles.", detail: "a VSC or protection bundle priced at 2–3× cost and pitched “only $X a month.”" },
  { title: "Used-car risk", icon: "car", body: "Condition, history, title, and mileage red flags.", detail: "title, history, or mileage issues that surface only after you sign." },
  { title: "Contract mismatch signals", icon: "doc", body: "Signed terms that drift from the quote you agreed to.", detail: "numbers on the signed contract that drift from the quote you agreed to." },
  { title: "Pressure tactics", icon: "bolt", body: "Spot delivery, rushed signing, and today-only claims.", detail: "spot delivery and “today only” urgency engineered to rush your signature." },
];

function RedFlagMatrix() {
  return (
    <section id="what-we-catch" className="scroll-mt-20 border-t border-edge bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
            Proprietary diagnostic
          </span>
          <h2 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">
            The Driveway Red Flag Matrix&trade;
          </h2>
          <p className="mt-2 max-w-2xl text-slate">
            Every review checks the places buyers most often get worked — then gives you a
            plain-English call.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MATRIX.map((m, i) => (
            <Reveal key={m.title} delay={(i % 4) * 60}>
              <MatrixCard
                index={i + 1}
                title={m.title}
                body={m.body}
                detail={m.detail}
                icon={<MatrixIcon name={m.icon} />}
              />
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate">
              Every check ends on a clear verdict
            </p>
            <SeverityScale />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
