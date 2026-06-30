"use client";

/**
 * Operator review editor. Lets an operator adjust the verdict, headline, and
 * red flags, then publish a reviewed verdict back to the customer.
 *
 * Publishing is the DELIVERY of the (currently free) review. If a paid review
 * is added later, charging may happen only at/after publish — never before.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  FairnessResult,
  Flag,
  FlagSeverity,
  FlagType,
  Verdict,
} from "@/lib/fairness-engine";
import { VERDICT_LABEL, FLAG_TYPES } from "@/lib/fairness-engine";
import { VerdictView, type LoanInputs } from "@/components/VerdictView";

const VERDICTS: Verdict[] = ["green", "amber", "red", "black"];

// Selected-state styling per verdict (Black = walk away, fraud/legal).
const VERDICT_BTN: Record<Verdict, string> = {
  green: "border-verdict-green bg-verdict-green/10 text-verdict-green",
  amber: "border-verdict-amber bg-verdict-amber/10 text-verdict-amber",
  red: "border-verdict-red bg-verdict-red/10 text-verdict-red",
  black: "border-navy-900 bg-navy-900/10 text-navy-900",
};
const SEVERITIES: FlagSeverity[] = ["info", "low", "medium", "high"];
// Canonical list from the engine — stays complete as new flag types are added.
const TYPES: FlagType[] = FLAG_TYPES;

export function ReviewEditor({
  dealId,
  initialVerdict,
  initialHeadline,
  initialFlags,
  autoResult = null,
  loan = null,
  vehicle = null,
}: {
  dealId: string;
  initialVerdict: Verdict;
  initialHeadline: string;
  initialFlags: Flag[];
  /** The automatic result, so the live preview can reuse warranty / assumptions / confidence. */
  autoResult?: FairnessResult | null;
  loan?: LoanInputs | null;
  vehicle?: { year?: number | null; make?: string | null; model?: string | null } | null;
}) {
  const router = useRouter();
  const [verdict, setVerdict] = useState<Verdict>(initialVerdict);
  const [headline, setHeadline] = useState(initialHeadline);
  const [flags, setFlags] = useState<Flag[]>(initialFlags);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateFlag(i: number, patch: Partial<Flag>) {
    setFlags((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function addFlag() {
    setFlags((fs) => [
      ...fs,
      {
        type: "info",
        severity: "medium",
        title: "",
        explanation: "",
      },
    ]);
  }
  function removeFlag(i: number) {
    setFlags((fs) => fs.filter((_, idx) => idx !== i));
  }

  async function publish() {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch(`/api/console/deals/${dealId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verdict,
          headline,
          flags: flags.filter((f) => f.title || f.explanation),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not publish.");
        return;
      }
      setMsg("Published. The customer now sees this reviewed verdict.");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  // The exact FairnessResult the customer would see if published right now —
  // built from the live edits, reusing the auto result's warranty/assumptions.
  const previewResult: FairnessResult = {
    overallVerdict: verdict,
    headline: headline.trim() || "Reviewed verdict",
    confidence: autoResult?.confidence ?? "high",
    confidenceReasons: autoResult?.confidenceReasons ?? [],
    flags: flags.filter((f) => f.title || f.explanation),
    warranty: autoResult?.warranty ?? null,
    assumptions: autoResult?.assumptions ?? [],
    schemaVersion: "fairness-1",
    engineVersion: autoResult?.engineVersion ?? "reviewed",
    createdAt: autoResult?.createdAt ?? "",
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="field-label">Overall verdict</p>
        <div className="flex gap-2">
          {VERDICTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVerdict(v)}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                verdict === v
                  ? VERDICT_BTN[v]
                  : "border-navy/15 bg-white text-navy/60"
              }`}
            >
              {VERDICT_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="field-label">Headline shown to the customer</span>
        <textarea
          className="field-input min-h-[64px]"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </label>

      <div>
        <p className="field-label">Red flags</p>
        <div className="space-y-3">
          {flags.map((f, i) => (
            <div key={i} className="rounded-xl border border-navy/15 bg-white p-3">
              <div className="flex flex-wrap gap-2">
                <select
                  className="field-input w-auto flex-1"
                  value={f.type}
                  onChange={(e) =>
                    updateFlag(i, { type: e.target.value as FlagType })
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className="field-input w-auto"
                  value={f.severity}
                  onChange={(e) =>
                    updateFlag(i, { severity: e.target.value as FlagSeverity })
                  }
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeFlag(i)}
                  className="px-2 text-navy/40 hover:text-verdict-red"
                  aria-label="Remove flag"
                >
                  ✕
                </button>
              </div>
              <input
                className="field-input mt-2"
                placeholder="Flag title"
                value={f.title}
                onChange={(e) => updateFlag(i, { title: e.target.value })}
              />
              <textarea
                className="field-input mt-2 min-h-[60px]"
                placeholder="Plain-English explanation for the buyer"
                value={f.explanation}
                onChange={(e) => updateFlag(i, { explanation: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addFlag}
          className="mt-2 text-sm font-medium text-gold-dark hover:underline"
        >
          + Add a flag
        </button>
      </div>

      {error && <p className="text-sm text-verdict-red">{error}</p>}
      {msg && (
        <p className="rounded-lg border border-verdict-green/25 bg-verdict-green/5 px-3 py-2 text-sm text-verdict-green">
          {msg}
        </p>
      )}

      <button
        type="button"
        className="btn-primary w-full"
        onClick={publish}
        disabled={busy}
      >
        {busy ? "Publishing…" : "Publish reviewed verdict to customer"}
      </button>

      {/* Live customer preview — the exact Deal-report card the buyer will see,
          updating as the operator edits the verdict, headline, and flags. */}
      <div className="border-t border-navy/10 pt-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-navy">
          What the customer will see
          <span className="rounded-full bg-gold/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark ring-1 ring-gold/25">
            Live preview
          </span>
        </p>
        <div className="rounded-2xl border border-navy/10 bg-cream-100/50 p-3">
          <VerdictView
            result={previewResult}
            loan={loan ?? undefined}
            vehicle={vehicle ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
