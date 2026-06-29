"use client";

import { useState } from "react";
import type { ComparableListing, MatchQuality } from "@/lib/sources/marketcheck/types";
import { money } from "./parts";

const MATCH_STYLE: Record<MatchQuality, string> = {
  excellent: "bg-green-soft text-green-dark",
  very_good: "bg-green-soft text-green-dark",
  good: "bg-blue-soft text-blue-dark",
  fair: "bg-orange-soft text-orange",
  poor: "bg-navy/8 text-navy/55",
};
const MATCH_LABEL: Record<MatchQuality, string> = {
  excellent: "Excellent",
  very_good: "Very good",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

function MatchBadge({ q }: { q: MatchQuality }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${MATCH_STYLE[q]}`}>{MATCH_LABEL[q]}</span>;
}

export function ComparableListingsTable({ comps, limit = 5 }: { comps: ComparableListing[]; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = comps.length > limit;
  const rows = expanded ? comps : comps.slice(0, limit);
  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-edge sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-cream-100 text-[11px] font-bold uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-2">Dealer</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Mileage</th>
              <th className="px-3 py-2">List price</th>
              <th className="px-3 py-2">Distance</th>
              <th className="px-3 py-2">Days on market</th>
              <th className="px-3 py-2">Match</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.sourceListingId} className="border-t border-edge">
                <td className="px-3 py-2.5 font-medium text-ink">{c.dealerName ?? "—"}</td>
                <td className="px-3 py-2.5 text-slate">{[c.year, c.make, c.model, c.trim].filter(Boolean).join(" ")}</td>
                <td className="px-3 py-2.5 tabular-nums text-slate">{c.mileage ? `${c.mileage.toLocaleString()} mi` : "—"}</td>
                <td className="px-3 py-2.5 font-semibold tabular-nums text-navy">{money(c.listPrice)}</td>
                <td className="px-3 py-2.5 tabular-nums text-slate">{c.distanceMiles != null ? `${c.distanceMiles} mi` : "—"}</td>
                <td className="px-3 py-2.5 tabular-nums text-slate">{c.daysOnMarket ?? "—"}</td>
                <td className="px-3 py-2.5"><MatchBadge q={c.matchQuality} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-2.5 sm:hidden">
        {rows.map((c) => (
          <div key={c.sourceListingId} className="rounded-xl border border-edge bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">{c.dealerName ?? "—"}</span>
              <MatchBadge q={c.matchQuality} />
            </div>
            <p className="mt-0.5 text-xs text-slate">{[c.year, c.make, c.model, c.trim].filter(Boolean).join(" ")}</p>
            <p className="mt-1 text-sm text-navy">
              <span className="font-bold">{money(c.listPrice)}</span>
              <span className="text-slate"> · {c.mileage ? `${c.mileage.toLocaleString()} mi` : "—"} · {c.distanceMiles != null ? `${c.distanceMiles} mi away` : "—"} · {c.daysOnMarket ?? "—"} days</span>
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-sm font-bold text-blue transition hover:text-blue-dark hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "Show fewer listings ↑" : `View all ${comps.length} comparable listings →`}
        </button>
      )}
    </div>
  );
}
