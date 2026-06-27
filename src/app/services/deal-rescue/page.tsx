import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Deal Rescue — Driveway Advocate",
  description:
    "The full buyer-side teardown of an offer on the table — fees, F&I, trade-in, and finance terms — with a clear sign / push back / walk call.",
};

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
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              Core
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Deal Rescue
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-xl italic text-gold-dark">
            “Help me fix this offer.”
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            You have an offer in hand and a bad feeling about it. Deal Rescue is
            the full teardown — every number on the buyer&apos;s order taken apart
            and put back together on your side — so you walk in knowing exactly
            what to fix, what to challenge, and what to say.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-serif text-2xl font-bold text-navy">
              $349–$599
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
              When the offer is real and the pressure is on, you don&apos;t need a
              quick read — you need the whole thing pulled apart. Deal Rescue goes
              line by line through the buyer&apos;s order, the financing, the
              trade, and the finance-office products, and hands you a corrected
              target and the words to get there.
            </p>
          </Block>

          {/* What we review */}
          <Block title="What we review">
            <ul className="grid gap-2 sm:grid-cols-2">
              {REVIEWS.map((r) => (
                <li key={r} className="flex items-start gap-2 text-navy/75">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {r}
                </li>
              ))}
            </ul>
          </Block>

          {/* What you receive */}
          <Block title="What you receive">
            <ul className="space-y-2 text-navy/75">
              <Receive>
                A full buyer&apos;s-order audit with a junk-fee challenge list and
                what each line should be.
              </Receive>
              <Receive>
                An F&amp;I and trade-in review, with fair ranges shown as ranges
                and confidence levels — never a fake exact &quot;fair price.&quot;
              </Receive>
              <Receive>
                A target counteroffer and a finance-term review you can act on.
              </Receive>
              <Receive>
                A word-for-word dealer script and a clear sign / push back / walk
                call.
              </Receive>
            </ul>
          </Block>

          {/* How the recommendation works */}
          <Block title="How the recommendation works">
            <p className="text-navy/70">
              The teardown ends with one of three plain calls on the offer as it
              stands:
            </p>
            <div className="mt-4 space-y-3">
              {LABELS.map((l) => (
                <div
                  key={l.label}
                  className="rounded-xl border border-navy/10 bg-cream-100 p-4"
                >
                  <p className="font-serif text-base font-semibold text-navy">
                    {l.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-navy/65">
                    {l.body}
                  </p>
                </div>
              ))}
            </div>
          </Block>

          {/* What this is not */}
          <Block title="What this is not">
            <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-card">
              <p className="text-navy/70">
                Driveway Advocate does not negotiate as a broker, dealer, lender,
                lawyer, or financial advisor. The buyer remains in control — we
                give you the analysis, the target, and the script; you decide
                what to do with them. This is decision support, not financial or
                legal advice.
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
