"use client";

/**
 * Pushback Script card for the Deal Review page. Unlike NegotiationScriptCard
 * (which rebuilds the script from a FairnessResult), this renders a pre-built
 * {@link NegotiationScript} so the Quote Review flow's tailored price-target
 * line is preserved. Client component for one-tap copy.
 */
import { useState } from "react";
import type { NegotiationScript } from "@/lib/negotiation";

export function DealReviewScriptCard({ script }: { script: NegotiationScript }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(script.asText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the script is still on screen to read or screenshot.
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gold/30 bg-white shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-gold/20 bg-gold/10 px-5 py-4">
        <div>
          <h3 className="font-serif text-lg font-semibold text-navy">
            Pushback script
          </h3>
          <p className="mt-0.5 text-sm text-navy/60">
            Read these off your phone. Calm and firm — you can always walk.
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-navy/15 bg-white px-3 py-1.5 text-xs font-semibold text-navy/80 transition hover:border-navy/30"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      <div className="space-y-4 px-5 py-5">
        <p className="text-sm italic leading-relaxed text-navy/70">
          &ldquo;{script.opener}&rdquo;
        </p>

        <ol className="space-y-3">
          {script.points.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold-dark">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-navy/80">{p.say}</span>
            </li>
          ))}
        </ol>

        <p className="border-t border-navy/10 pt-4 text-sm italic leading-relaxed text-navy/70">
          &ldquo;{script.closer}&rdquo;
        </p>
      </div>
    </div>
  );
}
