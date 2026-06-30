import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketCheckClient } from "@/components/market-check/MarketCheckClient";
import { SAMPLE_MARKET_RESPONSE } from "@/lib/sample-marketcheck";

export const metadata = {
  title: "Free Market Check — Driveway Advocate",
  description:
    "See real local pricing for the car you're shopping — before you walk into the dealership. Free, no signup required.",
};

/**
 * Public Market Check — the Still-Shopping lead magnet. Same MarketCheckClient
 * the dashboard uses, but with full site chrome and no login wall, seeded with a
 * SAMPLE report so it's useful before any lookup. The logged-in version lives at
 * /dashboard/market-check and is unchanged.
 */
export default function PublicMarketCheckPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <section className="border-b border-edge bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <Link
              href="/still-shopping"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-slate hover:text-navy"
            >
              ← Still shopping
            </Link>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Free Market Check
            </h1>
            <p className="mt-2 max-w-2xl text-slate">
              See real local pricing for the car you&apos;re shopping — before you walk in.
              No signup required. When you&apos;re ready, save your results to a free account
              and we&apos;ll build your plan from there.
            </p>
          </div>
        </section>

        <div className="py-6">
          <MarketCheckClient initial={SAMPLE_MARKET_RESPONSE} />
        </div>

        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 pb-14">
            <div className="rounded-2xl border border-edge bg-white p-6 shadow-card sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-navy">Like what you see? Build the plan.</p>
                <p className="mt-1 text-sm text-slate">
                  Turn this into a Target Deal Sheet with your numbers and a negotiation game plan.
                </p>
              </div>
              <Link href="/build-my-plan" className="btn-blue mt-4 inline-flex sm:mt-0">
                Build My Plan
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
