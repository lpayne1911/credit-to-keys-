import Link from "next/link";
import { redirect } from "next/navigation";
import { getBuyer } from "@/lib/buyer-auth";
import { listCasesForUser, listEngagementsForUser } from "@/lib/cases";
import { billingSummary, billingIsEmpty } from "@/lib/billing/derive";
import { isPaymentsEnabled, PAYMENTS_PLACEHOLDER_NOTE } from "@/lib/billing/payments";
import { SERVICE_LABEL, SERVICE_HREF } from "@/lib/dashboard/labels";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import type { CaseRow } from "@/lib/types";

export const metadata = { title: "Billing — Driveway Advocate" };
export const dynamic = "force-dynamic";

function caseHref(c: CaseRow): string {
  if (!c.deal_id) return "/dashboard";
  return c.type === "quote_review" ? `/deal-review/${c.deal_id}` : `/verdict/${c.deal_id}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {children}
    </div>
  );
}

function CaseRows({ cases, note }: { cases: CaseRow[]; note?: (c: CaseRow) => string }) {
  return (
    <div className="mt-3 divide-y divide-edge overflow-hidden rounded-2xl border border-edge bg-white shadow-card">
      {cases.map((c) => (
        <Link key={c.id} href={caseHref(c)} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-cream/50">
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{c.title ?? SERVICE_LABEL[c.type]}</p>
            <p className="text-xs text-slate">
              {SERVICE_LABEL[c.type]} · {new Date(c.created_at).toLocaleDateString()}
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-slate">{note?.(c) ?? "View →"}</span>
        </Link>
      ))}
    </div>
  );
}

export default async function BillingPage() {
  const buyer = await getBuyer();
  if (!buyer) redirect("/login?redirectTo=/billing");

  const [cases, engagements] = await Promise.all([
    listCasesForUser(buyer.id),
    listEngagementsForUser(buyer.id),
  ]);
  const summary = billingSummary(engagements, cases);
  const empty = billingIsEmpty(summary);
  const paymentsEnabled = isPaymentsEnabled();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">Billing &amp; payments</h1>
        <p className="mt-1 text-slate">Signed in as {buyer.email ?? "your account"}.</p>

        {/* How billing works — the capture-after-delivery model, stated plainly. */}
        <div className="mt-6 rounded-2xl border border-blue/20 bg-blue-soft p-5">
          <p className="text-sm font-bold text-blue-dark">How billing works</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            <li>• No subscriptions or tiers — you only pay for a service you engage.</li>
            <li>• You&apos;re charged <span className="font-semibold">after</span> a deliverable is published to your dashboard — never up front.</li>
            <li>• Long-running services like Credit-to-Keys are billed monthly in arrears.</li>
          </ul>
        </div>

        {empty ? (
          <div className="mt-8 rounded-2xl border border-edge bg-white p-6 text-slate shadow-card">
            <p className="font-semibold text-navy">Nothing to bill yet.</p>
            <p className="mt-1 text-sm">
              When you engage a paid service and we deliver it, charges show up here.
            </p>
            <Link href="/dashboard" className="mt-3 inline-block text-sm font-bold text-blue hover:underline">
              Back to your workspace →
            </Link>
          </div>
        ) : (
          <>
            {summary.paymentDue.length > 0 && (
              <Section title="Payment due">
                <p className="mt-1 text-sm text-slate">Delivered work — a charge may be captured for these.</p>
                <CaseRows cases={summary.paymentDue} note={() => "Delivered"} />
                {/* Payments placeholder — Stripe is wired before launch. */}
                <div className="mt-3 flex flex-col items-start gap-2 rounded-2xl border border-dashed border-edge-strong bg-cream-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate">{PAYMENTS_PLACEHOLDER_NOTE}</p>
                  <button
                    type="button"
                    disabled={!paymentsEnabled}
                    className="btn-primary cursor-not-allowed opacity-60"
                    aria-disabled={!paymentsEnabled}
                  >
                    {paymentsEnabled ? "Pay now" : "Pay (opens before launch)"}
                  </button>
                </div>
              </Section>
            )}

            {summary.activeRecurring.length > 0 && (
              <Section title="Active services">
                <p className="mt-1 text-sm text-slate">Billed monthly in arrears while active.</p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {summary.activeRecurring.map((e) => (
                    <div key={e.id} className="rounded-2xl border border-edge bg-white p-5 shadow-card">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-navy">{SERVICE_LABEL[e.service]}</p>
                        <span className="rounded-full bg-verdict-green/10 px-2.5 py-0.5 text-xs font-bold text-green-dark">Active</span>
                      </div>
                      <p className="mt-1 text-xs text-slate">Since {new Date(e.created_at).toLocaleDateString()}</p>
                      <Link href={SERVICE_HREF[e.service]} className="mt-3 inline-block text-sm font-bold text-blue hover:underline">
                        Manage →
                      </Link>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {summary.inProgress.length > 0 && (
              <Section title="In progress">
                <p className="mt-1 text-sm text-slate">Underway — nothing is due until it&apos;s delivered.</p>
                <CaseRows cases={summary.inProgress} note={() => "Nothing due yet"} />
              </Section>
            )}

            {summary.history.length > 0 && (
              <Section title="History">
                <CaseRows
                  cases={summary.history}
                  note={(c) => (c.status === "cancelled" ? "Cancelled" : "Completed")}
                />
              </Section>
            )}
          </>
        )}

        <p className="mt-8 text-xs leading-relaxed text-slate">
          Estimates and statuses here reflect your case activity. They aren&apos;t an invoice or a
          guarantee of charges. Buyer-side only — no commissions, no kickbacks.
        </p>
      </div>
    </DashboardShell>
  );
}
