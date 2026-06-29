import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketCheckClient } from "@/components/market-check/MarketCheckClient";
import { SAMPLE_MARKET_RESPONSE } from "@/lib/sample-marketcheck";

export const metadata = {
  title: "Market Check — Driveway Advocate",
  description:
    "See comparable listings, the local market range, a fair target price, and dealer benchmarks for any vehicle — the market intelligence behind your Deal Score.",
};

export default function MarketCheckPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-soft">
              Market intelligence
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Market Check</h1>
            <p className="mt-2 max-w-2xl text-white/75">
              What is this vehicle, what are similar ones selling for nearby, is the price fair,
              how strong is the data, and what should you do next? The sample below shows a full
              report — check your own vehicle above it.
            </p>
          </div>
        </section>
        <div className="py-8">
          <MarketCheckClient initial={SAMPLE_MARKET_RESPONSE} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
