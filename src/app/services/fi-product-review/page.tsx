import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "F&I Product Review — Driveway Advocate",
  description:
    "A buyer-side review of finance-office products — warranties, GAP, and add-ons — against fair ranges, so you know what's worth keeping and what to drop.",
};

const ACCENT: Accent = "green";

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

const FULL_REVIEW_INCLUDES = [
  "Product inventory",
  "Price and term review",
  "Coverage and duplication review",
  "Required-claim check",
  "Cancellation-language review",
  "Buyer script",
  "Document checklist",
  "Human reviewer judgment layered on top of the pilot flow",
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
                F&amp;I Product Review
              </h1>
              <p className={`mt-4 max-w-2xl text-lg font-semibold ${a.text}`}>
                “Should I buy — or cancel — this warranty, GAP, or add-on?”
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
                The finance office is where good deals quietly get expensive. We
                price-check every product they put in front of you against fair
                ranges and tell you, plainly, what&apos;s worth keeping and what to
                drop — so you decide on the numbers, not the pressure.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <span className="text-2xl font-bold text-white">$149–$299</span>
                <Link href="/services/fi-product-review/check" className={a.btn}>
                  Preview the F&amp;I review flow
                </Link>
                <Link href="/services" className="btn-ghost-light">
                  See all services
                </Link>
              </div>
              <p className="mt-4 max-w-2xl text-sm text-white/60">
                The full paid review is coming soon, and isn&apos;t purchasable yet —
                there&apos;s nothing to buy or book on this page. You can try the free{" "}
                <strong>pilot preview</strong> now: it&apos;s a buyer-side
                decision-support tool, collects no payment, and doesn&apos;t replace
                the full F&amp;I Product Review.
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
                You&apos;re sitting in the finance office, a screen full of
                products in front of you, every one pitched as a smart, limited-time
                add to the payment. This review gives you a buyer-side read on each
                one — whether it&apos;s fairly priced, overpriced, or something you
                should walk back — before you sign, and even after, while you can
                still cancel.
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
                  A product-by-product breakdown with a fair-range estimate for
                  each, shown as a range with a confidence level — never a fake
                  exact &quot;fair price.&quot;
                </Receive>
                <Receive accent={ACCENT}>
                  A clear keep / drop / challenge recommendation on every line.
                </Receive>
                <Receive accent={ACCENT}>
                  Plain-English notes on what each product actually covers, and
                  where the gaps are.
                </Receive>
                <Receive accent={ACCENT}>
                  Cancellation pointers for anything already signed that&apos;s not
                  worth keeping.
                </Receive>
              </ul>
            </Block>

            {/* How the recommendation works */}
            <Block title="How the recommendation works" accent={ACCENT} delay={60}>
              <p className="text-slate">
                Each product gets one of five plain labels, so you know exactly
                where it stands:
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
                  Driveway Advocate does not sell warranties, GAP, insurance, or
                  protection products, and does not receive commissions from product
                  providers. This is decision support, not financial, legal, tax,
                  or insurance advice — a reference point so you can decide for
                  yourself.
                </p>
              </div>
            </Block>

            {/* What the full review will include */}
            <Block title="What the full review will include" accent={ACCENT} delay={60}>
              <p className="-mt-1 mb-4 text-slate">
                The paid review pairs the instant pilot flow with a human reviewer
                who reads your actual paperwork and lays out a buyer-side plan:
              </p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {FULL_REVIEW_INCLUDES.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-slate">
                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${a.bar}`} />
                    {it}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/services/fi-product-review/sample-report"
                  className="btn-secondary"
                >
                  View a sample report
                </Link>
                <Link
                  href="/services/fi-product-review/check"
                  className="btn-secondary"
                >
                  Preview the pilot review flow
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
