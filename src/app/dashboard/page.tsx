import Link from "next/link";
import { getBuyer, isBuyerAuthConfigured } from "@/lib/buyer-auth";
import { listDealsForUser } from "@/lib/deals";
import { listCasesForUser, listEngagementsForUser } from "@/lib/cases";
import { entitlementsFor } from "@/lib/entitlements";
import { recommendationsFor, isRecurringService } from "@/lib/dashboard/recommendations";
import { SERVICE_LABEL, SERVICE_HREF } from "@/lib/dashboard/labels";
import { isDealReviewResult } from "@/lib/deal-engine/is-deal-review";
import { AccountAuth } from "@/components/account/AccountAuth";
import { SignOutButton } from "@/components/account/SignOutButton";
import type { CaseRow, CaseStatus, DealRow } from "@/lib/types";

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
        <p className="text-xs font-bold uppercase tracking-wide text-blue">Deal Check</p>
        <p className="mt-2 font-bold text-navy">Run a full check</p>
        <p className="mt-1 text-sm text-slate">Score a deal&apos;s fees, APR, and add-ons.</p>
        <p className="mt-3 text-sm font-bold text-blue">Check a deal →</p>
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

  // Group cases by lifecycle so the board reads as "what's happening" not a dump.
  const inProgress = cases.filter((c) => IN_PROGRESS.has(c.status));
  const completed = cases.filter((c) => COMPLETED.has(c.status));

  // Recurring service lines (Credit-to-Keys, advocate, concierge) get their own
  // prominent section — these are the long-running engagements.
  const recurring = engagements.filter((e) => isRecurringService(e.service));
  const recommendations = recommendationsFor(engagements, cases, deals.length);

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

      {/* Active services — long-running engagements (recurring service lines). */}
      {recurring.length > 0 && (
        <div className="mt-10">
          <SectionTitle>Active services</SectionTitle>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recurring.map((e) => (
              <div key={e.id} className="rounded-2xl border border-edge bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-navy">{SERVICE_LABEL[e.service]}</p>
                  <span className="rounded-full bg-verdict-green/10 px-2.5 py-0.5 text-xs font-bold text-green-dark">
                    {e.status === "active" ? "Active" : "Closed"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate">Started {new Date(e.created_at).toLocaleDateString()}</p>
                <Link href={SERVICE_HREF[e.service]} className="mt-3 inline-block text-sm font-bold text-blue hover:underline">
                  Open →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-progress cases — units of work currently moving. */}
      <div className="mt-10">
        <SectionTitle>In progress</SectionTitle>
        {inProgress.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-edge bg-white p-6 text-slate shadow-card">
            <p className="font-semibold text-navy">Nothing in progress.</p>
            <p className="mt-1 text-sm">Start a quote review, plan, or post-sale check and it&apos;ll show up here.</p>
          </div>
        ) : (
          <CaseList cases={inProgress} />
        )}
      </div>

      {/* Recommendations — derived from the buyer's state, not generic cards. */}
      <div className="mt-10">
        <SectionTitle>Recommended next steps</SectionTitle>
        <div className="mt-3 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((r) => (
            <Link key={r.id + r.href} href={r.href} className="rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lift">
              <p className="font-bold text-navy">{r.title}</p>
              <p className="mt-1 text-sm text-slate">{r.body}</p>
              <p className="mt-3 text-sm font-bold text-blue">{r.cta} →</p>
            </Link>
          ))}
        </div>
        {!ent.can_view_reports && (
          <p className="mt-3 text-sm text-slate">
            Tip: run a full Deal Check to unlock a fee-by-fee report on your deal.
          </p>
        )}
      </div>

      {/* Saved deals — scan/review artifacts the buyer can reopen. */}
      {deals.length > 0 && (
        <div className="mt-10">
          <SectionTitle>Saved deals &amp; scans</SectionTitle>
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

      {/* Completed cases — delivered/closed work, kept for the record. */}
      {completed.length > 0 && (
        <div className="mt-10">
          <SectionTitle>Completed</SectionTitle>
          <CaseList cases={completed} />
        </div>
      )}
    </div>
  );
}

/** Case-status buckets for the dashboard groupings. */
const IN_PROGRESS = new Set<CaseStatus>([
  "submitted",
  "review_requested",
  "in_review",
  "needs_customer_info",
  "ready_for_delivery",
  "active",
]);
const COMPLETED = new Set<CaseStatus>(["delivered", "payment_pending", "closed"]);

/** Reusable list of case rows with status pills. */
function CaseList({ cases }: { cases: CaseRow[] }) {
  return (
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
  );
}
