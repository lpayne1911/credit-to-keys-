import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/ui/Reveal";
import { DealScoreMockup } from "@/components/ui/DealScoreMockup";
import { FloatingArtifact } from "@/components/ui/FloatingArtifact";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { TrustPill } from "@/components/ui/TrustPill";
import { SeverityScale } from "@/components/ui/SeverityScale";
import { MatrixCard } from "@/components/ui/MatrixCard";
import { StickyCTA } from "@/components/ui/StickyCTA";
import { MatrixIcon } from "@/components/ui/icons";

/**
 * Homepage as a buyer-TRIAGE system, not a product catalog.
 *
 * Order (single hierarchy, mobile === desktop):
 *   1 Hero  2 "Where are you in the deal?" router  3 Sample report
 *   4 Trust  5 At-the-dealership  6 Full Deal Check (recommended first step)
 *   7 Focused checks (secondary)  8 Human review  9 Already signed
 *   10 Not-at-the-desk-yet (Help me buy + Credit-to-Keys)  11 Red Flag Matrix
 *   12 How it works  13 Final CTA + disclaimer
 *
 * Gold means primary conversion only. Free Full Deal Check is the dominant path;
 * focused checks and paid pathways read as secondary.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col overflow-x-clip">
        <Hero />
        <SituationRouter />
        <SampleReport />
        <TrustBand />
        <AtTheDealership />
        <FullDealCheckSection />
        <FocusedChecks />
        <HumanReviewSection />
        <AlreadySignedSection />
        <EarlierJourney />
        <RedFlagMatrix />
        <HowItWorks />
        <FinalCta />
        {/* Reserve room so the mobile sticky CTA never covers the final content. */}
        <div className="h-20 sm:hidden" aria-hidden />
      </main>
      <SiteFooter />
      <StickyCTA />
    </>
  );
}

/* ========================================================================== */
/*  HERO                                                                       */
/* ========================================================================== */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden noise">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream to-cream" />
        <div className="absolute inset-0 bg-grid mask-fade-b opacity-70" />
        <div className="orb -left-24 -top-24 h-[28rem] w-[28rem] bg-gold/20" />
        <div className="orb right-[-10rem] top-10 h-[30rem] w-[30rem] bg-paleblue/70" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-14 pt-12 sm:pt-18 lg:grid-cols-[1.05fr_1fr] lg:pb-20">
        {/* Copy column */}
        <div className="min-w-0">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-gold" />
              Buyer-side car-deal protection
            </span>
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mt-5 font-serif text-[2.6rem] font-semibold leading-[1.05] text-navy sm:text-6xl">
              Don&apos;t sign a car deal until someone{" "}
              <span className="relative whitespace-normal text-gold-dark sm:whitespace-nowrap">
                checks the math
                <svg
                  className="absolute -bottom-2 left-0 hidden h-3 w-full text-gold/50 sm:block"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 9C75 3 150 3 298 6"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              .
            </h1>
          </Reveal>

          <Reveal delay={120}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate">
              Upload your dealer quote, buyer&apos;s order, payment worksheet, or
              warranty menu. We flag hidden fees, inflated payments, junk add-ons,
              and finance-office traps before you sign.
            </p>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/check" className="btn-primary text-base">
                Check my deal before I sign
              </Link>
              <Link href="/deal-rescue" className="btn-secondary text-base">
                I already signed — what now?
              </Link>
            </div>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
              <span className="inline-flex items-center gap-1.5">
                <Check /> Free first scan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check /> No account needed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check /> About a minute
              </span>
            </p>
          </Reveal>
        </div>

        {/* Mockup column */}
        <Reveal delay={160} className="relative min-w-0">
          <div className="relative mx-auto flex max-w-md justify-center lg:max-w-none">
            <DealScoreMockup />

            <FloatingArtifact
              className="-left-12 -top-5 hidden lg:block"
              tilt={8}
              float="slow"
              delay={0.9}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
                <span className="text-gold-dark">＄</span> Savings: $1,400–$2,900
              </span>
            </FloatingArtifact>

            <FloatingArtifact
              className="-right-12 -top-3 hidden lg:block"
              tilt={-12}
              float="slow"
              delay={1.2}
            >
              <RiskBadge tone="warning">APR markup risk</RiskBadge>
            </FloatingArtifact>

            <FloatingArtifact
              className="-right-20 bottom-16 hidden lg:block"
              tilt={-9}
              float="slower"
              delay={1.8}
            >
              <div className="w-40">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">
                  Dealer fee breakdown
                </p>
                <div className="mt-1.5 space-y-1 text-[11px] text-navy/70">
                  <Line label="Doc fee" value="$699" flag />
                  <Line label="Nitrogen" value="$199" flag />
                  <Line label="VIN etch" value="$299" flag />
                </div>
              </div>
            </FloatingArtifact>
          </div>
          <p className="mt-5 text-center">
            <Link
              href="/sample"
              className="text-sm font-semibold text-gold-dark hover:underline"
            >
              See a full sample report →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Line({
  label,
  value,
  flag = false,
}: {
  label: string;
  value: string;
  flag?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={flag ? "font-semibold text-flag-red" : "font-semibold"}>
        {value}
      </span>
    </div>
  );
}

