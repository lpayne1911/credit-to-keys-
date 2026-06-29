import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Deal Rescue — Driveway Advocate",
  description:
    "The full buyer-side teardown of an offer on the table — fees, F&I, trade-in, and finance terms — with a clear sign / push back / walk call.",
};

const ACCENT: Accent = "green";

const REVIEWS = [
  "Buyer's order",
  "Selling price",
  "Out-the-door price",
  "Dealer fees",
  "Taxes, title, registration, and doc-fee separation",
  "Add-ons",
  "F&I products",
  "Trade-in allowance and payoff",
  "APR",
  "Loan term",
  "Down payment",
  "Monthly payment structure",
];

const LABELS = [
  {
    label: "Sign only if corrected",
    body: "The bones are fine, but specific lines need to change first. We tell you which.",
  },
  {
    label: "Push back",
    body: "Enough is off that you should counter before you agree to anything.",
  },
  {
    label: "Walk away",
    body: "The offer is bad enough — or off enough — that the right move is to leave.",
  },
];

export default function DealRescuePage() {
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
                  Core
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  Soon
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Deal Rescue
              </h1>
              <p className={`mt-4 max-w-2xl text-lg font-semibold ${a.text}`}>
                “Help me fix this offer.”
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
                You have an offer in hand and a bad feeling about it. Deal Rescue is
                the full teardown — every number on the buyer&apos;s order taken apart
                and put back together on your side — so you walk in knowing exactly
                what to fix, what to challenge, and what to say.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="text-2xl font-bold text-white">$349–$599</span>
                <Link href="/services" className="btn-ghost-light">
                  See all services
                </Link>
              </div>
              <p className="mt-4 max-w-2xl text-sm text-white/60">
                This product is coming soon. It isn&apos;t purchasable yet — there&apos;s
                nothing to buy or book on this page.
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
                When the offer is real and the pressure is on, you don&apos;t need a
                quick read — you need the whole thing pulled apart. Deal Rescue goes
                line by line through the buyer&apos;s order, the financing, the
                trade, and the finance-office products, and hands you a corrected
                target and the words to get there.
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
                  A full buyer&apos;s-order audit with a junk-fee challenge list and
                  what each line should be.
                </Receive>
                <Receive accent={ACCENT}>
                  An F&amp;I and trade-in review, with fair ranges shown as ranges
                  and confidence levels — never a fake exact &quot;fair price.&quot;
                </Receive>
                <Receive accent={ACCENT}>
                  A target counteroffer and a finance-term review you can act on.
                </Receive>
                <Receive accent={ACCENT}>
                  A word-for-word dealer script and a clear sign / push back / walk
                  call.
                </Receive>
              </ul>
            </Block>

            {/* How the recommendation works */}
            <Block title="How the recommendation works" accent={ACCENT} delay={60}>
              <p className="text-slate">
                The teardown ends with one of three plain calls on the offer as it
                stands:
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
                  Driveway Advocate does not negotiate as a broker, dealer, lender,
                  lawyer, or financial advisor. The buyer remains in control — we
                  give you the analysis, the target, and the script; you decide
                  what to do with them. This is decision support, not financial or
                  legal advice.
                </p>
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
