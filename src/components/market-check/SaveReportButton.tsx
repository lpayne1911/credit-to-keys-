"use client";

import { useState } from "react";
import type { MarketCheckResponse } from "@/lib/sources/marketcheck/types";

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; url: string; copied: boolean }
  | { kind: "error"; message: string };

/**
 * "Save This Report" — POSTs the rendered report to /api/market-check/save and
 * returns a shareable capability URL. No account needed; the link IS the access.
 * Fails gracefully (shows a message) when persistence isn't configured.
 */
export function SaveReportButton({ response }: { response: MarketCheckResponse }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function save() {
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/market-check/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: response }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setState({ kind: "error", message: data.error ?? "Could not save the report." });
        return;
      }
      setState({ kind: "saved", url: data.url, copied: false });
    } catch {
      setState({ kind: "error", message: "Could not save the report." });
    }
  }

  async function copy(url: string) {
    const full = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    try {
      await navigator.clipboard.writeText(full);
      setState({ kind: "saved", url, copied: true });
    } catch {
      // Clipboard blocked — leave the link visible for manual copy.
    }
  }

  if (state.kind === "saved") {
    const full =
      typeof window !== "undefined" ? `${window.location.origin}${state.url}` : state.url;
    return (
      <div className="rounded-xl border border-edge bg-cream-100 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-green-dark">Report saved</p>
        <p className="mt-1 break-all font-mono text-xs text-navy/70">{full}</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => copy(state.url)}
            className="btn-secondary flex-1 justify-center text-xs"
          >
            {state.copied ? "Copied ✓" : "Copy link"}
          </button>
          <a href={state.url} className="btn-outline-navy flex-1 justify-center text-xs">
            Open
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={save}
        disabled={state.kind === "saving"}
        className="btn-outline-navy w-full justify-center text-sm disabled:opacity-60"
      >
        {state.kind === "saving" ? "Saving…" : "Save This Report"}
      </button>
      {state.kind === "error" && (
        <p className="mt-2 text-center text-xs text-red-dark">{state.message}</p>
      )}
    </div>
  );
}
