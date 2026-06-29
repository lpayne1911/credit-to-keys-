"use client";

/**
 * Junk Fee Audit — a free, instant, client-side lead-magnet tool.
 *
 * The buyer types in the fees from their worksheet; we run them through the
 * SAME fee logic the paid Deal Check uses ({@link auditFees}) and hand back a
 * line-by-line challenge list. No account, no upload, no server round-trip —
 * the fee rules carry no secrets, so the audit runs entirely in the browser.
 */
import { useState } from "react";
import Link from "next/link";
import { auditFees, type FeeAuditResult } from "@/lib/fairness-engine";
import { FlagCard } from "@/components/VerdictView";

type Row = { id: number; label: string; amount: string };

// Common worksheet line items — one tap pre-fills the label so a stressed
// buyer doesn't have to remember the dealer's exact wording.
const QUICK_ADD = [
  "Documentation fee",
  "Dealer prep",
  "Nitrogen tire fill",
  "VIN etching",
  "Paint / fabric protection",
  "Market adjustment",
  "Title / registration",
];

let nextId = 1;
function blankRow(label = ""): Row {
  return { id: nextId++, label, amount: "" };
}

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function JunkFeeAudit() {
  const [rows, setRows] = useState<Row[]>([blankRow(), blankRow()]);
  const [result, setResult] = useState<FeeAuditResult | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);

  function update(id: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow(label = "") {
    setRows((rs) => [...rs, blankRow(label)]);
  }
  function removeRow(id: number) {
    setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== id) : rs));
  }

  function runAudit() {
    const fees = rows
      .map((r) => ({ label: r.label.trim(), amount: Number(r.amount) }))
      .filter((f) => f.label && Number.isFinite(f.amount) && f.amount > 0);
    setReviewedCount(fees.length);
    setResult(auditFees(fees));
  }

  const canAudit = rows.some(
    (r) => r.label.trim() && Number(r.amount) > 0,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Input side */}
      <div className="card">
        <h2 className="text-xl font-semibold text-navy">
          Enter the fees from your worksheet
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Copy each line item and its amount. Add as many as you see.
        </p>

        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                type="text"
                value={row.label}
                onChange={(e) => update(row.id, { label: e.target.value })}
                placeholder="Fee name (e.g. Doc fee)"
                className="min-w-0 flex-1 rounded-lg border border-navy/15 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy/35 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <div className="relative w-28 shrink-0">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-navy/40">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.amount}
                  onChange={(e) => update(row.id, { amount: e.target.value })}
                  placeholder="0"
                  className="w-full rounded-lg border border-navy/15 bg-white py-2 pl-6 pr-2 text-sm text-navy placeholder:text-navy/35 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                aria-label="Remove fee"
                className="shrink-0 rounded-lg px-2 py-2 text-navy/35 transition hover:bg-navy-50 hover:text-navy/70"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addRow()}
          className="mt-3 text-sm font-semibold text-gold-dark hover:underline"
        >
          + Add another fee
        </button>

        <div className="mt-5 border-t border-navy/10 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
            Quick add
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {QUICK_ADD.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addRow(label)}
                className="rounded-full border border-navy/15 bg-cream-100 px-3 py-1 text-xs font-medium text-navy/70 transition hover:border-gold hover:text-navy"
              >
                + {label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={runAudit}
          disabled={!canAudit}
          className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40"
        >
          Audit my fees
        </button>
      </div>

      {/* Result side */}
      <div>
        {!result ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-navy/15 bg-white/50 p-8 text-center">
            <p className="text-sm text-navy/55">
              Your challenge list appears here. We only flag what&apos;s padded
              or junk — legitimate pass-through fees like title and registration
              stay off the list.
            </p>
          </div>
        ) : (
          <AuditResult result={result} reviewedCount={reviewedCount} />
        )}
      </div>
    </div>
  );
}

function AuditResult({
  result,
  reviewedCount,
}: {
  result: FeeAuditResult;
  reviewedCount: number;
}) {
  const { flags, estimatedSavings, challengeCount, assumptions } = result;
  return (
    <div className="space-y-5">
      {/* Headline */}
      <div className="overflow-hidden rounded-2xl bg-gold/10 ring-1 ring-gold/30">
        <div className="p-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/55">
            Fee audit
          </p>
          <p className="mt-1 text-2xl font-semibold text-navy">
            {challengeCount === 0
              ? `Nothing to challenge in the ${reviewedCount} ${
                  reviewedCount === 1 ? "fee" : "fees"
                } you entered.`
              : `${challengeCount} ${
                  challengeCount === 1 ? "fee" : "fees"
                } worth challenging.`}
          </p>
          <p className="mt-1 text-sm text-navy/60">
            We reviewed {reviewedCount}{" "}
            {reviewedCount === 1 ? "fee" : "fees"}. Legitimate pass-through
            charges aren&apos;t flagged.
          </p>
        </div>
        {estimatedSavings && (
          <div className="border-t border-gold/20 bg-white/60 px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/55">
              Potentially on the table
            </p>
            <p className="mt-0.5 text-3xl font-bold text-gold-dark">
              {money(estimatedSavings.low)}–{money(estimatedSavings.high)}
            </p>
            <p className="mt-1 text-sm text-navy/60">
              If you push back on the fees below. An estimate, not a guarantee.
            </p>
          </div>
        )}
      </div>

      {/* Challenge list */}
      {flags.length > 0 ? (
        <ul className="space-y-3">
          {flags.map((f, i) => (
            <FlagCard key={i} flag={f} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-verdict-green/20 bg-verdict-green/5 p-4 text-sm text-navy/70">
          None of these tripped our junk-fee rules. That doesn&apos;t mean every
          number is right — always confirm title and registration match your
          state&apos;s actual charges — but nothing here looks like classic
          padding.
        </p>
      )}

      {/* Upgrade CTA */}
      <div className="rounded-xl border border-navy/10 bg-navy p-5 text-cream">
        <p className="text-lg font-semibold text-white">
          Want the whole deal checked?
        </p>
        <p className="mt-1 text-sm text-cream/80">
          Fees are one of eight places buyers get worked. A full Deal Check also
          looks at the price, financing APR, trade-in, and the finance-office
          add-ons — with a sign / push back / walk verdict.
        </p>
        <Link
          href="/check"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold-light"
        >
          Run a full Deal Check
        </Link>
      </div>

      {/* Assumptions */}
      {assumptions.length > 0 && (
        <details className="rounded-xl border border-navy/10 bg-white p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy/70">
            How we estimated this (assumptions)
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-xs text-navy/60">
            {assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
