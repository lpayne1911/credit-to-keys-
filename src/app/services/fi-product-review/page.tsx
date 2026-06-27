import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "F&I Product Review — Driveway Advocate",
  description:
    "A buyer-side review of finance-office products — warranties, GAP, and add-ons — against fair ranges, so you know what's worth keeping and what to drop.",
};

const REVIEWS = [
  "Extended warranties",
  "Vehicle service contracts",
  "GAP",
  "Tire and wheel",
  "Maintenance plans",
  "Key replacement",
  "Dent, windshield, and theft products",
  "Paint, interior, ceramic, and appearance packages",
  "Dealer add-ons packed into the payment",
];

const LABELS = [
  {
    label: "Worth considering",
    body: "Priced fairly for what it covers, and a reasonable fit for how you drive.",
  },
  {
    label: "Only if discounted",
    body: "Can make sense — but only well below what the finance office is asking.",
  },
  {
    label: "Challenge hard",
    body: "Overpriced or thin on real coverage. Push back before you agree to it.",
  },
  {
    label: "Cancel if possible",
    body: "Little value for the money. If you've signed, look at cancelling for a refund.",
  },
  {
    label: "Dangerous or misrepresented",
    body: "Sold on terms that don't match the contract, or stacked to inflate the payment.",
  },
];

export default function FiProductReviewPage() {
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
            F&amp;I Product Review
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-xl italic text-gold-dark">
            “Should I buy — or cancel — this warranty, GAP, or add-on?”
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            The finance office is where good deals quietly get expensive. We
            price-check every product they put in front of you against fair
            ranges and tell you, plainly, what&apos;s worth keeping and what to
            drop — so you decide on the numbers, not the pressure.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-serif text-2xl font-bold text-navy">
              $149–$299
            </span>
            <Link href="/services" className="btn-secondary">
              See all services
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
              You&apos;re sitting in the finance office, a screen full of
              products in front of you, every one pitched as a smart, limited-time
              add to the payment. This review gives you a buyer-side read on each
              one — whether it&apos;s fairly priced, overpriced, or something you
              should walk back — before you sign, and even after, while you can
              still cancel.
            </p>
          </Block>

          {/* What we review */}
          <Block title="What we review">
            <ul className="grid gap-2 sm:grid-cols-2">
              {REVIEWS.map((r) => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-navy/75"
                >
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
                A product-by-product breakdown with a fair-range estimate for
                each, shown as a range with a confidence level — never a fake
                exact &quot;fair price.&quot;
              </Receive>
              <Receive>
                A clear keep / drop / challenge recommendation on every line.
              </Receive>
              <Receive>
                Plain-English notes on what each product actually covers, and
                where the gaps are.
              </Receive>
              <Receive>
                Cancellation pointers for anything already signed that&apos;s not
                worth keeping.
              </Receive>
            </ul>
          </Block>

          {/* How the recommendation works */}
          <Block title="How the recommendation works">
            <p className="text-navy/70">
              Each product gets one of five plain labels, so you know exactly
              where it stands:
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
                Driveway Advocate does not sell warranties, GAP, insurance, or
                protection products, and does not receive commissions from product
                providers. This is decision support, not financial, legal, tax,
                or insurance advice — a reference point so you can decide for
                yourself.
              </p>
            </div>
          </Block>

          {/* CTA back */}
          <div className="mt-12 rounded-2xl border border-navy/10 bg-white p-8 text-center shadow-card">
            <h2 className="font-serif text-2xl font-semibold text-navy">
              This one&apos;s rolling out soon.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-navy/65">
              It isn&apos;t purchasable yet. Want to see what&apos;s live today?
              Browse the full lineup, or start with a free Deal Check.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/services" className="btn-primary">
                Back to all services
              </Link>
              <Link href="/check" className="btn-secondary">
                Start a free Deal Check
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
