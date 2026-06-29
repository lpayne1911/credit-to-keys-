import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MarketCheckReport } from "@/components/market-check/MarketCheckReport";
import { getMarketSnapshotById } from "@/lib/market-snapshots";

export const runtime = "nodejs";
// Saved reports are immutable snapshots, but new ones appear at new ids.
export const dynamic = "force-dynamic";

export const metadata = { title: "Saved Market Check — Driveway Advocate" };

export default async function SharedReportPage({ params }: { params: { id: string } }) {
  const response = await getMarketSnapshotById(params.id);
  if (!response) notFound();

  return (
    <>
      <SiteHeader />
      <main className="bg-cream">
        <div className="mx-auto max-w-6xl px-4 pt-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-white px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-slate">
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            Saved report
          </span>
        </div>
        {/* Already saved → no Save button; offer a fresh lookup instead. */}
        <MarketCheckReport response={response} enableSave={false} />
        <div className="mx-auto max-w-6xl px-4 pb-12 text-center">
          <Link href="/dashboard/market-check" className="btn-blue text-sm">
            Run a new Market Check
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
