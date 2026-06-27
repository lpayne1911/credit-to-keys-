import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/products/ProductCard";
import { PRODUCTS, FREE_DEAL_INSPECTOR } from "@/lib/products/product-catalog";
import { Reveal } from "@/components/ui/Reveal";
import { DealScoreMockup } from "@/components/ui/DealScoreMockup";
import { FloatingArtifact } from "@/components/ui/FloatingArtifact";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { TrustPill } from "@/components/ui/TrustPill";
import { SeverityScale } from "@/components/ui/SeverityScale";
import { MatrixCard } from "@/components/ui/MatrixCard";
import { StickyCTA } from "@/components/ui/StickyCTA";
import { MatrixIcon } from "@/components/ui/icons";

export default function LandingPage() {
  const secondary = PRODUCTS.filter((p) => p.id !== "deal-inspector");

  return (
    <>
      <SiteHeader />
      <main className="overflow-x-clip">
        <Hero />
        <TrustBand />
        <ProductSection secondary={secondary} />
        <RedFlagMatrix />
        <AtTheDealership />
        <HowItWorks />
        <ProofSection />
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
      {/* Layered background system */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream to-cream" />
        <div className="absolute inset-0 bg-grid mask-fade-b opacity-70" />
        <div className="orb -left-24 -top-24 h-[28rem] w-[28rem] bg-gold/20" />
        <div className="orb right-[-10rem] top-10 h-[30rem] w-[30rem] bg-paleblue/70" />
        <div className="orb left-1/3 top-1/2 h-72 w-72 bg-flag-orange/10" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
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
              Don&apos;t sign a car deal until{" "}
              <span className="relative whitespace-normal text-gold-dark sm:whitespace-nowrap">
                someone checks the math
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
              warranty menu. Driveway Advocate flags hidden fees, inflated
              payments, junk add-ons, and finance-office traps — and tells you
              whether to <strong className="text-navy">sign, push back, or walk away</strong>.
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
                <Check /> Takes about a minute
              </span>
            </p>
          </Reveal>
        </div>

        {/* Mockup column with floating artifacts */}
        <Reveal delay={160} className="relative min-w-0">
          <div className="relative mx-auto flex max-w-md justify-center lg:max-w-none">
            <DealScoreMockup />

            {/* Floating deal artifacts (decorative, hidden on small screens) */}
            <FloatingArtifact
              className="-left-6 top-6 hidden md:block"
              tilt={10}
              float="slow"
            >
              <RiskBadge tone="danger">Junk fee detected</RiskBadge>
            </FloatingArtifact>

            <FloatingArtifact
              className="-right-4 top-24 hidden md:block"
              tilt={-12}
              float="slower"
              delay={1.2}
            >
              <RiskBadge tone="warning">APR markup risk</RiskBadge>
            </FloatingArtifact>

            <FloatingArtifact
              className="-left-10 bottom-28 hidden lg:block"
              tilt={8}
              float="slower"
              delay={0.6}
            >
              <RiskBadge tone="warning">Warranty overpriced</RiskBadge>
            </FloatingArtifact>

            <FloatingArtifact
              className="-right-8 bottom-10 hidden md:block"
              tilt={-9}
              float="slow"
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

            <FloatingArtifact
              className="left-10 -top-6 hidden lg:block"
              tilt={6}
              float="slow"
              delay={0.9}
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy">
                <span className="text-gold-dark">＄</span> Savings: $1,400–$2,900
              </span>
            </FloatingArtifact>
          </div>
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
/*  TRUST BAND                                                                 */
/* ========================================================================== */

function TrustBand() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-cream">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="orb left-1/4 -top-20 h-72 w-72 bg-gold/20" />
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
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  PRODUCT SECTION                                                            */
/* ========================================================================== */

function ProductSection({ secondary }: { secondary: typeof PRODUCTS }) {
  const includes = [
    "Price check",
    "Fee check",
    "APR / payment check",
    "Trade-in review",
    "Warranty / add-on scan",
    "Plain-English verdict",
  ];
  return (
    <section id="products" className="relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
            Start here
          </h2>
          <p className="mt-2 max-w-2xl text-slate">
            The Full Deal Check reviews everything. Only need one thing looked
            at? Jump straight to a focused check below.
          </p>
        </Reveal>

        {/* Featured: Full Deal Check */}
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
                  Best for buyers who are about to sign or already have a quote.
                  The whole deal, scored, with the numbers you can use at the
                  desk.
                </p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {includes.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-navy/80">
                      <Check /> {i}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link href={FREE_DEAL_INSPECTOR.route} className="btn-primary">
                    Start free deal check
                  </Link>
                  <span className="text-sm text-slate">
                    Free first scan · about a minute
                  </span>
                </div>
              </div>

              {/* Visual side */}
              <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 p-8 lg:flex">
                <div className="orb right-0 top-0 h-48 w-48 bg-gold/25" aria-hidden />
                <div className="relative w-full max-w-xs space-y-3">
                  <ScoreRow label="Price" tone="safe" pct={88} />
                  <ScoreRow label="Fees" tone="danger" pct={32} />
                  <ScoreRow label="Financing" tone="warning" pct={54} />
                  <ScoreRow label="Trade-in" tone="warning" pct={61} />
                  <ScoreRow label="Warranty" tone="danger" pct={28} />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Secondary cards */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {secondary.map((p, i) => (
            <Reveal key={p.id} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-sm text-slate">
          Earlier in the journey?{" "}
          <Link href="/services" className="font-semibold text-gold-dark hover:underline">
            Help me buy
          </Link>{" "}
          ·{" "}
          <Link href="/credit-to-keys" className="font-semibold text-gold-dark hover:underline">
            Fix my credit first
          </Link>
        </p>
      </div>
    </section>
  );
}

function ScoreRow({
  label,
  tone,
  pct,
}: {
  label: string;
  tone: "safe" | "warning" | "danger";
  pct: number;
}) {
  const bar =
    tone === "safe"
      ? "bg-flag-green"
      : tone === "warning"
        ? "bg-verdict-amber"
        : "bg-flag-red";
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-semibold text-cream/80">
        <span>{label}</span>
        <span className="text-cream/50">{pct}/100</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  RED FLAG MATRIX                                                            */
/* ========================================================================== */

const MATRIX = [
  {
    title: "Price",
    icon: "tag",
    body: "Markups, market adjustments, and out-the-door numbers that do not add up.",
    detail:
      "We compare the price against fair-range estimates and rebuild the out-the-door total line by line.",
  },
  {
    title: "Fees",
    icon: "receipt",
    body: "Doc, prep, nitrogen, VIN-etch, reconditioning, and vague dealer padding.",
    detail:
      "Each fee is sorted into junk, negotiable, or legitimate government — with clawback ranges where they apply.",
  },
  {
    title: "Financing",
    icon: "percent",
    body: "APR markup, stretched terms, payment packing, and lender mismatch.",
    detail:
      "We check your rate against what your credit band typically qualifies for and surface the real total interest.",
  },
  {
    title: "Trade-in",
    icon: "swap",
    body: "Lowball values, negative equity games, and buried payoff issues.",
    detail:
      "We separate your trade value from negative equity so it cannot be quietly rolled into the payment.",
  },
  {
    title: "Warranty & F&I",
    icon: "shield",
    body: "Overpriced VSCs, GAP, tire/wheel, maintenance, and add-on bundles.",
    detail:
      "Each product is priced against a fair range with a counter-offer line — as a range, never a fake exact price.",
  },
  {
    title: "Used-car risk",
    icon: "car",
    body: "Condition, history, title, mileage, and ownership red flags.",
    detail:
      "We surface the title, history, and mileage questions to ask before a used car becomes your problem.",
  },
  {
    title: "Contract & legal",
    icon: "doc",
    body: "Terms that do not match the quote or raise legal / consumer-protection concerns.",
    detail:
      "We flag where the signed contract drifts from what you were told and where to slow down.",
  },
  {
    title: "Pressure tactics",
    icon: "bolt",
    body: "Spot delivery, rushed signing, today-only claims, and finance-office traps.",
    detail:
      "We name the closing moves as they happen so a rushed signature does not become permanent.",
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
            Every review runs your deal through the eight places buyers most
            often get worked — and ends with a plain-English call.
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
          <div className="mt-10">
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

        {/* Glowing phone mockup with floating document scans */}
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

      {/* floating doc scans */}
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

      {/* phone */}
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
      body: "See whether to sign, negotiate, or walk away — with a fairness read on every line.",
    },
    {
      n: 3,
      title: "Push back with confidence",
      body: "Plain-English flags and the exact numbers to use with the dealer.",
    },
  ];
  return (
    <section id="how-it-works" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
            How it works
          </h2>
          <p className="mt-2 text-slate">Three steps. About a minute.</p>
        </Reveal>

        <div className="relative mt-10 grid gap-6 sm:grid-cols-3">
          {/* connector line */}
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

        <Reveal delay={120}>
          <div className="mt-10">
            <Link href="/check" className="btn-primary">
              Upload my deal
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  PROOF SECTION                                                              */
/* ========================================================================== */

const PROFIT_CENTERS = [
  "Payment packing",
  "APR markup",
  "Junk fees",
  "Warranty overpricing",
  "Add-on stuffing",
  "Trade equity manipulation",
  "Spot delivery issues",
  "Contract mismatch",
];

function ProofSection() {
  return (
    <section className="relative overflow-hidden bg-cream-100">
      <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="max-w-2xl font-serif text-3xl font-semibold text-navy sm:text-4xl">
            Built around the places dealers hide profit.
          </h2>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PROFIT_CENTERS.map((p, i) => (
            <Reveal key={p} delay={(i % 4) * 60}>
              <div className="flex h-full items-center gap-2.5 rounded-xl border border-navy/10 bg-white/80 px-4 py-3.5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-card">
                <span className="h-2 w-2 shrink-0 rounded-full bg-gold" />
                <span className="text-sm font-semibold text-navy">{p}</span>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <p className="mt-10 max-w-3xl text-sm leading-relaxed text-slate">
            <span className="font-semibold text-navy/80">
              Driveway Advocate provides decision support, not legal or financial
              advice.
            </span>{" "}
            We help buyers understand risk signals before they sign — and we never
            take money from dealers, lenders, or warranty companies.
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
