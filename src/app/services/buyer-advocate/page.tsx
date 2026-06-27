import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Buyer Advocate — Driveway Advocate",
  description:
    "Buyer-side help from before you've picked the car: shortlist, market scan, dealer outreach, quote comparison, negotiation plan, and final paperwork review.",
};

const REVIEWS = [
  "Your goals, budget, and must-haves",
  "Candidate vehicles and trims",
  "Market pricing across listings",
  "Dealer quotes and their fine print",
  "Out-the-door structure on each offer",
  "Negotiation leverage and walk-away points",
  "Final paperwork before you sign",
];

const PROCESS = [
  {
    title: "Buyer goals and budget",
    body: "We start with what you actually need and what you can comfortably spend.",
  },
  {
    title: "Vehicle shortlist",
    body: "A focused list of vehicles and trims worth your time — and why.",
  },
  {
    title: "Market scan",
    body: "What comparable cars are really going for, shown as ranges with confidence.",
  },
  {
    title: "Dealer outreach plan",
    body: "Who to contact and how, so you control the conversation from the start.",
  },
  {
    title: "Quote comparison",
    body: "Offers lined up side by side, with the junk and the markups surfaced.",
  },
  {
    title: "Negotiation plan",
    body: "A clear target, your leverage, and the points where you walk.",
  },
  {
    title: "Final paperwork review",
    body: "A last buyer-side pass over the numbers before anything gets signed.",
  },
];

export default function BuyerAdvocatePage() {
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
            Buyer Advocate
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-xl italic text-gold-dark">
            “Help me buy the right car.”
          </p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            For buyers who haven&apos;t picked the car yet. We&apos;re in your
            corner from the very start — shaping the shortlist, scanning the
            market, planning the outreach, comparing the quotes, and reviewing the
            paperwork — so the whole purchase runs on your side&apos;s terms.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-serif text-2xl font-bold text-navy">
              $899–$1,499
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
              The cheapest way to win a car deal is to be set up well before you
              ever talk price. Buyer Advocate puts a pro beside you from the
              beginning — so you walk into every dealer conversation already
              knowing the car, the market, and the number you&apos;ll hold to.
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
                A vetted shortlist matched to your goals and budget.
              </Receive>
              <Receive>
                A market scan and quote comparison, with pricing shown as ranges
                and confidence levels — never a fake exact &quot;fair price.&quot;
              </Receive>
              <Receive>
                A dealer-outreach strategy and a negotiation plan with clear
                targets and walk-away points.
              </Receive>
              <Receive>
                A final buyer-side review of the paperwork before you sign.
              </Receive>
            </ul>
          </Block>

          {/* Recommended process */}
          <Block title="Recommended process">
            <ol className="space-y-3">
              {PROCESS.map((p, i) => (
                <li
                  key={p.title}
                  className="flex gap-4 rounded-xl border border-navy/10 bg-cream-100 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 font-serif text-lg font-semibold text-gold-dark">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-serif text-base font-semibold text-navy">
                      {p.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-navy/65">
                      {p.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>

          {/* What this is not */}
          <Block title="What this is not">
            <div className="rounded-xl border border-navy/10 bg-white p-5 shadow-card">
              <p className="text-navy/70">
                This is advocacy and decision support, not financial advice,
                legal advice, or insurance advice — and not a guarantee of a
                specific price, loan approval, vehicle availability, trade value,
                or dealer response. You stay the decision-maker the whole way.
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
