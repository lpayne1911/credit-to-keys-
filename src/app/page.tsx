import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/ui/Reveal";
import { SeverityScale } from "@/components/ui/SeverityScale";
import { MatrixCard } from "@/components/ui/MatrixCard";
import { MatrixIcon, type IconName } from "@/components/ui/icons";
import { StickyCTA } from "@/components/ui/StickyCTA";

/**
 * Homepage — modern buyer-advocacy SaaS / deal-defense dashboard.
 *
 * Funnel colors teach the path: GREEN quote review, BLUE shopping support,
 * GOLD concierge. Navy = trust/authority. Red/orange = risk only. Clean white
 * cards on a light-gray background; sans-first, bold, app-like.
 *
 * Order: hero + 3 route cards → trust bar → what we help you avoid →
 * Target Deal Sheet sample → 3 Paths → customer journey funnels →
 * service examples → Red Flag Matrix → final CTA + disclaimer.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-col">
        <Hero />
        <TrustBar />
        <WhatWeAvoid />
        <TargetDealSheet />
        <ThreePaths />
        <CustomerJourney />
        <ServiceExamples />
        <RedFlagMatrix />
        <FinalCta />
        {/* Reserve space so the mobile sticky CTA never covers final content. */}
        <div className="h-20 sm:hidden" aria-hidden />
      </main>
      <SiteFooter />
      <StickyCTA />
    </>
  );
}

/* ========================================================================== */
/*  HERO + 3 ROUTE CARDS                                                       */
/* ========================================================================== */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy to-navy" />
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="orb right-[-8rem] -top-20 h-[26rem] w-[26rem] bg-blue/25" />
        <div className="orb left-[-6rem] bottom-0 h-72 w-72 bg-gold/10" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-14 sm:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
                <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-gold" />
                Buyer-side car-deal protection
              </span>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
                Don&apos;t sign a bad car deal.
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
                We review car deals, expose junk fees, benchmark the price, and
                help you push back before you drive off the lot.
              </p>
            </Reveal>
            <Reveal delay={180}>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/check" className="btn-green">
                  Review my quote
                </Link>
                <Link href="/deal-rescue" className="btn-outline-light px-5 py-3 text-base">
                  I already signed — what now?
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Deal review summary mockup */}
          <Reveal delay={140}>
            <DealSummaryCard />
          </Reveal>
        </div>

        {/* 3 route cards */}
        <div className="mt-12 grid gap-5 pb-14 md:grid-cols-3">
          <Reveal delay={60}>
            <RouteCard
              accent="green"
              title="I have a quote from a dealer"
              body="Send it to us. We'll review the numbers before you sign."
              cta="Review my quote"
              href="/check"
              note="Free first scan"
            />
          </Reveal>
          <Reveal delay={120}>
            <RouteCard
              accent="blue"
              title="I know what I want, but want to be prepared"
              body="Get your target price, fee checklist, and negotiation game plan."
              cta="Help me shop"
              href="/services"
              note="Flat-fee pricing"
            />
          </Reveal>
          <Reveal delay={180}>
            <RouteCard
              accent="gold"
              title="I want someone to handle this for me"
              body="We source, negotiate, and handle the heavy lifting for you."
              cta="Handle it for me"
              href="/services"
              note="Concierge service"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const ACCENTS = {
  green: {
    chip: "text-green-dark",
    icon: "bg-green-soft text-green-dark",
    btn: "btn-green",
    bar: "bg-green",
  },
  blue: {
    chip: "text-blue-dark",
    icon: "bg-blue-soft text-blue-dark",
    btn: "btn-blue",
    bar: "bg-blue",
  },
  gold: {
    chip: "text-gold-dark",
    icon: "bg-gold-soft text-gold-dark",
    btn: "btn-gold",
    bar: "bg-gold",
  },
} as const;

type Accent = keyof typeof ACCENTS;

