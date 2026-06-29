"use client";

/**
 * My Reports — the unified workspace list. Reads the on-device report index and
 * lets the buyer reopen or remove any saved Quote Review, Target Deal Sheet, or
 * Post-Sale Triage from one place.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { listReports, removeReport } from "@/lib/workspace/store";
import { REPORT_META, type SavedReport } from "@/lib/workspace/types";

const ACCENT: Record<string, string> = {
  green: "bg-green-soft text-green-dark",
  blue: "bg-blue-soft text-blue-dark",
  red: "bg-red-soft text-red-dark",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ReportsList() {
  const [reports, setReports] = useState<SavedReport[] | null>(null);

  useEffect(() => {
    setReports(listReports());
  }, []);

  function onRemove(r: SavedReport) {
    removeReport(r.type, r.id);
    setReports(listReports());
  }

  // Pre-hydration / loading.
  if (reports === null) {
    return <p className="mt-8 text-sm text-slate">Loading your reports…</p>;
  }

  if (reports.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-edge bg-white p-8 text-center shadow-card">
        <p className="font-bold text-navy">No saved reports yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate">
          Run a service and your result is saved here automatically, so you can reopen it anytime.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link href="/quote-review/intake" className="btn-green text-sm">Review a quote</Link>
          <Link href="/build-my-plan/intake" className="btn-blue text-sm">Build a plan</Link>
          <Link href="/post-sale-triage/intake" className="btn-red text-sm">Post-sale triage</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {reports.map((r) => {
        const meta = REPORT_META[r.type];
        return (
          <div key={`${r.type}:${r.id}`} className="flex items-center gap-4 rounded-2xl border border-edge bg-white p-4 shadow-card transition hover:shadow-lift">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${ACCENT[meta.accent]}`}>
                  {meta.label}
                </span>
                <span className="text-xs text-slate">{formatDate(r.createdAt)}</span>
              </div>
              <p className="mt-1 truncate font-bold text-navy">{r.title}</p>
              {r.subtitle && <p className="truncate text-sm text-slate">{r.subtitle}</p>}
            </div>
            <Link href={r.href} className="shrink-0 text-sm font-bold text-navy hover:underline">
              Open →
            </Link>
            <button
              type="button"
              onClick={() => onRemove(r)}
              aria-label={`Remove ${r.title}`}
              className="shrink-0 rounded-lg p-2 text-navy/40 transition hover:bg-navy/5 hover:text-red"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M6 7h12M9 7V5h6v2M10 11v6M14 11v6M7 7l1 13h8l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        );
      })}

      <p className="px-1 pt-2 text-xs text-slate">
        Saved on this device only. Clearing your browser data removes them. Cloud sync with an account is coming.
      </p>
    </div>
  );
}
