import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Used-Car Risk Report — Driveway Advocate",
  description:
    "A buyer-side read on a used vehicle's identity, mileage, price, history, and red flags before you commit to a problem car.",
};

const ACCENT: Accent = "blue";

const REVIEWS = [
  "VIN and vehicle identity",
  "Mileage",
  "Asking price",
  "Out-the-door structure",
  "History report details, if provided",
  "Title clues, if provided",
  "Accident and damage indicators",
  "Ownership and use history",
  "Dealer listing language",
  "Photos or inspection notes, if provided",
];

const FULL_REPORT_INCLUDES = [
  "Vehicle identity and snapshot",
  "Title and history review",
  "Accident and damage risk review",
  "Prior-use review",
  "Pricing and out-the-door structure review",
  "Inspection priorities",
  "Seller questions",
  "Document checklist",
  "Human reviewer judgment layered on top of the pilot flow",
];

const LABELS = [
  {
    label: "Proceed",
    body: "Nothing major stands out. The identity, mileage, and price line up.",
  },
  {
    label: "Slow down",
    body: "A few things don't add up. Get answers in writing before you go further.",
  },
  {
    label: "Inspect first",
    body: "Worth a closer look — an independent inspection before any commitment.",
  },
  {
    label: "Walk away",
    body: "The risk signals are strong enough that this car isn't worth it.",
  },
];

export default function UsedCarRiskReportPage() {
  const a = ACCENT_CLASSES[ACCENT];
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy to-navy text-white">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className={`orb -top-24 right-[-6rem] h-[24rem] w-[24rem] ${a.bar} opacity-20`} aria-hidden />
          <Reveal>
            <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-block rounded-full ${a.soft} ${a.softText} px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                  Paid front door
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  Soon
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Used-Car Risk Report
              </h1>
              <p className={`mt-4 max-w-2xl text-lg font-semibold ${a.text}`}>
                “Is this car a mistake?”
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
                A used car can look great in the listing and still be a problem
                underneath. We pull together the identity, mileage, price, history,
                and listing signals into one buyer-side read on the risk — before you
                commit to a car you can&apos;t un-buy.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span className="text-2xl font-bold text-white">$199–$399</span>
                <Link href="/services/used-car-risk-report/check" className={a.btn}>
                  Preview the used-car risk flow
                </Link>
                <Link href="/services" className="btn-ghost-light">
                  See all services
                </Link>
              </div>
              <p className="mt-4 max-w-2xl text-sm text-white/60">
                The full paid report is coming soon, and isn&apos;t purchasable yet —
                there&apos;s nothing to buy or book on this page. You can try the free{" "}
                <strong>pilot preview</strong> now: it&apos;s a buyer-side
                decision-support tool, collects no payment, and doesn&apos;t replace
                the full Used-Car Risk Report.
              </p>
            </div>
          </Reveal>
        </section>

        {/* Buyer-side promise */}
        <section className="border-y border-edge bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-slate">
            Paid by <span className={`font-semibold ${a.textDark}`}>you</span> —
            never the dealer, the lender, the finance office, or the warranty
            company. No commissions, no kickbacks, ever.
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-20">
            {/* What this helps with */}
            <Block title="What this helps with" accent={ACCENT}>
              <p className="text-slate">
                You&apos;ve found a used car you like, but something&apos;s nagging
                you — the price seems low, the history is vague, or the listing
                reads a little too smooth. This report turns that uneasy feeling
                into a clear picture of the actual risk, so you know whether to keep
                going, dig deeper, or walk.
              </p>
            </Block>

            {/* What we review */}
            <Block title="What we review" accent={ACCENT} delay={60}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {REVIEWS.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-slate">
                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
                    {r}
                  </li>
                ))}
              </ul>
            </Block>

            {/* What you receive */}
            <Block title="What you receive" accent={ACCENT} delay={60}>
              <ul className="space-y-2 text-slate">
                <Receive accent={ACCENT}>
                  A plain-English risk read on the vehicle, with the specific
                  signals that drove it.
                </Receive>
                <Receive accent={ACCENT}>
                  A price sanity check shown as a range with a confidence level —
                  never a fake exact &quot;fair price.&quot;
                </Receive>
                <Receive accent={ACCENT}>
                  A list of the questions to put to the seller, in writing, before
                  you go further.
                </Receive>
                <Receive accent={ACCENT}>
                  A clear recommendation on whether to proceed, slow down, inspect,
                  or walk.
                </Receive>
              </ul>
            </Block>

            {/* How the recommendation works */}
            <Block title="How the recommendation works" accent={ACCENT} delay={60}>
              <p className="text-slate">
                The report ends with one of four plain calls, so you know your next
                move:
              </p>
              <div className="mt-4 space-y-3">
                {LABELS.map((l) => (
                  <div
                    key={l.label}
                    className="rounded-2xl border border-edge bg-white p-5 shadow-card"
                  >
                    <p className="text-base font-bold text-navy">{l.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate">
                      {l.body}
                    </p>
                  </div>
                ))}
              </div>
            </Block>

            {/* What this is not */}
            <Block title="What this is not" accent={ACCENT} delay={60}>
              <div className="card">
                <p className="text-slate">
                  This is not a mechanical inspection, a title guarantee, a recall
                  guarantee, a vehicle-history guarantee, a legal opinion, or a
                  prediction that the car will or will not fail. It&apos;s
                  decision support, not financial, legal, or insurance advice — a
                  buyer-side reference point that helps you decide for yourself.
                </p>
              </div>
            </Block>

            {/* What the full report will include */}
            <Block title="What the full report will include" accent={ACCENT} delay={60}>
              <p className="-mt-1 mb-4 text-slate">
                The paid report pairs the instant pilot flow with a human reviewer
                who reads your actual documents and lays out a buyer-side plan:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {FULL_REPORT_INCLUDES.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-slate">
                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
                    {it}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/services/used-car-risk-report/sample-report"
                  className="btn-secondary"
                >
                  View a sample report
                </Link>
                <Link
                  href="/services/used-car-risk-report/check"
                  className="btn-secondary"
                >
                  Preview the used-car risk flow
                </Link>
              </div>
            </Block>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="relative overflow-hidden bg-navy text-white">
          <div className="bg-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <Reveal>
            <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
              <h2 className="text-2xl font-bold sm:text-3xl">
                This one&apos;s rolling out soon.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-white/75">
                It isn&apos;t purchasable yet. Want to see what&apos;s live today?
                Browse the full lineup, or start with a free Deal Check.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/services" className={a.btn}>
                  Back to all services
                </Link>
                <Link href="/check" className="btn-ghost-light">
                  Start a free Deal Check
                </Link>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <Disclaimer />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Block({
  title,
  accent,
  delay = 0,
  children,
}: {
  title: string;
  accent: Accent;
  delay?: number;
  children: React.ReactNode;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <Reveal delay={delay} className="mt-10 first:mt-0">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className={`text-sm font-semibold uppercase tracking-widest ${a.text}`}>
          {title}
        </h2>
        <span className="h-px flex-1 bg-edge" />
      </div>
      <div className="leading-relaxed">{children}</div>
    </Reveal>
  );
}

function Receive({
  accent,
  children,
}: {
  accent: Accent;
  children: React.ReactNode;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
      <span>{children}</span>
    </li>
  );
}
