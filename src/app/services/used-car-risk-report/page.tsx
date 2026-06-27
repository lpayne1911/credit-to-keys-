import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Used-Car Risk Report — Driveway Advocate",
  description:
    "A buyer-side read on a used vehicle's identity, mileage, price, history, and red flags before you commit to a problem car.",
};

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
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              Paid front door
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Used-Car Risk Report
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-xl italic text-gold-dark">
            “Is this car a mistake?”
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            A used car can look great in the listing and still be a problem
            underneath. We pull together the identity, mileage, price, history,
            and listing signals into one buyer-side read on the risk — before you
            commit to a car you can&apos;t un-buy.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-serif text-2xl font-bold text-navy">
              $199–$399
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
              You&apos;ve found a used car you like, but something&apos;s nagging
              you — the price seems low, the history is vague, or the listing
              reads a little too smooth. This report turns that uneasy feeling
              into a clear picture of the actual risk, so you know whether to keep
              going, dig deeper, or walk.
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
                A plain-English risk read on the vehicle, with the specific
                signals that drove it.
              </Receive>
              <Receive>
                A price sanity check shown as a range with a confidence level —
                never a fake exact &quot;fair price.&quot;
              </Receive>
              <Receive>
                A list of the questions to put to the seller, in writing, before
                you go further.
              </Receive>
              <Receive>
                A clear recommendation on whether to proceed, slow down, inspect,
                or walk.
              </Receive>
            </ul>
          </Block>

          {/* How the recommendation works */}
          <Block title="How the recommendation works">
            <p className="text-navy/70">
              The report ends with one of four plain calls, so you know your next
              move:
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
                This is not a mechanical inspection, a title guarantee, a recall
                guarantee, a vehicle-history guarantee, a legal opinion, or a
                prediction that the car will or will not fail. It&apos;s
                decision support — a buyer-side reference point that helps you
                decide for yourself.
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
