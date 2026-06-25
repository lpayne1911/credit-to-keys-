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
import type { Flag, FlagSeverity, FlagType, Verdict } from "@/lib/fairness-engine";
import { VERDICT_LABEL, FLAG_TYPES } from "@/lib/fairness-engine";

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
}: {
  dealId: string;
  initialVerdict: Verdict;
  initialHeadline: string;
  initialFlags: Flag[];
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
    </div>
  );
}
