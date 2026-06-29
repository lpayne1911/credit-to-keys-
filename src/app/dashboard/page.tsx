import Link from "next/link";
import { SAMPLE_MARKET_RESPONSE } from "@/lib/sample-marketcheck";
import { money } from "@/components/market-check/parts";

export const metadata = { title: "Dashboard — Driveway Advocate" };

export default function DashboardHome() {
  const s = SAMPLE_MARKET_RESPONSE.snapshot;
  const v = SAMPLE_MARKET_RESPONSE.vehicle;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Welcome back, Alex</h1>
      <p className="mt-1 text-slate">Here&apos;s what&apos;s happening with your deals.</p>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/market-check" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
          <p className="text-xs font-bold uppercase tracking-wide text-blue">Latest Market Check</p>
          <p className="mt-2 font-bold text-navy">{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</p>
          <p className="mt-1 text-sm text-slate">Target price {money(s.targetPrice)} · {money(s.dealerAskingPrice)} asking</p>
          <p className="mt-3 text-sm font-bold text-blue">Open report →</p>
        </Link>
        <Link href="/quote-review" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
          <p className="text-xs font-bold uppercase tracking-wide text-green-dark">Review a quote</p>
          <p className="mt-2 font-bold text-navy">Have dealer paperwork?</p>
          <p className="mt-1 text-sm text-slate">Compare market data to your actual offer.</p>
          <p className="mt-3 text-sm font-bold text-green-dark">Review my quote →</p>
        </Link>
        <Link href="/build-my-plan" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
          <p className="text-xs font-bold uppercase tracking-wide text-blue">Build a plan</p>
          <p className="mt-2 font-bold text-navy">Still shopping?</p>
          <p className="mt-1 text-sm text-slate">Target numbers and a negotiation game plan.</p>
          <p className="mt-3 text-sm font-bold text-blue">Build my plan →</p>
        </Link>
      </div>
    </div>
  );
}
