import Link from "next/link";
import { getBuyer, isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { listDealsForUser } from "@/lib/deals";
import { listCasesForUser, listEngagementsForUser } from "@/lib/cases";
import { entitlementsFor } from "@/lib/entitlements";
import { isDealReviewResult } from "@/lib/deal-engine/is-deal-review";
import { AccountAuth } from "@/components/account/AccountAuth";
import { SignOutButton } from "@/components/account/SignOutButton";
import type { CaseRow, CaseStatus, DealRow, EngagementService } from "@/lib/types";

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

const SERVICE_LABEL: Record<EngagementService, string> = {
  deal_check: "Deal Check",
  quote_review: "Quote Review",
  deal_rescue: "Deal Rescue",
  buyer_advocate: "Buyer Advocate",
  credit_to_keys: "Credit-to-Keys",
  concierge: "Concierge",
};

const CASE_STATUS: Record<CaseStatus, { label: string; style: string }> = {
  scanned: { label: "Scanned", style: "bg-navy/10 text-navy" },
  submitted: { label: "Submitted", style: "bg-blue/10 text-blue" },
  review_requested: { label: "Review requested", style: "bg-blue/10 text-blue" },
  in_review: { label: "In review", style: "bg-blue/10 text-blue" },
  needs_customer_info: { label: "Needs your input", style: "bg-verdict-amber/10 text-amber-700" },
  ready_for_delivery: { label: "Almost ready", style: "bg-blue/10 text-blue" },
  delivered: { label: "Delivered", style: "bg-verdict-green/10 text-green-dark" },
  payment_pending: { label: "Delivered", style: "bg-verdict-green/10 text-green-dark" },
  active: { label: "Active", style: "bg-verdict-green/10 text-green-dark" },
  closed: { label: "Closed", style: "bg-navy/10 text-navy/60" },
  cancelled: { label: "Cancelled", style: "bg-navy/10 text-navy/50" },
};

function caseHref(c: CaseRow): string {
  if (!c.deal_id) return "/dashboard";
  return c.type === "quote_review" ? `/deal-review/${c.deal_id}` : `/verdict/${c.deal_id}`;
}

function dealHref(d: DealRow): string {
  return isDealReviewResult(d.auto_result) ? `/deal-review/${d.id}` : `/verdict/${d.id}`;
}

function ActionCards() {
  return (
    <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        <p className="text-xs font-bold uppercase tracking-wide text-blue">Free Red Flag Scan</p>
        <p className="mt-2 font-bold text-navy">Spot the red flags fast</p>
        <p className="mt-1 text-sm text-slate">A free scan of a deal&apos;s fees, APR, and add-ons.</p>
        <p className="mt-3 text-sm font-bold text-blue">Run my free scan →</p>
      </Link>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-navy">{children}</h2>;
}

export default async function DashboardHome() {
  const buyer = await getBuyer();

  // Logged out → sign in / create an account; tools remain usable without one.
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

  const [cases, engagements, deals] = await Promise.all([
    listCasesForUser(buyer.id),
    listEngagementsForUser(buyer.id),
    listDealsForUser(buyer.id),
  ]);
  // entitlements are derived from engagements + cases (never a tier).
  const ent = entitlementsFor(engagements, cases);
  const nextActions = cases.filter((c) => c.status === "needs_customer_info");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Your workspace</h1>
          <p className="mt-1 text-slate">Signed in as {buyer.email ?? "your account"}.</p>
        </div>
        <SignOutButton />
      </div>

      {/* Next Actions — the command-center heartbeat ("what do I do next?"). */}
      <div className="mt-8">
        <SectionTitle>Next actions</SectionTitle>
        {nextActions.length === 0 ? (
          <p className="mt-2 text-sm text-slate">You&apos;re all caught up — nothing needs your input right now.</p>
        ) : (
          <div className="mt-3 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-white shadow-card">
            {nextActions.map((c) => (
              <Link key={c.id} href={caseHref(c)} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/50">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{c.title ?? SERVICE_LABEL[c.type]}</p>
                  <p className="text-xs text-slate">{SERVICE_LABEL[c.type]} needs your input</p>
                </div>
                <span className="shrink-0 rounded-full bg-verdict-amber/10 px-3 py-1 text-xs font-bold text-amber-700">Action needed</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Cases — the units of work. */}
      <div className="mt-10">
        <SectionTitle>My cases</SectionTitle>
        {cases.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-edge bg-white p-6 text-slate shadow-card">
            <p className="font-semibold text-navy">No cases yet.</p>
            <p className="mt-1 text-sm">Run a Deal Check or review a quote below — anything you run while signed in opens a case here.</p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-white shadow-card">
            {cases.map((c) => {
              const s = CASE_STATUS[c.status];
              return (
                <Link key={c.id} href={caseHref(c)} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/50">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{c.title ?? "Your deal"}</p>
                    <p className="text-xs text-slate">
                      {SERVICE_LABEL[c.type]} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.style}`}>{s.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* My Services — the engagements (service lines) in play. */}
      {engagements.length > 0 && (
        <div className="mt-10">
          <SectionTitle>My services</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {engagements.map((e) => (
              <span key={e.id} className="rounded-full border border-edge bg-white px-3 py-1.5 text-sm font-semibold text-navy shadow-card">
                {SERVICE_LABEL[e.service]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations — signal-driven cross-sell (engine arrives in a later phase). */}
      <div className="mt-10">
        <SectionTitle>Recommended next steps</SectionTitle>
        <ActionCards />
        {!ent.can_view_reports && (
          <p className="mt-3 text-sm text-slate">
            Tip: run a full Deal Check to unlock a fee-by-fee report on your deal.
          </p>
        )}
      </div>

      {/* My Deals — saved scan/verdict history. */}
      {deals.length > 0 && (
        <div className="mt-10">
          <SectionTitle>My deals</SectionTitle>
          <div className="mt-3 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-white shadow-card">
            {deals.map((d) => {
              const verdict = d.reviewed_verdict ?? d.auto_verdict ?? "amber";
              const vehicle =
                [d.vehicle_year, d.vehicle_make, d.vehicle_model].filter(Boolean).join(" ") || "Your deal";
              return (
                <Link key={d.id} href={dealHref(d)} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/50">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{vehicle}</p>
                    <p className="text-xs text-slate">
                      {new Date(d.created_at).toLocaleDateString()} · {d.input_path === "upload" ? "Uploaded quote" : "Manual entry"}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${VERDICT_STYLE[verdict] ?? VERDICT_STYLE.amber}`}>
                    {VERDICT_LABEL[verdict] ?? "Reviewed"}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
