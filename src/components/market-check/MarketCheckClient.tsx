"use client";

import { useState } from "react";
import type { MarketCheckResponse } from "@/lib/sources/marketcheck/types";
import { MarketCheckReport } from "./MarketCheckReport";

const STEPS = [
  "Identifying the vehicle",
  "Pulling local inventory",
  "Filtering comparable listings",
  "Checking price position",
  "Building your market snapshot",
];

export function MarketCheckClient({ initial }: { initial: MarketCheckResponse }) {
  const [response, setResponse] = useState<MarketCheckResponse>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [f, setF] = useState({ vin: "", year: "", make: "", model: "", trim: "", mileage: "", zipCode: "", dealerAskingPrice: "" });

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const canSubmit = f.vin.trim().length > 0 || (f.make.trim() && f.model.trim());

  async function run() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/market-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: f.vin || undefined,
          year: f.year ? Number(f.year) : undefined,
          make: f.make || undefined,
          model: f.model || undefined,
          trim: f.trim || undefined,
          mileage: f.mileage ? Number(f.mileage) : undefined,
          zipCode: f.zipCode || undefined,
          dealerAskingPrice: f.dealerAskingPrice ? Number(f.dealerAskingPrice) : undefined,
          radiusMiles: 75,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong checking the market.");
        return;
      }
      setResponse(data.result as MarketCheckResponse);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Lookup bar */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-2xl border border-edge bg-white p-4 shadow-card sm:p-5">
          <p className="text-sm font-bold text-navy">Check another vehicle</p>
          <p className="mt-0.5 text-xs text-slate">Enter a VIN, or year / make / model + ZIP. No VIN? No problem.</p>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-8">
            <input className="field-input lg:col-span-2" placeholder="VIN (optional)" value={f.vin} onChange={(e) => set("vin", e.target.value.toUpperCase())} />
            <input className="field-input" placeholder="Year" inputMode="numeric" value={f.year} onChange={(e) => set("year", e.target.value.replace(/[^0-9]/g, ""))} />
            <input className="field-input" placeholder="Make" value={f.make} onChange={(e) => set("make", e.target.value)} />
            <input className="field-input" placeholder="Model" value={f.model} onChange={(e) => set("model", e.target.value)} />
            <input className="field-input" placeholder="Miles" inputMode="numeric" value={f.mileage} onChange={(e) => set("mileage", e.target.value.replace(/[^0-9]/g, ""))} />
            <input className="field-input" placeholder="ZIP" inputMode="numeric" value={f.zipCode} onChange={(e) => set("zipCode", e.target.value.replace(/[^0-9]/g, ""))} />
            <button type="button" onClick={run} disabled={!canSubmit || loading} className="btn-blue text-sm">
              {loading ? "Checking…" : "Check the Market"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-dark">{error}</p>}
        </div>
      </div>

      {loading ? (
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-blue/25 border-t-blue" aria-hidden />
          <p className="mt-4 text-lg font-bold text-navy">Checking the local market…</p>
          <ul className="mt-4 space-y-1.5 text-sm text-slate">
            {STEPS.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <p className="mt-4 text-xs text-slate">Comparing this vehicle against nearby listings so you can see whether the price is fair before you negotiate.</p>
        </div>
      ) : (
        <MarketCheckReport response={response} />
      )}
    </div>
  );
}
