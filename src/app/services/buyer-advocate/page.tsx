import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { Reveal } from "@/components/ui/Reveal";

export const metadata = {
  title: "Buyer Advocate — Driveway Advocate",
  description:
    "Buyer-side help from before you've picked the car: shortlist, market scan, dealer outreach, quote comparison, negotiation plan, and final paperwork review.",
};

const ACCENT: Accent = "blue";

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
                Buyer Advocate
              </h1>
              <p className={`mt-4 max-w-2xl text-lg font-semibold ${a.text}`}>
                “Help me buy the right car.”
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
                For buyers who haven&apos;t picked the car yet. We&apos;re in your
                corner from the very start — shaping the shortlist, scanning the
                market, planning the outreach, comparing the quotes, and reviewing the
                paperwork — so the whole purchase runs on your side&apos;s terms.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <span className="text-2xl font-bold text-white">$899–$1,499</span>
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
                The cheapest way to win a car deal is to be set up well before you
                ever talk price. Buyer Advocate puts a pro beside you from the
                beginning — so you walk into every dealer conversation already
                knowing the car, the market, and the number you&apos;ll hold to.
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
                  A vetted shortlist matched to your goals and budget.
                </Receive>
                <Receive accent={ACCENT}>
                  A market scan and quote comparison, with pricing shown as ranges
                  and confidence levels — never a fake exact &quot;fair price.&quot;
                </Receive>
                <Receive accent={ACCENT}>
                  A dealer-outreach strategy and a negotiation plan with clear
                  targets and walk-away points.
                </Receive>
                <Receive accent={ACCENT}>
                  A final buyer-side review of the paperwork before you sign.
                </Receive>
              </ul>
            </Block>

            {/* Recommended process */}
            <Block title="Recommended process" accent={ACCENT} delay={60}>
              <ol className="space-y-3">
                {PROCESS.map((p, i) => (
                  <li
                    key={p.title}
                    className="flex gap-4 rounded-2xl border border-edge bg-white p-5 shadow-card"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${a.bar} text-lg font-bold text-white`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-base font-bold text-navy">{p.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate">
                        {p.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Block>

            {/* What this is not */}
            <Block title="What this is not" accent={ACCENT} delay={60}>
              <div className="card">
                <p className="text-slate">
                  This is advocacy and decision support, not financial advice,
                  legal advice, or insurance advice — and not a guarantee of a
                  specific price, loan approval, vehicle availability, trade value,
                  or dealer response. You stay the decision-maker the whole way.
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