/* ========================================================================== */
/*  SITUATION ROUTER — "Where are you in the deal?"                            */
/* ========================================================================== */

function SituationRouter() {
  return (
    <section id="where-are-you" className="relative scroll-mt-20 bg-cream-50">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
              Where are you in the deal?
            </h2>
            <p className="mt-3 text-slate">
              Tell us where you are and we&apos;ll point you the right way. Most
              buyers start with a free Full Deal Check.
            </p>
          </div>
        </Reveal>

        {/* Card 1 — dominant, free. */}
        <Reveal delay={80}>
          <div className="ring-gradient mt-10 overflow-hidden rounded-3xl bg-white shadow-glass">
            <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
              <div className="p-7 sm:p-9">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                  ★ Most buyers start here
                </span>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-navy sm:text-3xl">
                  I have paperwork from a dealer
                </h3>
                <p className="mt-2 max-w-md text-slate">
                  Check the quote, payment, fees, trade, warranty, and add-ons
                  before signing.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link href="/check" className="btn-primary">
                    Check my deal
                  </Link>
                  <span className="text-sm font-medium text-slate">
                    Free first scan · about a minute
                  </span>
                </div>
              </div>
              <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 p-8 lg:flex">
                <div className="orb right-0 top-0 h-48 w-48 bg-gold/25" aria-hidden />
                <div className="relative w-full max-w-xs space-y-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-cream/45">
                    What a Full Deal Check returns
                  </p>
                  <ScoreRow label="Price" status="Verify first" tone="verify" pct={62} />
                  <ScoreRow label="Fees" status="Push back" tone="warning" pct={30} />
                  <ScoreRow label="APR" status="Verify first" tone="verify" pct={55} />
                  <ScoreRow label="Warranty" status="Push back" tone="warning" pct={32} />
                  <ScoreRow label="Trade" status="Check equity" tone="verify" pct={58} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Cards 2–4 — secondary. */}
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <Reveal delay={120}>
            <SituationCard
              n={2}
              accent="orange"
              title="I already signed"
              body="Understand what may still be cancellable, what changed, and what to document."
              cta="Review my options"
              href="/deal-rescue"
            />
          </Reveal>
          <Reveal delay={180}>
            <SituationCard
              n={3}
              accent="blue"
              title="I'm still shopping"
              body="Get a target price, negotiation plan, and paperwork review before you start talking numbers."
              cta="Help me buy"
              href="/services"
            />
          </Reveal>
          <Reveal delay={240}>
            <SituationCard
              n={4}
              accent="navy"
              title="My credit may cost me"
              body="3–9 months out? Prepare your credit before the finance office prices the deal around it."
              cta="Explore Credit-to-Keys"
              href="/credit-to-keys"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function SituationCard({
  n,
  accent,
  title,
  body,
  cta,
  href,
}: {
  n: number;
  accent: "orange" | "blue" | "navy";
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  const ring =
    accent === "orange"
      ? "text-flag-orange ring-flag-orange/25 bg-flag-orange/10"
      : accent === "blue"
        ? "text-navy ring-navy/15 bg-paleblue"
        : "text-navy ring-navy/15 bg-navy/5";
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-navy/10 bg-white/80 p-6 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-lift">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-1 ${ring}`}
      >
        {n}
      </span>
      <h3 className="mt-4 font-serif text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition group-hover:gap-2.5"
      >
        {cta}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}

function ScoreRow({
  label,
  status,
  tone,
  pct,
}: {
  label: string;
  status: string;
  tone: "safe" | "verify" | "warning" | "danger";
  pct: number;
}) {
  // Diagnostic palette: green = fair, blue = verify, amber = push back,
  // red = do not sign. Gold is never used here (brand action only).
  const bar =
    tone === "safe"
      ? "bg-verdict-green"
      : tone === "verify"
        ? "bg-verdict-blue"
        : tone === "warning"
          ? "bg-verdict-amber"
          : "bg-verdict-red";
  const text =
    tone === "safe"
      ? "text-verdict-green"
      : tone === "verify"
        ? "text-verdict-blue"
        : tone === "warning"
          ? "text-verdict-amber"
          : "text-verdict-red";
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-cream/85">{label}</span>
        <span className={text}>{status}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  SAMPLE REPORT — proof, not a confusing action point                       */
/* ========================================================================== */

const SAMPLE_FLAGS = [
  "Dealer fee padding",
  "APR / payment mismatch",
  "Warranty markup risk",
  "Trade equity concern",
];

function SampleReport() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1fr_1.05fr]">
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-cream-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              Sample report
            </span>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-navy sm:text-4xl">
              See what a real Deal Score looks like.
            </h2>
            <p className="mt-3 max-w-md text-slate">
              Every check ends on a plain-English verdict, the dollars at stake,
              and the exact lines to use at the desk. Here&apos;s a sample before
              you run your own.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/sample" className="btn-secondary">
                See a sample pushback script
              </Link>
            </div>
            <p className="mt-4">
              <Link
                href="/sample"
                className="text-sm font-semibold text-gold-dark hover:underline"
              >
                See a full sample report →
              </Link>
            </p>
          </div>
        </Reveal>

        {/* Sample card */}
        <Reveal delay={120}>
          <div className="mx-auto w-full max-w-md rounded-3xl border border-navy/10 bg-white p-6 shadow-glass">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
                  2021 Toyota Camry · sample
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-serif text-5xl font-bold text-verdict-amber">
                    64
                  </span>
                  <span className="text-sm font-semibold text-navy/40">/100</span>
                </div>
              </div>
              <RiskBadge tone="warning">Push back first</RiskBadge>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-flag-red via-verdict-amber to-flag-green" />

            <div className="mt-5 rounded-xl bg-gradient-to-br from-gold/10 to-paleblue/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">
                Potential savings spotted
              </p>
              <p className="font-serif text-2xl font-bold text-gold-dark">
                $1,400–$2,900
              </p>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate">
                Risk flags
              </p>
              <ul className="space-y-2">
                {SAMPLE_FLAGS.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 rounded-lg border border-navy/10 bg-cream-50 px-3 py-2 text-sm font-semibold text-navy"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-flag-orange" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  TRUST BAND                                                                 */
/* ========================================================================== */

function TrustBand() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950 text-cream">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        <div className="orb left-1/2 -top-28 h-56 w-[42rem] -translate-x-1/2 bg-gold/15" />
        <div className="orb left-1/4 top-10 h-72 w-72 bg-gold/15" />
        <div className="orb right-1/4 bottom-[-6rem] h-72 w-72 bg-paleblue/10" />
      </div>
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            The dealer has a team. Now you do too.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-cream/75 sm:text-lg">
            Dealers have finance managers, lenders, warranty reps, and trained
            closers. You get a buyer-side advocate that checks the math, flags
            the traps, and tells you what to push back on.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <TrustPill>No dealer kickbacks</TrustPill>
            <TrustPill>No lender commissions</TrustPill>
            <TrustPill>No warranty company payouts</TrustPill>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <div className="mt-8">
            <Link href="/check" className="btn-primary">
              Check my deal before I sign
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  AT THE DEALERSHIP RIGHT NOW                                                */
/* ========================================================================== */

function AtTheDealership() {
  const steps = [
    "Snap the paperwork",
    "Upload or answer a few questions",
    "Get your deal score",
    "Use the pushback script",
  ];
  return (
    <section className="relative overflow-hidden bg-navy-950 text-cream">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="orb left-[-6rem] top-1/3 h-80 w-80 bg-flag-orange/15" />
        <div className="orb right-[-4rem] bottom-0 h-72 w-72 bg-gold/15" />
      </div>

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-flag-orange/30 bg-flag-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-flag-orange">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-flag-orange" />
              Time-sensitive
            </span>
          </Reveal>
          <Reveal delay={60}>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-white sm:text-4xl">
              At the dealership right now? Slow the deal down.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-cream/75">
              Take a photo of the buyer&apos;s order, payment worksheet, warranty
              menu, or finance quote. We&apos;ll help you spot what to question
              before the paperwork becomes permanent.
            </p>
          </Reveal>
          <Reveal delay={180}>
            <ol className="mt-7 grid gap-3 sm:grid-cols-2">
              {steps.map((s, i) => (
                <li
                  key={s}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-sm font-bold text-gold-light">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold text-cream/90">{s}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={240}>
            <Link href="/check" className="btn-primary mt-7">
              Upload my paperwork now
            </Link>
          </Reveal>
        </div>

        <Reveal delay={140} className="relative">
          <PhoneMockup />
        </Reveal>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[18rem]">
      <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-gold/30 via-flag-orange/15 to-transparent blur-2xl" />

      <FloatingArtifact className="-left-10 top-10 hidden sm:block" tilt={14} float="slow">
        <div className="h-16 w-12 rounded-md bg-gradient-to-b from-white to-cream-100 p-1.5">
          <div className="h-1 w-8 rounded bg-navy/20" />
          <div className="mt-1 h-1 w-6 rounded bg-navy/15" />
          <div className="mt-1 h-1 w-7 rounded bg-navy/15" />
        </div>
      </FloatingArtifact>
      <FloatingArtifact
        className="-right-8 bottom-16 hidden sm:block"
        tilt={-14}
        float="slower"
        delay={1}
      >
        <div className="h-16 w-12 rounded-md bg-gradient-to-b from-white to-cream-100 p-1.5">
          <div className="h-1 w-7 rounded bg-navy/20" />
          <div className="mt-1 h-1 w-8 rounded bg-navy/15" />
          <div className="mt-1 h-1 w-5 rounded bg-flag-red/40" />
        </div>
      </FloatingArtifact>

      <div className="relative rounded-[2.4rem] border border-white/15 bg-navy-900 p-3 shadow-glass-dark">
        <div className="rounded-[1.9rem] bg-cream p-4">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-navy/15" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate">
            2021 Toyota Camry · scan
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-serif text-4xl font-bold text-verdict-amber">64</span>
            <span className="text-sm font-semibold text-navy/40">/100</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-flag-red via-verdict-amber to-flag-green" />
          <div className="mt-3 space-y-1.5">
            <RiskBadge tone="danger" className="w-full justify-start">
              Junk fee detected
            </RiskBadge>
            <RiskBadge tone="warning" className="w-full justify-start">
              Push back first
            </RiskBadge>
          </div>
          <div className="mt-3 rounded-lg bg-gradient-to-br from-gold/10 to-paleblue/50 px-3 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-slate">
              Potential savings
            </p>
            <p className="font-serif text-base font-bold text-gold-dark">
              $1,400–$2,900
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  FULL DEAL CHECK — recommended first step                                   */
/* ========================================================================== */

function FullDealCheckSection() {
  const includes = [
    "Price check",
    "Fee check",
    "APR / payment check",
    "Trade-in review",
    "Warranty / add-on scan",
    "Plain-English verdict",
  ];
  return (
    <section id="full-deal-check" className="relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
            Start with the Full Deal Check
          </h2>
          <p className="mt-2 max-w-2xl text-slate">
            The Full Deal Check reviews the whole deal first. If you only need one
            narrow issue checked, use a focused check below.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="ring-gradient mt-8 overflow-hidden rounded-3xl bg-white shadow-glass">
            <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
              <div className="relative p-7 sm:p-9">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                    ★ Recommended first step
                  </span>
                  <span className="text-2xl" aria-hidden>
                    🔎
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-2xl font-semibold text-navy sm:text-3xl">
                  Full Deal Check
                </h3>
                <p className="mt-2 max-w-md text-slate">
                  Best for buyers who are about to sign or already have a quote. We
                  score the whole deal and give you the numbers to use at the desk.
                </p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {includes.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-navy/80">
                      <Check /> {i}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href="/check" className="btn-primary">
                    Start free deal check
                  </Link>
                  <Link
                    href="/sample"
                    className="text-sm font-semibold text-gold-dark hover:underline"
                  >
                    See a sample report →
                  </Link>
                </div>
                <p className="mt-2 text-sm text-slate">
                  Free first scan · about a minute
                </p>
              </div>

              <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 p-8 lg:flex">
                <div className="orb right-0 top-0 h-48 w-48 bg-gold/25" aria-hidden />
                <div className="relative w-full max-w-xs space-y-3">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-cream/45">
                    What a Full Deal Check returns
                  </p>
                  <ScoreRow label="Price" status="Verify first" tone="verify" pct={62} />
                  <ScoreRow label="Fees" status="Push back" tone="warning" pct={30} />
                  <ScoreRow label="APR" status="Verify first" tone="verify" pct={55} />
                  <ScoreRow label="Warranty" status="Push back" tone="warning" pct={32} />
                  <ScoreRow label="Trade" status="Check equity" tone="verify" pct={58} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  FOCUSED CHECKS — secondary shortcuts                                       */
/* ========================================================================== */

const FOCUSED = [
  {
    emoji: "🛡️",
    title: "Warranty / service contract check",
    body: "Is the extended warranty / VSC / protection plan overpriced?",
    href: "/warranty-check",
  },
  {
    emoji: "📈",
    title: "APR / payment check",
    body: "Is the interest rate or monthly payment marked up?",
    href: "/apr-check",
  },
  {
    emoji: "🧾",
    title: "Add-ons / fees check",
    body: "Review GAP, tire/wheel, paint, doc fees, and add-ons.",
    href: "/add-on-check",
  },
];

function FocusedChecks() {
  return (
    <section className="relative bg-cream-100">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <Reveal>
          <h3 className="text-lg font-semibold text-navy">
            Only need one thing checked?
          </h3>
          <p className="mt-1 text-sm text-slate">
            Focused shortcuts for a single issue. The Full Deal Check above is the
            better starting point for most buyers.
          </p>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {FOCUSED.map((f, i) => (
            <Reveal key={f.href} delay={i * 60}>
              <Link
                href={f.href}
                className="group flex h-full flex-col rounded-xl border border-navy/10 bg-white/70 p-5 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-card"
              >
                <span className="text-xl" aria-hidden>
                  {f.emoji}
                </span>
                <p className="mt-2 text-sm font-bold text-navy">{f.title}</p>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-slate">
                  {f.body}
                </p>
                <p className="mt-3 text-[11px] font-medium text-slate/80">
                  ~30 sec · instant scan
                </p>
                <p className="text-[11px] text-slate/70">
                  Human review available after scan
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  HUMAN REVIEW                                                               */
/* ========================================================================== */

function HumanReviewSection() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <Reveal>
          <div className="flex flex-col gap-5 rounded-2xl border border-navy/10 bg-cream-50 p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" aria-hidden>
                  🧑‍⚖️
                </span>
                <h3 className="font-serif text-xl font-semibold text-navy">
                  Human review
                </h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                Want a real advocate to look at the deal? Submit your paperwork for
                human review after the scan, or request it directly. Turnaround
                depends on volume; rush review may be available.
              </p>
              <p className="mt-2 text-[11px] font-medium text-slate/80">
                ~2 min to submit · human review
              </p>
            </div>
            <Link href="/human-review" className="btn-secondary shrink-0">
              Request human review
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  ALREADY SIGNED / DEAL RESCUE                                               */
/* ========================================================================== */

function AlreadySignedSection() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-12 sm:pb-14">
        <Reveal>
          <div className="flex flex-col gap-5 rounded-2xl border border-flag-orange/25 bg-flag-orange/[0.04] p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl" aria-hidden>
                  🆘
                </span>
                <h3 className="font-serif text-xl font-semibold text-navy">
                  Already signed / deal rescue
                </h3>
              </div>
              <p className="mt-2 text-sm font-semibold text-navy/80">
                &ldquo;I already signed and now I think something is wrong.&rdquo;
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate">
                Understand what may still be cancellable, what changed, and what to
                document.
              </p>
            </div>
            <Link href="/deal-rescue" className="btn-secondary shrink-0">
              I already signed
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  NOT AT THE SIGNING DESK YET — Help me buy + Credit-to-Keys                 */
/* ========================================================================== */

function EarlierJourney() {
  return (
    <section className="relative overflow-hidden bg-cream-100">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
            Not at the signing desk yet?
          </h2>
          <p className="mt-2 max-w-2xl text-slate">
            Get ahead of the finance office before you ever start talking numbers.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <Reveal delay={80}>
            <EarlierCard
              emoji="🧭"
              title="Help me buy"
              body="For buyers who are still shopping and want a target price, negotiation strategy, and deal review before they start."
              cta="Get buying help"
              href="/services"
            />
          </Reveal>
          <Reveal delay={140}>
            <EarlierCard
              emoji="🔑"
              title="Credit-to-Keys"
              body="For buyers 3–9 months out who need to improve approval odds, rate position, or buying readiness before shopping."
              cta="Explore Credit-to-Keys"
              href="/credit-to-keys"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function EarlierCard({
  emoji,
  title,
  body,
  cta,
  href,
}: {
  emoji: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="group flex h-full flex-col rounded-2xl border border-navy/10 bg-white/80 p-6 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-lift sm:p-7">
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-2xl ring-1 ring-navy/10"
        aria-hidden
      >
        {emoji}
      </span>
      <h3 className="mt-4 font-serif text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition group-hover:gap-2.5"
      >
        {cta}
        <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
          →
        </span>
      </Link>
    </div>
  );
}

/* ========================================================================== */
/*  RED FLAG MATRIX — compact                                                  */
/* ========================================================================== */

const MATRIX = [
  {
    title: "Price",
    icon: "tag",
    body: "Markups and out-the-door numbers that do not add up.",
    detail:
      "a “market adjustment” or accessory markup quietly baked into the out-the-door number.",
  },
  {
    title: "Fees",
    icon: "receipt",
    body: "Doc, prep, nitrogen, VIN-etch, and vague dealer padding.",
    detail:
      "dealer-installed packages — nitrogen, etch, recon — bundled in as if they were mandatory.",
  },
  {
    title: "Financing",
    icon: "percent",
    body: "APR markup, stretched terms, and payment packing.",
    detail:
      "the payment looks right, but the APR is marked up over what you qualify for, or the term is stretched.",
  },
  {
    title: "Trade-in",
    icon: "swap",
    body: "Lowball values and buried negative-equity games.",
    detail:
      "a lowball trade with your negative equity quietly rolled into the new loan.",
  },
  {
    title: "Warranty & F&I",
    icon: "shield",
    body: "Overpriced VSCs, GAP, tire/wheel, and add-on bundles.",
    detail:
      "a VSC, GAP, or protection bundle priced at 2–3× cost and pitched as “only $X a month.”",
  },
  {
    title: "Used-car risk",
    icon: "car",
    body: "Condition, history, title, and mileage red flags.",
    detail:
      "title, history, or mileage issues that do not surface until after you have signed.",
  },
  {
    title: "Contract mismatch signals",
    icon: "doc",
    body: "Signed terms that drift from the quote you agreed to.",
    detail:
      "numbers on the signed contract that drift from the quote you agreed to.",
  },
  {
    title: "Pressure tactics",
    icon: "bolt",
    body: "Spot delivery, rushed signing, and today-only claims.",
    detail:
      "spot delivery and “today only” urgency engineered to rush your signature.",
  },
] as const;

function RedFlagMatrix() {
  return (
    <section
      id="what-we-catch"
      className="relative scroll-mt-20 overflow-hidden bg-white"
    >
      <div aria-hidden className="absolute inset-0 bg-grid opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-cream-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
            Proprietary diagnostic
          </span>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-navy sm:text-4xl">
            The Driveway Red Flag Matrix&trade;
          </h2>
          <p className="mt-2 max-w-2xl text-slate">
            Every review checks the places buyers most often get worked — then
            gives you a plain-English call.
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
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/sample"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark hover:underline"
            >
              See what we check →
            </Link>
          </div>
        </Reveal>

        <Reveal delay={160}>
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

/* ========================================================================== */
/*  HOW IT WORKS                                                               */
/* ========================================================================== */

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Upload or tap in the offer",
      body: "Snap a photo of the quote, or tap through a few questions — no forms.",
    },
    {
      n: 2,
      title: "Get your Deal Score",
      body: "See whether to sign, push back, or walk — with a fairness read on every line.",
    },
    {
      n: 3,
      title: "Push back with confidence",
      body: "Plain-English flags and the exact numbers to use with the dealer.",
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-cream-50">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
            How it works
          </h2>
          <p className="mt-2 text-slate">Three steps. About a minute.</p>
        </Reveal>

        <div className="relative mt-10 grid gap-6 sm:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-9 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent sm:block"
          />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90} className="relative">
              <div className="group h-full rounded-2xl border border-navy/10 bg-white/80 p-6 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-b from-gold to-gold-dark font-serif text-xl font-bold text-white shadow-glow">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  FINAL CTA + DISCLAIMER                                                     */
/* ========================================================================== */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 text-cream">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="orb left-1/2 top-[-6rem] h-64 w-[40rem] -translate-x-1/2 bg-gold/15" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
            Before you sign, get the numbers checked.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-cream/75">
            Free first scan, no account needed, about a minute. You always make
            the final decision.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/check" className="btn-primary text-base">
              Check my deal before I sign
            </Link>
            <Link href="/deal-rescue" className="btn-ghost-light text-base">
              I already signed — what now?
            </Link>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-10 max-w-2xl text-xs leading-relaxed text-cream/55">
            Driveway Advocate provides decision support, not legal or financial
            advice. We help buyers understand risk signals before they sign — and
            we never take money from dealers, lenders, or warranty companies.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  SMALL SHARED BITS                                                          */
/* ========================================================================== */

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gold-dark" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M6 10.5l2.5 2.5L14 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
