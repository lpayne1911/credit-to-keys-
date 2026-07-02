import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { FUNNELS, ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { FunnelIcon, type FunnelIconName } from "@/components/funnels/icons";

export const metadata = {
  title: "Services & pricing — Driveway Advocate",
  description:
    "Pick the level of help that fits your moment: Quote Review, Build My Plan, Concierge, or Deal Rescue. Flat fees, paid only by you.",
};

/**
 * Focused services / deeper dives — secondary to the four primary funnels above.
 * Each links to its own detail page. These remain "Soon" (not yet purchasable),
 * so every card carries an honest status tag rather than a live checkout CTA.
 */
type FocusedService = {
  name: string;
  blurb: string;
  price: string;
  href: string;
  accent: Accent;
  icon: FunnelIconName;
};

const FOCUSED_SERVICES: FocusedService[] = [
  {
    name: "F&I Product Review",
    blurb:
      "Price-check the finance-office products — warranty, GAP, add-ons — against fair ranges, with what's worth keeping and what to drop.",
    price: "$149–$299",
    href: "/services/fi-product-review",
    accent: "green",
    icon: "clipboard",
  },
  {
    name: "Used-Car Risk Report",
    blurb:
      "Condition, history, title, and pricing red flags on a used vehicle — a clear read before you commit to a problem car.",
    price: "$199–$399",
    href: "/services/used-car-risk-report",
    accent: "blue",
    icon: "shieldAlert",
  },
  {
    name: "Deal Teardown",
    blurb:
      "Before you sign: the full teardown — buyer's-order audit, junk-fee challenge list, F&I review, trade analysis, a target counteroffer, and a dealer script.",
    price: "$349–$599",
    href: "/services/deal-rescue",
    accent: "green",
    icon: "listCheck",
  },
  {
    name: "Buyer Advocate",
    blurb:
      "Haven't picked the car yet? Shortlist, market pricing, dealer outreach, quote comparison, and a negotiation plan.",
    price: "$899–$1,499",
    href: "/services/buyer-advocate",
    accent: "blue",
    icon: "handshake",
  },
  {
    name: "Concierge",
    blurb:
      "We manage the process with you, within legal limits — from sourcing through signing, with you in control the whole way.",
    price: "$1,999+",
    href: "/services/concierge",
    accent: "gold",
    icon: "headset",
  },
];

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Pick the help that fits your moment.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/75">
              Four buyer-side paths, flat fees, and one promise: you&apos;re the only one paying
              us — never the dealer, lender, finance office, or warranty company.
            </p>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FUNNELS.map((f) => {
                const a = ACCENT_CLASSES[f.accent];
                return (
                  <div key={f.id} className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
                      <FunnelIcon name={f.heroIcon} className="h-6 w-6" />
                    </span>
                    <h2 className="mt-4 text-lg font-bold text-navy">{f.homeTitle}</h2>
                    <p className="mt-1 text-sm text-slate">{f.homeCopy}</p>
                    <p className={`mt-4 text-2xl font-extrabold tracking-tight ${a.text}`}>
                      {f.pricing.amount}
                    </p>
                    {f.pricing.sub && <p className="mt-1 text-xs text-slate">{f.pricing.sub}</p>}
                    <Link href={f.route} className={`${a.btn} mt-5 w-full text-sm`}>
                      {f.homeCta}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Focused services & deeper dives — secondary to the four paths above. */}
        <section className="border-t border-edge bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-slate">
                Focused services &amp; deeper dives
              </p>
              <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">
                Need help with one specific part of the deal?
              </h2>
              <p className="mt-2 text-slate">
                These focused programs go deep on a single question. They&apos;re launching soon —
                read what each one covers, and start with the free tools today.
              </p>
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FOCUSED_SERVICES.map((s) => {
                const a = ACCENT_CLASSES[s.accent];
                return (
                  <Link
                    key={s.href}
                    href={s.href}
                    className="lift flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
                        <FunnelIcon name={s.icon} className="h-6 w-6" />
                      </span>
                      <span className="rounded-full bg-cream-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate">
                        Soon
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-navy">{s.name}</h3>
                    <p className="mt-1 flex-1 text-sm text-slate">{s.blurb}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className={`text-base font-bold ${a.text}`}>{s.price}</span>
                      <span className={`text-sm font-semibold ${a.text}`}>Learn more →</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-10">
              <Disclaimer />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
