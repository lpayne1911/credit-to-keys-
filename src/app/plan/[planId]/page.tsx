/**
 * /plan/[planId] — the Target Deal Sheet result for the Build My Plan flow.
 *
 * v1 has no account/DB, so the result is rendered client-side from the on-device
 * workspace the intake form saved it to. The blue lane teaches the
 * still-shopping path.
 */
import Link from "next/link";
import { PlanClientFallback } from "./PlanClientFallback";
import { PlanView } from "@/components/plan/PlanView";
import { Disclaimer } from "@/components/Disclaimer";
import { SaveToAccountPrompt } from "@/components/account/SaveToAccountPrompt";
import { getArtifactById } from "@/lib/artifacts";
import type { TargetDealSheet } from "@/lib/plan-engine/types";

export const metadata = {
  title: "Your Target Deal Sheet — Driveway Advocate",
};

function asPlan(payload: unknown): TargetDealSheet | null {
  return payload && typeof payload === "object" &&
    (payload as { schemaVersion?: string }).schemaVersion === "target-plan-1"
    ? (payload as TargetDealSheet)
    : null;
}

export default async function PlanPage({ params }: { params: { planId: string } }) {
  const artifact = await getArtifactById(params.planId);
  const plan = artifact?.kind === "plan" ? asPlan(artifact.payload) : null;
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-cream">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="orb -left-24 top-10 h-72 w-72 bg-blue/15" />
        <div className="orb right-[-6rem] top-1/3 h-80 w-80 bg-paleblue/60" />
      </div>

      <header className="sticky top-0 z-10 bg-cream/70 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/55">
        <div className="flex h-14 items-center justify-between px-3">
          <Link
            href="/build-my-plan/intake"
            aria-label="Build another plan"
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">
            Target Deal Sheet
          </span>
          <Link
            href="/"
            aria-label="Home"
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy/50 hover:bg-navy/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-blue-dark via-blue to-blue-dark" />
      </header>

      <main className="relative flex-1 overflow-y-auto px-5 pb-12">
        <div className="mx-auto w-full max-w-xl pt-6">
          {plan ? (
            <div className="space-y-6">
              <PlanView result={plan} />
              <SaveToAccountPrompt
                id={params.planId}
                ownerId={artifact?.user_id ?? null}
                claimParam="claimArtifactId"
                redirectTo={`/plan/${params.planId}`}
                label="Save this plan"
              />
              <Disclaimer />
              <Link
                href="/build-my-plan/intake"
                className="block py-2 text-center text-sm font-semibold text-blue-dark hover:underline"
              >
                ← Build another plan
              </Link>
            </div>
          ) : (
            <PlanClientFallback planId={params.planId} />
          )}
        </div>
      </main>
    </div>
  );
}
