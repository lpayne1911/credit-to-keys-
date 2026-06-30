"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * One-click claim for a buyer who's already signed in: POST the deal id and go
 * to their dashboard. Used on result pages for anonymous deals.
 */
export function ClaimButton({ dealId, redirectTo = "/dashboard" }: { dealId: string; redirectTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function claim() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save this.");
        setBusy(false);
        return;
      }
      router.push(redirectTo);
    } catch {
      setError("Network error.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={claim} disabled={busy} className="btn-primary w-full">
        {busy ? "Saving…" : "Save to my dashboard"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-verdict-red">{error}</p>}
    </div>
  );
}