function RouteCard({
  accent,
  title,
  body,
  cta,
  href,
  note,
}: {
  accent: Accent;
  title: string;
  body: string;
  cta: string;
  href: string;
  note: string;
}) {
  const a = ACCENTS[accent];
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-white p-6 text-ink shadow-card">
      <span aria-hidden className={`h-1 w-12 rounded-full ${a.bar}`} />
      <h3 className={`mt-4 text-lg font-bold ${a.chip}`}>{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">{body}</p>
      <Link href={href} className={`${a.btn} mt-5 w-full text-sm`}>
        {cta}
      </Link>
      <p className="mt-2 text-center text-xs font-medium text-slate">{note}</p>
    </div>
  );
}

function DealSummaryCard() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-white/15 bg-white p-5 text-ink shadow-glass">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate">
        Your deal review summary
      </p>
      <div className="mt-4 space-y-3">
        <SummaryRow label="Junk fees found" value="$1,241" tone="red" />
        <SummaryRow label="Overpaying" value="$2,350" tone="red" />
        <SummaryRow label="Better price range" value="$31,200–$31,800" tone="green" />
      </div>
      <div className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-xs leading-relaxed text-slate">
        Review of your buyer&apos;s order, junk-fee + overcharge flags, market
        price benchmark, and clear next steps.
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "red" | "green";
}) {
  return (
    <div className="flex items-center justify-between border-b border-edge pb-2.5 last:border-0 last:pb-0">
      <span className="text-sm text-slate">{label}</span>
      <span
        className={`text-sm font-bold ${tone === "red" ? "text-flag-red" : "text-green"}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ========================================================================== */
/*  TRUST BAR                                                                  */
/* ========================================================================== */

const TRUST = [
  { title: "We work for you.", sub: "Not the dealer." },
  { title: "No commissions.", sub: "No kickbacks. Ever." },
  { title: "Flat fees.", sub: "Transparent pricing." },
  { title: "Advice you can trust.", sub: "Decisions you make." },
];

function TrustBar() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div aria-hidden className="absolute inset-0 bg-grid-dark opacity-30" />
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST.map((t) => (
          <div key={t.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <ShieldCheck />
            </span>
            <div>
              <p className="text-sm font-bold text-white">{t.title}</p>
              <p className="text-sm text-white/65">{t.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  WHAT WE HELP YOU AVOID                                                     */
/* ========================================================================== */

const AVOID: { label: string; icon: IconName }[] = [
  { label: "Inflated dealer fees", icon: "receipt" },
  { label: "Add-ons you don't need", icon: "shield" },
  { label: "Bad financing structure", icon: "percent" },
  { label: "Payment tricks", icon: "bolt" },
  { label: "Weak trade-in offers", icon: "swap" },
  { label: "Fake “mandatory” products", icon: "doc" },
  { label: "Confusing OTD numbers", icon: "tag" },
];

function WhatWeAvoid() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <Reveal>
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">
            What we help you avoid
          </h2>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {AVOID.map((a, i) => (
            <Reveal key={a.label} delay={(i % 7) * 40}>
              <div className="flex h-full flex-col items-center gap-2.5 rounded-xl border border-edge bg-white px-3 py-5 text-center shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-100 text-navy">
                  <MatrixIcon name={a.icon} />
                </span>
                <span className="text-xs font-semibold leading-tight text-ink">
                  {a.label}
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  TARGET DEAL SHEET SAMPLE                                                   */
/* ========================================================================== */

function TargetDealSheet() {
  const points = [
    "Realistic out-the-door target",
    "Legit vs. junk fee checklist",
    "Trade-in target range",
    "Financing benchmark",
    "Pressure-proof scripts",
  ];
  return (
    <section className="border-y border-edge bg-cream-100">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-[1fr_1fr]">
        {/* Sample card */}
        <Reveal>
          <div className="rounded-2xl border border-edge bg-white p-6 shadow-card">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate">
              Target Deal Sheet (sample)
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <SheetRow label="Vehicle" value="2024 Toyota RAV4 XLE AWD" />
              <SheetRow
                label="Target out-the-door price"
                value="$32,250"
                strong
                tone="green"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-edge bg-cream-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-green-dark">
                    Fees — legit
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate">
                    <li className="flex justify-between"><span>Doc fee (state cap)</span><span className="font-semibold text-ink">$85</span></li>
                    <li className="flex justify-between"><span>Title</span><span className="font-semibold text-ink">$15</span></li>
                    <li className="flex justify-between"><span>Reg / tags</span><span className="font-semibold text-ink">$215</span></li>
                  </ul>
                </div>
                <div className="rounded-lg border border-flag-red/20 bg-flag-red/[0.04] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-flag-red">
                    Fees — often junk
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate">
                    <li className="flex justify-between"><span>Market adjustment</span><span className="font-semibold text-flag-red">$0</span></li>
                    <li className="flex justify-between"><span>Protection pkg</span><span className="font-semibold text-flag-red">$0</span></li>
                    <li className="flex justify-between"><span>Nitrogen / etch</span><span className="font-semibold text-flag-red">$0</span></li>
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SheetRow label="Trade-in target" value="$15,500" />
                <SheetRow label="Financing benchmark" value="5.49% or less" />
              </div>
              <div className="rounded-lg bg-navy px-4 py-2.5 text-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  Walk-away number{" "}
                </span>
                <span className="font-bold text-gold">$33,200</span>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Copy */}
        <Reveal delay={100}>
          <div>
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              The Target Deal Sheet&trade;
            </h2>
            <p className="mt-3 max-w-md text-slate">
              We build a custom game plan so you know your numbers before the
              dealer gives you theirs.
            </p>
            <ul className="mt-6 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-sm font-semibold text-ink">
                  <CheckDot /> {p}
                </li>
              ))}
            </ul>
            <Link href="/services" className="btn-blue mt-7">
              Get my game plan
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function SheetRow({
  label,
  value,
  strong = false,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "green";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-edge bg-cream-50 px-3 py-2">
      <span className="text-xs font-medium text-slate">{label}</span>
      <span
        className={`text-sm font-bold ${tone === "green" ? "text-green" : "text-ink"} ${strong ? "text-base" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ========================================================================== */
/*  3 PATHS. 1 GOAL. A BETTER DEAL.                                            */
/* ========================================================================== */

const PATHS = [
  {
    n: 1,
    accent: "green" as Accent,
    tag: "I have a quote",
    best: "Deal Rescue · Quote Review",
    blurb: "You're close to signing. Let us review it.",
    bullets: ["We review your numbers", "Spot junk fees & add-ons", "Benchmark your price", "Give you clear next steps"],
    cta: "Review my quote",
    href: "/check",
    price: "Free first scan",
  },
  {
    n: 2,
    accent: "blue" as Accent,
    tag: "I'm still shopping",
    best: "Co-Pilot or Deal Maker",
    blurb: "You want to be prepared before you walk in.",
    bullets: ["Target Deal Sheet™", "Negotiation strategy", "Scripts & talking points", "Live support options"],
    cta: "Build my plan",
    href: "/services",
    price: "From $349",
  },
  {
    n: 3,
    accent: "gold" as Accent,
    tag: "Handle it for me",
    best: "Concierge",
    blurb: "You want an advocate to do the heavy lifting.",
    bullets: ["We source & compare", "Negotiate with dealers", "Review paperwork", "Arrive at a clean deal"],
    cta: "Start concierge",
    href: "/services",
    price: "From $1,499",
  },
];

function ThreePaths() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">
              3 Paths. 1 Goal. A Better Deal.
            </h2>
            <p className="mt-3 text-slate">
              Tell us where you are in your car-buying process and we&apos;ll
              point you in the right direction.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PATHS.map((p, i) => {
            const a = ACCENTS[p.accent];
            return (
              <Reveal key={p.n} delay={i * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-edge bg-white p-7 shadow-card">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-bold ${a.icon}`}
                  >
                    {p.n}
                  </span>
                  <p className={`mt-4 text-xs font-bold uppercase tracking-wide ${a.chip}`}>
                    {p.tag}
                  </p>
                  <p className="mt-1 text-sm text-slate">{p.blurb}</p>
                  <div className={`mt-4 rounded-xl px-4 py-3 ${a.icon}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                      Best for you
                    </p>
                    <p className="text-sm font-bold">{p.best}</p>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm text-ink">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link href={p.href} className={`${a.btn} mt-6 w-full text-sm`}>
                    {p.cta}
                  </Link>
                  <p className="mt-2 text-center text-xs font-medium text-slate">
                    {p.price}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Promise bar */}
        <Reveal delay={120}>
          <div className="mt-8 flex items-center gap-4 rounded-2xl bg-navy px-6 py-5 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <ShieldCheck />
            </span>
            <p className="text-sm leading-relaxed text-white/85">
              <span className="font-bold text-white">Our promise: </span>
              We accept no commissions, kickbacks, finder&apos;s fees, or spiffs.
              We are paid only by you, the buyer.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  CUSTOMER JOURNEY (FUNNELS)                                                 */
/* ========================================================================== */

const FUNNELS = [
  {
    accent: "green" as Accent,
    title: "Funnel 1: Quote Review",
    steps: [
      ["Upload your quote", "Buyer's order, worksheet, or screenshot"],
      ["Quick info", "Vehicle, ZIP, trade-in, financing status"],
      ["Get your read", "Junk-fee flags + clear recommendations"],
      ["Deal review report", "We analyze and send findings"],
      ["Next step", "Co-Pilot / Deal Maker / Concierge"],
    ],
  },
  {
    accent: "blue" as Accent,
    title: "Funnel 2: Target Deal Sheet",
    steps: [
      ["Tell us what you want", "Vehicle, trim, must-haves, budget"],
      ["Provide details", "ZIP, trade-in, financing, timeline"],
      ["Choose your plan", "Co-Pilot or Deal Maker"],
      ["Receive your plan", "Target Deal Sheet, scripts, strategy"],
      ["Support during negotiation", "Add-on support if needed"],
    ],
  },
  {
    accent: "gold" as Accent,
    title: "Funnel 3: Concierge",
    steps: [
      ["Application", "Tell us what you're looking for"],
      ["Discovery call", "We confirm scope & expectations"],
      ["Custom agreement", "Scope, timeline, flat fee"],
      ["We get to work", "Source, negotiate, review paperwork"],
      ["You get a better deal", "Delivered with confidence"],
    ],
  },
];

function CustomerJourney() {
  return (
    <section className="border-y border-edge bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            The customer journey
          </h2>
          <p className="mt-2 text-slate">
            Three clear paths — pick the one that fits where you are.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {FUNNELS.map((f, i) => {
            const a = ACCENTS[f.accent];
            return (
              <Reveal key={f.title} delay={i * 80}>
                <div className="h-full rounded-2xl border border-edge bg-white p-6 shadow-card">
                  <p className={`text-xs font-bold uppercase tracking-wide ${a.chip}`}>
                    {f.title}
                  </p>
                  <ol className="mt-4 space-y-4">
                    {f.steps.map((s, idx) => (
                      <li key={s[0]} className="flex gap-3">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${a.icon}`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-ink">{s[0]}</p>
                          <p className="text-xs leading-relaxed text-slate">{s[1]}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
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
/*  SERVICE EXAMPLES                                                           */
/* ========================================================================== */

const SERVICES = [
  {
    accent: "green" as Accent,
    name: "Deal Rescue — Quote Review",
    blurb: "Already have numbers from a dealer? Send them to us before you sign.",
    bullets: ["Review of your buyer's order/worksheet", "Spot junk fees & overcharges", "Benchmark pricing in your market", "Clear recommendations"],
    cta: "Review my deal — $199",
    href: "/services",
  },
  {
    accent: "blue" as Accent,
    name: "Co-Pilot — Negotiation Support",
    blurb: "You handle the conversations. We give you the game plan.",
    bullets: ["Target Deal Sheet™", "Negotiation scripts & talking points", "Fee & add-on checklist", "Live call/text support"],
    cta: "Get my game plan — from $349",
    href: "/services",
  },
  {
    accent: "blue" as Accent,
    name: "Deal Maker — Full Strategy",
    blurb: "We build the offer and strategy before you talk to any dealer.",
    bullets: ["Vehicle & market research", "Custom offer strategy", "Dealer short list & outreach plan", "Negotiation roadmap"],
    cta: "Build my strategy — from $749",
    href: "/services",
  },
  {
    accent: "gold" as Accent,
    name: "Concierge — We Handle It",
    blurb: "We source, negotiate, and handle the process so you get a clean deal.",
    bullets: ["Vehicle sourcing & comparison", "Direct negotiation with dealers", "Paperwork review", "Delivery coordination"],
    cta: "Let us handle it — from $1,499",
    href: "/services",
  },
];

function ServiceExamples() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            Service pages
          </h2>
          <p className="mt-2 text-slate">
            Pick the level of help that fits your moment. Flat fees, paid only by
            you.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {SERVICES.map((s, i) => {
            const a = ACCENTS[s.accent];
            return (
              <Reveal key={s.name} delay={(i % 2) * 80}>
                <div className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card">
                  <span aria-hidden className={`h-1 w-12 rounded-full ${a.bar}`} />
                  <h3 className={`mt-4 text-lg font-bold ${a.chip}`}>{s.name}</h3>
                  <p className="mt-1.5 text-sm text-slate">{s.blurb}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2.5 text-sm text-ink">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Link href={s.href} className={`${a.btn} mt-6 self-start text-sm`}>
                    {s.cta}
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
/*  RED FLAG MATRIX — compact (compliance-aligned)                            */
/* ========================================================================== */

const MATRIX = [
  { title: "Price", icon: "tag" as IconName, body: "Markups and out-the-door numbers that do not add up.", detail: "a “market adjustment” quietly baked into the out-the-door number." },
  { title: "Fees", icon: "receipt" as IconName, body: "Doc, prep, nitrogen, VIN-etch, and vague dealer padding.", detail: "dealer-installed packages bundled in as if they were mandatory." },
  { title: "Financing", icon: "percent" as IconName, body: "APR markup, stretched terms, and payment packing.", detail: "the payment looks right, but the APR is marked up over what you qualify for." },
  { title: "Trade-in", icon: "swap" as IconName, body: "Lowball values and buried negative-equity games.", detail: "a lowball trade with your negative equity rolled into the new loan." },
  { title: "Warranty & F&I", icon: "shield" as IconName, body: "Overpriced VSCs, GAP, tire/wheel, and add-on bundles.", detail: "a VSC or protection bundle priced at 2–3× cost and pitched “only $X a month.”" },
  { title: "Used-car risk", icon: "car" as IconName, body: "Condition, history, title, and mileage red flags.", detail: "title, history, or mileage issues that surface only after you sign." },
  { title: "Contract mismatch signals", icon: "doc" as IconName, body: "Signed terms that drift from the quote you agreed to.", detail: "numbers on the signed contract that drift from the quote you agreed to." },
  { title: "Pressure tactics", icon: "bolt" as IconName, body: "Spot delivery, rushed signing, and today-only claims.", detail: "spot delivery and “today only” urgency engineered to rush your signature." },
];

function RedFlagMatrix() {
  return (
    <section id="what-we-catch" className="scroll-mt-20 border-y border-edge bg-cream-100">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
            Proprietary diagnostic
          </span>
          <h2 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">
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
          <p className="mt-7">
            <Link
              href="/sample"
              className="text-sm font-bold text-blue hover:underline"
            >
              See what we check →
            </Link>
          </p>
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
/*  FINAL CTA + DISCLAIMER                                                     */
/* ========================================================================== */

function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="orb left-1/2 top-[-6rem] h-64 w-[40rem] -translate-x-1/2 bg-blue/20" />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <Reveal>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Before you sign, get the numbers checked.
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75">
            Free first scan, no account needed, about a minute. You always make
            the final decision.
          </p>
        </Reveal>
        <Reveal delay={140}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/check" className="btn-green text-base">
              Get started now
            </Link>
            <Link href="/deal-rescue" className="btn-outline-light px-5 py-3 text-base">
              I already signed — what now?
            </Link>
          </div>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-10 max-w-2xl text-xs leading-relaxed text-white/55">
            Driveway Advocate provides decision support, not legal or financial
            advice. We never take money from dealers, lenders, or warranty
            companies. After a deal is signed, options are limited and outcomes
            cannot be guaranteed.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ========================================================================== */
/*  SMALL SHARED BITS                                                          */
/* ========================================================================== */

function CheckDot() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-soft text-green-dark">
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none" aria-hidden>
        <path d="M5 10.5l2.5 2.5L15 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function ShieldCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 3 5 5.5V11c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V5.5L12 3Z" />
      <path d="M9 12l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
