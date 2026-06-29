"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AccountAuth } from "./AccountAuth";

/**
 * Post-scan "save this deal" prompt. Shown under a verdict / deal-review ONLY
 * when the deal is unowned (the server passes `claimable`). Value-first signup:
 * the buyer already got the free report; this offers to keep it.
 *
 * Two paths, both finish by claiming the anonymous deal into the new account:
 *  - Email/password: AccountAuth runs the claim inline (claimDealId), then routes
 *    to the dashboard.
 *  - Google: AccountAuth starts OAuth with `next` = this page + ?claim=1; on
 *    return (now signed in) the effect below POSTs the claim and shows "Saved ✓".
 *    The claim route is idempotent, so a double-fire is harmless.
 */
export function SaveDealPrompt({
  dealId,
  configured,
  returnPath,
}: {
  dealId: string;
  configured: boolean;
  returnPath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (params.get("claim") !== "1") return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/deals/${dealId}/claim`, { method: "POST" }).catch(() => null);
      if (!cancelled && res && res.ok) {
        setSaved(true);
        router.refresh();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params, dealId, router]);

  if (saved) {
    return (
      <div className="rounded-2xl border border-green/30 bg-green-soft/40 p-5 text-center">
        <p className="font-serif text-lg font-semibold text-green-dark">Saved to your account ✓</p>
        <p className="mt-1 text-sm text-navy/70">This deal is now in your workspace.</p>
        <Link href="/dashboard" className="btn-primary mt-4 inline-block">
          Go to my dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-edge bg-white/70 p-5 shadow-card">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">Keep this deal</p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-navy">
          Save your verdict to your account
        </h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate">
          Create a free account to keep this deal, track its status, and pick up where you
          left off. No charge — you only pay if you add a paid service later.
        </p>
      </div>
      <div className="mt-4">
        <AccountAuth
          configured={configured}
          claimDealId={dealId}
          redirectTo="/dashboard"
          oauthNext={`${returnPath}?claim=1`}
        />
      </div>
    </div>
  );
}
