import Link from "next/link";
import { getBuyer, isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { listDealsForUser } from "@/lib/deals";
import { isDealReviewResult } from "@/lib/deal-engine/is-deal-review";
import { AccountAuth } from "@/components/account/AccountAuth";
import { SignOutButton } from "@/components/account/SignOutButton";
import type { DealRow } from "@/lib/types";

export const metadata = { title: "Dashboard — Driveway Advocate" };
export const dynamic = "force-dynamic";

const VERDICT_STYLE: Record<string, string> = {
  green: "bg-verdict-green/10 text-green-dark",
  amber: "bg-verdict-amber/10 text-amber-700",
  red: "bg-verdict-red/10 text-verdict-red",
  black: "bg-navy/10 text-navy",
};
const VERDICT_LABEL: Record<string, string> = {
  green: "Looks fair",
  amber: "Negotiate first",
  red: "Don't sign yet",
  black: "Walk away",
};

function dealHref(d: DealRow): string {
  return isDealReviewResult(d.auto_result) ? `/deal-review/${d.id}` : `/verdict/${d.id}`;
}

function ActionCards() {
  return (
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <Link href="/dashboard/market-check" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
        <p className="text-xs font-bold uppercase tracking-wide text-blue">Market Check</p>
        <p className="mt-2 font-bold text-navy">What&apos;s a fair price?</p>
        <p className="mt-1 text-sm text-slate">Compare a vehicle to the live market.</p>
        <p className="mt-3 text-sm font-bold text-blue">Open Market Check →</p>
      </Link>
      <Link href="/quote-review" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
        <p className="text-xs font-bold uppercase tracking-wide text-green-dark">Review a quote</p>
        <p className="mt-2 font-bold text-navy">Have dealer paperwork?</p>
        <p className="mt-1 text-sm text-slate">Compare market data to your actual offer.</p>
        <p className="mt-3 text-sm font-bold text-green-dark">Review my quote →</p>
      </Link>
      <Link href="/check" className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
        <p className="text-xs font-bold uppercase tracking-wide text-blue">Deal Check</p>
        <p className="mt-2 font-bold text-navy">Run a full check</p>
        <p className="mt-1 text-sm text-slate">Score a deal&apos;s fees, APR, and add-ons.</p>
        <p className="mt-3 text-sm font-bold text-blue">Check a deal →</p>
      </Link>
    </div>
  );
}

export default async function DashboardHome() {
  const buyer = await getBuyer();

  // Logged out → sign in / create an account to see your saved deals.
  if (!buyer) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">Your workspace</h1>
        <p className="mt-1 max-w-prose text-slate">
          Sign in to save your deal checks and see them all in one place — or jump
          straight into the tools below.
        </p>
        <div className="mt-8">
          <AccountAuth configured={isBuyerAuthConfigured()} />
        </div>
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-wide text-slate">Tools (no account needed)</p>
          <ActionCards />
        </div>
      </div>
    );
  }

  const deals = await listDealsForUser(buyer.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Your workspace</h1>
          <p className="mt-1 text-slate">Signed in as {buyer.email ?? "your account"}.</p>
        </div>
        <SignOutButton />
      </div>

      <ActionCards />

      <div className="mt-10">
        <h2 className="text-lg font-bold text-navy">Your deal checks</h2>
        {deals.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-edge bg-white p-6 text-slate shadow-card">
            <p className="font-semibold text-navy">No checks yet.</p>
            <p className="mt-1 text-sm">
              Run a Deal Check or review a quote above — anything you run while
              signed in shows up here.
            </p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-white shadow-card">
            {deals.map((d) => {
              const verdict = d.reviewed_verdict ?? d.auto_verdict ?? "amber";
              const vehicle =
                [d.vehicle_year, d.vehicle_make, d.vehicle_model].filter(Boolean).join(" ") ||
                "Your deal";
              return (
                <Link
                  key={d.id}
                  href={dealHref(d)}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{vehicle}</p>
                    <p className="text-xs text-slate">
                      {new Date(d.created_at).toLocaleDateString()} ·{" "}
                      {d.input_path === "upload" ? "Uploaded quote" : "Manual entry"}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${VERDICT_STYLE[verdict] ?? VERDICT_STYLE.amber}`}>
                    {VERDICT_LABEL[verdict] ?? "Reviewed"}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
