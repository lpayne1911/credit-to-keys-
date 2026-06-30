import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { FunnelIntake } from "@/components/funnels/FunnelIntake";

export const metadata = {
  title: "Credit-to-Keys — Driveway Advocate",
};

const STAGES = [
  {
    n: 1,
    label: "Prepare",
    title: "Get your credit buy-ready",
    body: "We read your reports the way a lender will, find what's quietly costing you points, and give you a month-by-month plan you actually act on. Disputes, utilization, and payment timing — in plain English.",
    billing: "Billed monthly, in arrears — only for work already done.",
  },
  {
    n: 2,
    label: "Qualify",
    title: "Hit the number that changes your rate",
    body: "We track toward the score tier that unlocks a real APR, not a subprime trap. When the numbers say you're ready, we tell you — and not a day sooner just to make a sale.",
    billing: "Same monthly billing. Cancel any month, no penalty.",
  },
  {
    n: 3,
    label: "Buy",
    title: "Bring in your advocate",
    body: "Now the buyer-side treatment kicks in: Deal Check, junk-fee challenge, F&I review, and a sign / push back / walk verdict — so the credit you just rebuilt doesn't get handed back at the finance desk.",
    billing: "Flat fee for the car help — its own price, never pre-paid.",
  },
];

export default function CreditToKeysPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero — the 3–9 month buyer */}
        <section className="mx-auto max-w-5xl px-4 pb-10 pt-12 sm:pt-16">
          <span className="inline-block rounded-full border border-edge bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy">
            Credit-to-Keys · the flagship pathway
          </span>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Don&apos;t let your credit be the thing that costs you the car.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            If you&apos;re <strong>3–9 months from buying</strong>, the most
            expensive mistake isn&apos;t the dealer&apos;s markup — it&apos;s
            walking in with a score that hands them a reason to charge you more.
            Credit-to-Keys fixes that first, then puts an advocate in your corner
            when it&apos;s time to sign.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="#start" className="btn-primary">
              Apply for Credit-to-Keys
            </Link>
            <Link href="/services" className="btn-secondary">
              See all services
            </Link>
          </div>
          <p className="mt-4 text-sm text-navy/50">
            The full pathway is rolling out now. Apply today — we&apos;ll reach out as
            the credit stages open for you.
          </p>
        </section>

        {/* The cost of a few points */}
        <section className="bg-navy text-cream">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">
              A few points is real money.
            </h2>
            <p className="mt-3 max-w-2xl text-cream/80">
              On a typical auto loan, the gap between a subprime and a prime rate
              can be <span className="font-semibold text-gold-light">thousands of dollars</span>{" "}
              over the life of the loan — for the exact same car. The dealer
              won&apos;t volunteer that. We get you across the line that moves you
              into a better tier <em>before</em> you ever sit at the finance desk.
            </p>
          </div>
        </section>

        {/* The three stages */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="font-serif text-3xl font-semibold text-navy">
            How the pathway works
          </h2>
          <p className="mt-2 max-w-2xl text-navy/60">
            One journey, billed honestly in stages — never as a pre-paid bundle.
          </p>
          <div className="mt-8 space-y-4">
            {STAGES.map((s) => (
              <div
                key={s.n}
                className="flex flex-col gap-4 rounded-2xl border border-navy/10 bg-white p-6 shadow-card sm:flex-row"
              >
                <div className="flex shrink-0 items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/8 font-serif text-lg font-semibold text-navy">
                    {s.n}
                  </span>
                  <span className="mt-2 font-serif text-sm font-bold uppercase tracking-widest text-navy/70 sm:hidden">
                    {s.label}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="hidden font-serif text-xs font-bold uppercase tracking-widest text-navy/70 sm:block">
                    {s.label}
                  </p>
                  <h3 className="font-serif text-xl font-semibold text-navy">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy/65">
                    {s.body}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-navy/45">
                    {s.billing}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How billing works — compliance-forward, sold as a feature */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="font-serif text-3xl font-semibold text-navy">
              How billing works — and why it protects you
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Promise
                title="You pay after the work, not before"
                body="Credit-prep stages are billed monthly, in arrears, for work already performed. No large up-front fee, ever."
              />
              <Promise
                title="No pre-paid bundle"
                body="The credit work and the car help are priced and billed separately. You're never locked into paying for help you haven't received."
              />
              <Promise
                title="Cancel any month"
                body="Stop whenever you like, with no penalty. You only pay through the work that's already been done."
              />
              <Promise
                title="Nothing we do, you couldn't"
                body="You can dispute items on your own credit reports for free. We're the expertise, structure, and accountability — not a gatekeeper to your own rights."
              />
            </div>
            <div className="mt-6 rounded-xl border border-navy/10 bg-cream-100 px-4 py-3">
              <p className="text-xs leading-relaxed text-navy/60">
                <span className="font-semibold text-navy/75">
                  Credit preparation, not a guarantee.
                </span>{" "}
                We coach and help you organize the credit work — we don&apos;t
                promise a specific score increase, and no honest provider can.
                Results depend on your reports and your follow-through. You have
                the right to dispute inaccurate items yourself at no cost, and to
                cancel at any time.
              </p>
            </div>
          </div>
        </section>

        {/* Application + persistent disclaimer */}
        <section className="mx-auto max-w-3xl px-4 py-14">
          <div className="mb-6 text-center">
            <h2 className="font-serif text-2xl font-semibold text-navy">
              Start where you are.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-navy/65">
              Tell us your timeline and where your credit stands. We&apos;ll map your
              prepare → qualify → buy pathway and reach out as the stages open — no
              up-front fee, cancel any month.
            </p>
          </div>
          <FunnelIntake
            productId="credit-to-keys"
            accent="gold"
            cta="Apply for Credit-to-Keys"
            heading="Apply for Credit-to-Keys"
            blurb="A few quick questions. No payment now, no credit pull — we follow up by email."
          />
          <p className="mt-4 text-center text-sm text-navy/50">
            Prefer to start by checking a specific deal?{" "}
            <Link href="/deal-in-hand" className="font-semibold text-navy hover:underline">
              See your options →
            </Link>
          </p>
          <div className="mt-10">
            <Disclaimer />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Promise({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-cream-100 p-5">
      <h3 className="font-serif text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-navy/65">{body}</p>
    </div>
  );
}
