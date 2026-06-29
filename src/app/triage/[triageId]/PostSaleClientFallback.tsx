"use client";

/**
 * Post-Sale Triage results live client-side in v1: the intake form saved the
 * result to the on-device workspace and this reads it back.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { PostSaleTriageView } from "@/components/post-sale/PostSaleTriageView";
import { Disclaimer } from "@/components/Disclaimer";
import { getReportPayload } from "@/lib/workspace/store";
import type { PostSaleTriageResult } from "@/lib/post-sale-engine/types";

export function PostSaleClientFallback({ triageId }: { triageId: string }) {
  const [state, setState] = useState<"loading" | "found" | "missing">("loading");
  const [result, setResult] = useState<PostSaleTriageResult | null>(null);

  useEffect(() => {
    const parsed = getReportPayload<PostSaleTriageResult>("post-sale", triageId);
    if (parsed?.schemaVersion === "post-sale-1") {
      setResult(parsed);
      setState("found");
      return;
    }
    setState("missing");
  }, [triageId]);

  if (state === "loading") {
    return <p className="pt-10 text-center text-sm text-navy/50">Building your options…</p>;
  }

  if (state === "missing" || !result) {
    return (
      <div className="rounded-2xl border border-edge bg-white p-6 text-center shadow-card">
        <h1 className="font-serif text-2xl font-semibold text-navy">Triage not found here</h1>
        <p className="mx-auto mt-2 max-w-sm text-navy/60">
          This options review was generated without a saved account, so it only
          lives on the device you built it from. Open it there, or start a new one.
        </p>
        <Link href="/post-sale-triage/intake" className="btn-red mt-5">
          Start triage
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PostSaleTriageView result={result} />
      <Disclaimer />
      <Link
        href="/post-sale-triage/intake"
        className="block py-2 text-center text-sm font-semibold text-red-dark hover:underline"
      >
        ← Start another triage
      </Link>
    </div>
  );
}
