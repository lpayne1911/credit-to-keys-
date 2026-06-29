import Link from "next/link";
import { MarketCheckClient } from "@/components/market-check/MarketCheckClient";
import { SAMPLE_MARKET_RESPONSE } from "@/lib/sample-marketcheck";

export const metadata = { title: "Market Check — Driveway Advocate" };

// Seeded with the SAMPLE report so the page is useful before any lookup. When
// the buyer runs a real search, MarketCheckClient calls POST /api/market-check,
// which returns live MarketCheck data when MARKETCHECK_API_KEY is set and the
// deterministic mock (badged SAMPLE) otherwise.
export default function DashboardMarketCheckPage() {
  return (
    <div className="py-6">
      <div className="mx-auto max-w-6xl px-4 pb-2">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
          ← Back to dashboard
        </Link>
      </div>
      <MarketCheckClient initial={SAMPLE_MARKET_RESPONSE} />
    </div>
  );
}
