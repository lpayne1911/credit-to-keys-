import { getFunnel } from "@/lib/funnels";
import { FunnelPage } from "@/components/funnels/FunnelPage";
import { DealReviewSummarySample } from "@/components/funnels/samples";

export const metadata = {
  title: "Quote Review — before you sign | Driveway Advocate",
  description:
    "Have a dealer quote or buyer's order but haven't signed yet? We review your numbers, benchmark the price, flag junk fees and risky terms, and give you a pushback plan before you sign.",
};

const funnel = getFunnel("quote-review")!;

function TurnaroundCard() {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 p-5 text-white backdrop-blur">
      <p className="flex items-center gap-2 text-sm font-semibold text-white/70">
        <span className="h-2 w-2 rounded-full bg-green" /> Expected turnaround
      </p>
      <p className="mt-2 text-2xl font-extrabold leading-tight">Same day or next business day</p>
      <p className="mt-2 text-sm text-white/65">
        Turnaround depends on volume. Most reviews are completed quickly.
      </p>
      <p className="mt-4 text-xs text-white/55">Secure. Private. No commitment.</p>
    </div>
  );
}

export default function QuoteReviewPage() {
  return (
    <FunnelPage
      funnel={funnel}
      sideCard={<TurnaroundCard />}
      sample={<DealReviewSummarySample />}
    />
  );
}
