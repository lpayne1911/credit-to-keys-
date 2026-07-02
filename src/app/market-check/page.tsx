import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketCheckClient } from "@/components/market-check/MarketCheckClient";
import { SAMPLE_MARKET_RESPONSE } from "@/lib/sample-marketcheck";

export const metadata = {
  title: "Market Check — Driveway Advocate",
  description:
    "See what a vehicle actually sells for near you: comparable local listings, market range and median, a suggested target price, and safety/recall data.",
};

// Public Market Check — the same MarketCheckClient the dashboard uses, seeded
// with the SAMPLE report so the page is useful before any lookup. When the
// buyer runs a real search, MarketCheckClient calls POST /api/market-check,
// which returns live MarketCheck data when MARKETCHECK_API_KEY is set and the
// deterministic mock (badged SAMPLE) otherwise.
export default function MarketCheckPage() {
  return (
    <>
      <SiteHeader />
      <main className="bg-cream py-6">
        <div className="mx-auto max-w-6xl px-4 pb-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
            Market Check
          </h1>
          <p className="mt-1 max-w-2xl text-slate">
            Compare a vehicle to the local market before you negotiate — comparable
            listings, the market range, and a suggested target price.
          </p>
        </div>
        <MarketCheckClient initial={SAMPLE_MARKET_RESPONSE} />
      </main>
      <SiteFooter />
    </>
  );
}
