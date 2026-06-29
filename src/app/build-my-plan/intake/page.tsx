/**
 * /build-my-plan/intake — Build My Plan intake (the still-shopping form).
 *
 * Server shell that renders the client intake form. The /build-my-plan funnel's
 * primary CTA points here.
 */
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { BuildMyPlanIntakeForm } from "./BuildMyPlanIntakeForm";

export const metadata = {
  title: "Build My Plan — Driveway Advocate",
  description:
    "Tell us the car you're after and your financing profile. We'll build your Target Deal Sheet — a realistic target price, fee checklist, financing benchmark, and negotiation game plan.",
};

export default function BuildMyPlanIntakePage() {
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
            href="/build-my-plan"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">
            Build My Plan
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
        <div className="h-1 w-full bg-gradient-to-r from-blue to-blue-dark" />
      </header>

      <main className="relative flex-1 overflow-y-auto px-5 pb-12">
        <div className="mx-auto w-full max-w-xl pt-6">
          <div className="mb-5">
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Build a plan. Know your numbers. Walk in strong.
            </h1>
            <p className="mt-1 text-navy/60">
              Tell us the car you&apos;re after and your financing profile. We&apos;ll
              build your Target Deal Sheet — a realistic target price, an expected-fee
              checklist, a financing benchmark, and a negotiation game plan.
            </p>
          </div>

          <BuildMyPlanIntakeForm />

          <div className="mt-6">
            <Disclaimer />
          </div>
        </div>
      </main>
    </div>
  );
}
