import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Concierge — Driveway Advocate",
  description:
    "High-touch, buyer-side support from sourcing through signing — organizing, reviewing, comparing, and scripting the process within legal limits, with you in control.",
};

const ACCENT: Accent = "gold";

const MANAGE = [
  "Sourcing and shortlisting candidate vehicles",
  "Market pricing across listings and dealers",
  "Dealer outreach and scheduling",
  "Quotes and out-the-door structures",
  "Trade-in figures and payoff",
  "Finance terms and F&I products",
  "Negotiation targets and scripts",
  "Final paperwork before signing",
];

const SUPPORT = [
  {
    title: "We organize",
    body: "Keeping the moving pieces, timelines, and documents in one clear place.",
  },
  {
    title: "We review and compare",
    body: "Putting offers side by side and surfacing the junk, the markups, and the gaps.",
  },
  {
    title: "We script and prepare",
    body: "Giving you the words and the targets for each dealer conversation.",
  },
  {
    title: "You decide and sign",
    body: "Every approval, every signature, every final call stays yours.",
  },
];

export default function ConciergePage() {
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
                  Premium
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/60">
                  Soon
                </span>
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Concierge
              </h1>
              <p className={`mt-4 max-w-2xl text-lg font-semibold ${a.text}`}>
                “Handle the process with me.”
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
                Our most hands-on support, from sourcing through signing. We help
                organize, review, compare, script, and steady the whole process —
                within legal limits, and with you the decision-maker at every step.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="text-2xl font-bold text-white">$1,999+</span>
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
                Some buyers want a deal done right without carrying every detail
                themselves. Concierge stays close through the whole process —
                sourcing, outreach, comparison, negotiation prep, and the final
                paperwork — so it moves smoothly and stays firmly on your side,
                without ever taking the decisions out of your hands.
              </p>
            </Block>

            {/* What we review / manage */}
            <Block title="What we review and manage" accent={ACCENT} delay={60}>
              <ul className="grid gap-2 sm:grid-cols-2">
                {MANAGE.map((m) => (
                  <li key={m} className="flex items-start gap-2 text-slate">
                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
                    {m}
                  </li>
                ))}
              </ul>
            </Block>

            {/* What you receive */}
            <Block title="What you receive" accent={ACCENT} delay={60}>
              <ul className="space-y-2 text-slate">
                <Receive accent={ACCENT}>
                  Hands-on, buyer-side support from sourcing through signing, with a
                  single point of contact.
                </Receive>
                <Receive accent={ACCENT}>
                  Organized options, quotes, and paperwork, with pricing shown as
                  ranges and confidence levels — never a fake exact &quot;fair
                  price.&quot;
                </Receive>
                <Receive accent={ACCENT}>
                  Negotiation targets and dealer scripts prepared for you to use.
                </Receive>
                <Receive accent={ACCENT}>
                  A final buyer-side review of every number before you approve and
                  sign.
                </Receive>
              </ul>
            </Block>

            {/* How the support works */}
            <Block title="How the support works" accent={ACCENT} delay={60}>
              <div className="space-y-3">
                {SUPPORT.map((s) => (
                  <div
                    key={s.title}
                    className="rounded-2xl border border-edge bg-white p-5 shadow-card"
                  >
                    <p className="text-base font-bold text-navy">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </Block>

            {/* Legal-limit boundary */}
            <Block title="Legal-limit boundary" accent={ACCENT} delay={60}>
              <div className="card">
                <p className="text-slate">
                  Driveway Advocate does not act as the buyer&apos;s attorney,
                  lender, insurance agent, dealer, broker, or power of attorney. The
                  buyer remains the decision-maker: the buyer signs all documents,
                  approves all terms, and makes all final decisions. Driveway
                  Advocate may help organize, review, compare, script, and support
                  the process within legal limits. This is decision support, not
                  financial or legal advice.
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
