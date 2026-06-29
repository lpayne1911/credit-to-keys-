import Link from "next/link";
import { MarketCheckReport } from "@/components/market-check/MarketCheckReport";
import { SAMPLE_MARKET_RESPONSE } from "@/lib/sample-marketcheck";

export const metadata = { title: "Market Check — Driveway Advocate" };

export default function DashboardMarketCheckPage() {
  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue hover:underline">
          ← Back to Market Check
        </Link>
      </div>
      <MarketCheckReport response={SAMPLE_MARKET_RESPONSE} />
    </div>
  );
}
