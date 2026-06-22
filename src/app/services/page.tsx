import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Services & pricing — Driveway Advocate",
};

type Service = {
  name: string;
  fear: string; // the buyer's question, in their own words
  blurb: string;
  price: string;
  live?: boolean;
};

type Group = { tier: string; note?: string; services: Service[] };

const GROUPS: Group[] = [
  {
    tier: "Free front door",
    services: [
      {
        name: "Free Red-Flag Scan",
        fear: "Should I even be worried?",
        blurb:
          "Upload the worksheet and get a fast safe / suspicious / dangerous read — enough to know whether to slow down before you sign.",
        price: "Free",
        live: true,
      },
    ],
  },
  {
    tier: "Paid front door",
    services: [
      {
        name: "Deal Check",
        fear: "Is this quote fair?",
        blurb:
          "Fast review of the out-the-door price, dealer fees, taxes/title/doc separation, add-ons, payment structure, APR, and trade-in warning signs — with a clear sign / push back / walk call.",
        price: "$99–$149",
        live: true,
      },
      {
        name: "Junk Fee Audit",
        fear: "What can I challenge?",
        blurb:
          "A line-by-line challenge list of padded and bogus fees, with what each one should actually be — so you know exactly what to strike.",
        price: "$149–$249",
      },
      {
        name: "F&I Product Review",
        fear: "Should I buy — or cancel — this warranty, GAP, or add-on?",
        blurb:
          "We price-check the finance-office products against fair ranges and tell you what's worth keeping and what to drop.",
        price: "$149–$299",
      },
      {
        name: "Used-Car Risk Report",
        fear: "Is this car a mistake?",
        blurb:
          "Condition, history, title, and pricing red flags on a used vehicle — before you commit to a problem car.",
        price: "$199–$399",
      },
    ],
  },
  {
    tier: "Core",
    services: [
      {
        name: "Deal Rescue",
        fear: "Help me fix this offer.",
        blurb:
          "The full teardown: buyer's-order audit, junk-fee challenge list, F&I review, trade-in analysis, finance-term review, a target counteroffer, a word-for-word dealer script, and a coaching call.",
        price: "$349–$599",
      },
    ],
  },
  {
    tier: "Premium",
    services: [
      {
        name: "Buyer Advocate",
        fear: "Help me buy the right car.",
        blurb:
          "For buyers who haven't picked the car yet: shortlist, market pricing, dealer-outreach strategy, quote comparison, a negotiation plan, and final paperwork review.",
        price: "$899–$1,499",
      },
      {
        name: "Concierge",
        fear: "Handle the process with me.",
        blurb:
          "We manage the process directly, within legal limits — sourcing through signing, with you in control the whole way.",
        price: "$1,999+",
      },
    ],
  },
  {
    tier: "Flagship pathway",
    note: "Billed compliantly in stages — the credit work monthly in arrears, the car portion as its own flat fee, never as a pre-paid bundle.",
    services: [
      {
        name: "Credit-to-Keys",
        fear: "Fix my score, then help me buy.",
        blurb:
          "The denied-to-driving journey for buyers 3–9 months out: prepare the credit so it stops costing you, then the full buyer-side treatment when the score qualifies.",
        price: "Billed in stages",
      },
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-4xl px-4 pb-8 pt-12 sm:pt-16">
          <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
            Services &amp; pricing
          </span>
          <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-navy">
            Pick the help that fits your moment.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            Every product answers a real fear buyers have at the dealership. Start
            free, go deeper when you need to — and on every one of them,{" "}
            <strong>you&apos;re the only one paying us.</strong>
          </p>
        </section>

        {/* Buyer-side promise */}
        <section className="border-y border-navy/10 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-6 text-center text-navy/75">
            Paid by <span className="font-semibold text-gold-dark">you</span> —
            never the dealer, the lender, the finance office, or the warranty
            company. No commissions, no kickbacks, ever.
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-12">
          <div className="space-y-10">
            {GROUPS.map((g) => (
              <div key={g.tier}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="font-serif text-sm font-bold uppercase tracking-widest text-gold-dark">
                    {g.tier}
                  </h2>
                  <span className="h-px flex-1 bg-navy/10" />
                </div>
                {g.note && (
                  <p className="mb-4 text-sm text-navy/55">{g.note}</p>
                )}
                <div className="space-y-3">
                  {g.services.map((s) => (
                    <ServiceCard key={s.name} s={s} />
                  ))}
                </div>
              </div>
            ))}
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

function ServiceCard({ s }: { s: Service }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-card sm:flex-row sm:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-xl font-semibold text-navy">{s.name}</h3>
          {s.live ? (
            <span className="rounded-full bg-verdict-green/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-verdict-green">
              Live
            </span>
          ) : (
            <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          )}
        </div>
        <p className="mt-1 font-serif text-[15px] italic text-gold-dark">
          “{s.fear}”
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-navy/65">{s.blurb}</p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <span className="font-serif text-lg font-bold text-navy">{s.price}</span>
        {s.live ? (
          <Link href="/check" className="btn-primary px-5 py-2 text-sm">
            Start now
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-xl border border-navy/15 px-5 py-2 text-sm font-semibold text-navy/45">
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
}
