/**
 * Review console — list view. Private; gated by operator auth (Supabase Auth +
 * operator allowlist, see lib/console-auth.ts).
 *
 * This is the SEED of a future full operator console. It's intentionally
 * simple, but the data model (deals + findings + leads) and server-mediated
 * access are built so it can grow into a richer console without a rewrite.
 */
import Link from "next/link";
import { isConsoleAuthed, isConsoleConfigured } from "@/lib/console-auth";
import { listDeals } from "@/lib/deals";
import { ConsoleLogin } from "@/components/ConsoleLogin";
import { VerdictBadge } from "@/components/VerdictView";
import { LogoutButton } from "@/components/LogoutButton";
import type { DealRow } from "@/lib/types";

export const metadata = { title: "Review console — Driveway Advocate" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  review_requested: "Review requested",
  in_review: "In review",
  reviewed: "Reviewed",
  archived: "Archived",
};

export default async function ConsolePage() {
  if (!(await isConsoleAuthed())) {
    return (
      <main className="min-h-screen bg-navy/5 px-4 py-16">
        <ConsoleLogin configured={isConsoleConfigured()} />
      </main>
    );
  }

  const deals = await listDeals();

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-serif text-xl font-semibold">Review console</h1>
            <p className="text-xs text-cream/60">
              Operator area — v1 stopgap auth. Replace before launch.
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <p className="mb-4 text-sm text-navy/60">
          {deals.length} deal{deals.length === 1 ? "" : "s"} submitted.
        </p>

        {deals.length === 0 ? (
          <div className="card text-navy/60">
            No deals yet. Submissions from the Deal Check form will appear here.
            {/* If the DB isn't configured, listDeals() returns empty. */}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-100 text-xs uppercase tracking-wide text-navy/55">
                <tr>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Auto verdict</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/5">
                {deals.map((d: DealRow) => (
                  <tr key={d.id} className="hover:bg-cream-100/60">
                    <td className="px-4 py-3 font-medium text-navy">
                      {[d.vehicle_year, d.vehicle_make, d.vehicle_model]
                        .filter(Boolean)
                        .join(" ") || "—"}
                      <span className="ml-2 text-xs text-navy/40">
                        {d.input_path}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.auto_verdict ? (
                        <VerdictBadge verdict={d.auto_verdict} size="sm" />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          d.status === "review_requested"
                            ? "bg-gold/15 text-gold-dark"
                            : d.status === "reviewed"
                              ? "bg-verdict-green/10 text-verdict-green"
                              : "bg-navy-50 text-navy/60"
                        }`}
                      >
                        {STATUS_LABEL[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-navy/55">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/console/${d.id}`}
                        className="font-medium text-gold-dark hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
