/**
 * PostSaleTriageView — renders a Post-Sale Triage result. Presentation only;
 * all copy and figures come from the post-sale-engine.
 */
import type { PostSaleTriageResult, CancelOutlook } from "@/lib/post-sale-engine/types";

function money(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const OUTLOOK: Record<CancelOutlook, { label: string; cls: string }> = {
  often_refundable: { label: "Often cancellable", cls: "bg-green-soft text-green-dark" },
  unlikely: { label: "Usually not refundable", cls: "bg-cream-100 text-slate" },
  unknown: { label: "Ask the provider", cls: "bg-orange-soft text-orange" },
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-edge bg-white p-5 shadow-card">
      <h2 className="text-sm font-bold uppercase tracking-wide text-red">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function PostSaleTriageView({ result }: { result: PostSaleTriageResult }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-red">Post-Sale Options</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-navy">Your next steps</h1>
        <p className="mt-2 text-slate">{result.summary}</p>
      </div>

      {/* Cooling-off reality */}
      <section className="rounded-2xl border border-red/20 bg-red-soft px-5 py-4">
        <p className="text-sm font-bold text-red-dark">Read this first</p>
        <p className="mt-1 text-sm leading-relaxed text-navy/75">{result.coolingOffNote}</p>
      </section>

      {/* Add-on triage */}
      {result.addOns.length > 0 && (
        <Card title="What you were sold">
          {result.estimatedRefundCeiling != null && (
            <p className="mb-3 text-sm text-slate">
              Up to <span className="font-bold text-navy">{money(result.estimatedRefundCeiling)}</span> paid across{" "}
              {result.cancellableCount} cancellable product{result.cancellableCount === 1 ? "" : "s"} — actual refunds are
              prorated and set by each contract.
            </p>
          )}
          <ul className="space-y-4">
            {result.addOns.map((a, i) => {
              const o = OUTLOOK[a.outlook];
              return (
                <li key={i} className="border-t border-edge pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-navy">{a.rawLabel}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${o.cls}`}>
                      {o.label}
                    </span>
                  </div>
                  {a.amount > 0 && (
                    <p className="mt-0.5 text-sm text-slate">
                      {money(a.amount)}
                      {a.financedIntoLoan ? " · financed into the loan" : ""}
                    </p>
                  )}
                  <p className="mt-1 text-sm leading-relaxed text-slate">{a.refundBasis}</p>
                  <p className="mt-1 text-sm leading-relaxed text-navy/70">
                    <span className="font-semibold">How to start:</span> {a.howToStart}
                  </p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Plan */}
      <Card title="Your action plan">
        <ol className="space-y-3">
          {result.plan.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red text-sm font-bold text-white">
                {s.n}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-navy">{s.title}</p>
                  {s.timing && (
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate">
                      {s.timing}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-slate">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Contacts */}
      <Card title="Who to contact">
        <ul className="space-y-3">
          {result.contacts.map((c, i) => (
            <li key={i} className="rounded-xl bg-cream-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-navy">{c.who}</p>
                {c.escalation && (
                  <span className="rounded-full bg-orange-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange">
                    Escalation
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate">{c.why}</p>
              <p className="mt-1 text-sm text-navy/70">{c.how}</p>
            </li>
          ))}
        </ul>
      </Card>

      {/* Documents */}
      <Card title="Documents to gather">
        <ul className="space-y-1.5">
          {result.documents.map((d, i) => (
            <li key={i} className="flex gap-2 text-sm text-navy/75">
              <span className="text-red">•</span>
              {d}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
