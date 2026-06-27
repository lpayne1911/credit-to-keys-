import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Concierge — Driveway Advocate",
  description:
    "High-touch, buyer-side support from sourcing through signing — organizing, reviewing, comparing, and scripting the process within legal limits, with you in control.",
};

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
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              Premium
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Concierge
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-xl italic text-gold-dark">
            “Handle the process with me.”
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            Our most hands-on support, from sourcing through signing. We help
            organize, review, compare, script, and steady the whole process —
            within legal limits, and with you the decision-maker at every step.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-serif text-2xl font-bold text-navy">
              $1,999+
            </span>
            <Link href="/services" className="btn-secondary">
              Back to all services
            </Link>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-navy/55">
            This product is coming soon. It isn&apos;t purchasable yet — there&apos;s
            nothing to buy or book on this page.
          </p>
        </section>

        {/* Buyer-side promise */}
        <section className="border-y border-navy/10 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-navy/75">
            Paid by <span className="font-semibold text-gold-dark">you</span> —
            never the dealer, the lender, the finance office, or the warranty
            company. No commissions, no kickbacks, ever.
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          {/* What this helps with */}
          <Block title="What this helps with">
            <p className="text-navy/70">
              Some buyers want a deal done right without carrying every detail
              themselves. Concierge stays close through the whole process —
              sourcing, outreach, comparison, negotiation prep, and the final
              paperwork — so it moves smoothly and stays firmly on your side,
              without ever taking the decisions out of your hands.
            </p>
          </Block>

          {/* What we review / manage */}
          <Block title="What we review and manage">
            <ul className="grid gap-2 sm:grid-cols-2">
              {MANAGE.map((m) => (
                <li key={m} className="flex items-start gap-2 text-navy/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {m}
                </li>
              ))}
            </ul>
          </Block>

          {/* What you receive */}
          <Block title="What you receive">
            <ul className="space-y-2 text-navy/75">
              <Receive>
                Hands-on, buyer-side support from sourcing through signing, with a
                single point of contact.
              </Receive>
              <Receive>
                Organized options, quotes, and paperwork, with pricing shown as
                ranges and confidence levels — never a fake exact &quot;fair
                price.&quot;
              </Receive>
              <Receive>
                Negotiation targets and dealer scripts prepared for you to use.
              </Receive>
              <Receive>
                A final buyer-side review of every number before you approve and
                sign.
              </Receive>
            </ul>
          </Block>

          {/* How the support works */}
          <Block title="How the support works">
            <div className="space-y-3">
              {SUPPORT.map((s) => (
                <div
                  key={s.title}
                  className="rounded-xl border border-navy/10 bg-cream-100 p-4"
                >
                  <p className="font-serif text-base font-semibold text-navy">
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-navy/65">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </Block>

          {/* Legal-limit boundary */}
          <Block title="Legal-limit boundary">
            <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-card">
              <p className="text-navy/70">
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

          {/* CTA back */}
          <div className="mt-12 rounded-2xl border border-navy/10 bg-white p-8 text-center shadow-card">
            <h2 className="font-serif text-2xl font-semibold text-navy">
              This one&apos;s rolling out soon.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-navy/65">
              Want to see what&apos;s live today? Start with a free Deal Check or
              browse the full lineup.
            </p>
            <div className="mt-6">
              <Link href="/services" className="btn-primary">
                Back to all services
              </Link>
            </div>
          </div>

          <div className="mt-10">
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
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 first:mt-0">
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="font-serif text-sm font-bold uppercase tracking-widest text-gold-dark">
          {title}
        </h2>
        <span className="h-px flex-1 bg-navy/10" />
      </div>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

function Receive({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      <span>{children}</span>
    </li>
  );
}
