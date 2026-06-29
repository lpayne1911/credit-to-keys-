"use client";

/**
 * Build My Plan results live client-side in v1: the intake form saved the
 * Target Deal Sheet to the on-device workspace and this reads it back. (No
 * account/DB yet, so it only lives on the device that generated it.)
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanView } from "@/components/plan/PlanView";
import { Disclaimer } from "@/components/Disclaimer";
import { getReportPayload } from "@/lib/workspace/store";
import type { TargetDealSheet } from "@/lib/plan-engine/types";

export function PlanClientFallback({ planId }: { planId: string }) {
  const [state, setState] = useState<"loading" | "found" | "missing">("loading");
  const [result, setResult] = useState<TargetDealSheet | null>(null);

  useEffect(() => {
    const parsed = getReportPayload<TargetDealSheet>("target-plan", planId);
    if (parsed?.schemaVersion === "target-plan-1") {
      setResult(parsed);
      setState("found");
      return;
    }
    setState("missing");
  }, [planId]);

  if (state === "loading") {
    return <p className="pt-10 text-center text-sm text-navy/50">Building your plan…</p>;
  }

  if (state === "missing" || !result) {
    return (
      <div className="rounded-2xl border border-edge bg-white p-6 text-center shadow-card">
        <h1 className="font-serif text-2xl font-semibold text-navy">Plan not found here</h1>
        <p className="mx-auto mt-2 max-w-sm text-navy/60">
          This Target Deal Sheet was generated without a saved account, so it only
          lives on the device you built it from. Open it there, or build a new one.
        </p>
        <Link href="/build-my-plan/intake" className="btn-blue mt-5">
          Build my plan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PlanView result={result} />
      <Disclaimer />
      <Link
        href="/build-my-plan/intake"
        className="block py-2 text-center text-sm font-semibold text-blue-dark hover:underline"
      >
        ← Build another plan
      </Link>
    </div>
  );
}
