/**
 * Review console — list view. Private; gated by operator auth (Supabase Auth +
 * operator allowlist, see lib/console-auth.ts).
 *
 * This is the SEED of a future full operator console. It's intentionally
 * simple, but the data model (deals + findings + leads) and server-mediated
 * access are built so it can grow into a richer console without a rewrite.
 */
import Link from "next/link";
import { getConsoleOperator, isConsoleConfigured } from "@/lib/console-auth";
import { listDeals } from "@/lib/deals";
import { listProductIntakes, intakeContact, intakeUploadPath, type ProductIntakeRow } from "@/lib/intakes";
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
  closed: "Closed",
  archived: "Archived",
};

/** Console sections for product_intakes, in display order. Anything with an
 *  unknown product_id falls into the last bucket so no submission is hidden. */
const INTAKE_SECTIONS: { title: string; productIds: string[] }[] = [
  { title: "Build My Plan requests", productIds: ["build-my-plan"] },
  { title: "Concierge applications", productIds: ["concierge"] },
  { title: "Deal Rescue / post-sale requests", productIds: ["deal-rescue"] },
  { title: "Human Review requests", productIds: ["human-review"] },
];

const PRODUCT_LABEL: Record<string, string> = {
  "build-my-plan": "Build My Plan",
  concierge: "Concierge",
  "deal-rescue": "Deal Rescue",
  "human-review": "Human Review",
};

export default async function ConsolePage() {
  const me = await getConsoleOperator();
  if (!me) {
    return (
      <main className="min-h-screen bg-navy/5 px-4 py-16">
        <ConsoleLogin configured={isConsoleConfigured()} />
      </main>
    );
  }

  const [deals, intakes] = await Promise.all([listDeals(), listProductIntakes()]);

  const knownIds = new Set(INTAKE_SECTIONS.flatMap((s) => s.productIds));
  const sections = [
    ...INTAKE_SECTIONS.map((s) => ({
      title: s.title,
      rows: intakes.filter((i) => s.productIds.includes(i.product_id)),
    })),
    {
      title: "Other intakes",
      rows: intakes.filter((i) => !knownIds.has(i.product_id)),
    },
  ].filter((s) => s.rows.length > 0);

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="font-serif text-xl font-semibold">Review console</h1>
            <p className="text-xs text-cream/60">
              Signed in as {me.email}
              {me.role === "admin" ? " · admin" : ""}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {me.role === "admin" && (
              <Link
                href="/console/operators"
                className="text-sm text-cream/80 underline-offset-2 hover:underline"
              >
                Operators
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="font-serif text-lg font-semibold text-navy">
          Deal Reviews / Quote Reviews
        </h2>
        <p className="mb-4 mt-1 text-sm text-navy/60">
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

        {/* Human-service intakes (product_intakes) — grouped by product. */}
        <div className="mt-10">
          <h2 className="font-serif text-lg font-semibold text-navy">
            Service requests
          </h2>
          <p className="mb-4 mt-1 text-sm text-navy/60">
            {intakes.length} request{intakes.length === 1 ? "" : "s"} from Build My
            Plan, Concierge, Deal Rescue, and Human Review intakes.
          </p>

          {sections.length === 0 ? (
            <div className="card text-navy/60">
              No service requests yet. Submissions from the Build My Plan, Concierge,
              Deal Rescue, and Human Review intakes will appear here.
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((s) => (
                <section key={s.title}>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-navy/55">
                    {s.title} ({s.rows.length})
                  </h3>
                  <IntakeTable rows={s.rows} />
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function IntakeTable({ rows }: { rows: ProductIntakeRow[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-cream-100 text-xs uppercase tracking-wide text-navy/55">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Docs</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy/5">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-cream-100/60">
              <td className="px-4 py-3 font-medium text-navy">
                {PRODUCT_LABEL[r.product_id] ?? r.product_id}
              </td>
              <td className="px-4 py-3 text-navy/75">
                {intakeContact(r.payload) ?? "—"}
              </td>
              <td className="px-4 py-3 text-navy/55">
                {intakeUploadPath(r.payload) ? "📎 1 file" : "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === "review_requested"
                      ? "bg-gold/15 text-gold-dark"
                      : r.status === "closed"
                        ? "bg-navy-50 text-navy/60"
                        : "bg-verdict-green/10 text-verdict-green"
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </td>
              <td className="px-4 py-3 text-navy/55">
                {new Date(r.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/console/intakes/${r.id}`}
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
  );
}
