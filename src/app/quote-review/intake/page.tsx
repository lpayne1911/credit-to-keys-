/**
 * /quote-review/intake — Quote Review intake (deep, line-item entry).
 *
 * Server shell that renders the client intake form. The /quote-review marketing
 * funnel's primary CTA points here.
 */
import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { QuoteReviewIntakeForm } from "./QuoteReviewIntakeForm";

export const metadata = {
  title: "Review My Quote — Driveway Advocate",
  description:
    "Upload your dealer paperwork or enter your numbers, and we'll reconstruct the deal, classify every fee and add-on, and build your pushback script.",
};

export default function QuoteReviewIntakePage() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-cream">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="orb -left-24 top-10 h-72 w-72 bg-green/15" />
        <div className="orb right-[-6rem] top-1/3 h-80 w-80 bg-paleblue/60" />
      </div>

      <header className="sticky top-0 z-10 bg-cream/70 backdrop-blur-xl supports-[backdrop-filter]:bg-cream/55">
        <div className="flex h-14 items-center justify-between px-3">
          <Link
            href="/quote-review"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="font-serif text-sm font-semibold tracking-tight text-navy/80">
            Review My Quote
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
        <div className="h-1 w-full bg-gradient-to-r from-green to-green-dark" />
      </header>

      <main className="relative flex-1 overflow-y-auto px-5 pb-12">
        <div className="mx-auto w-full max-w-xl pt-6">
          <div className="mb-5">
            <h1 className="font-serif text-2xl font-semibold text-navy">
              Review it. Challenge it. Strengthen it.
            </h1>
            <p className="mt-1 text-navy/60">
              Upload your paperwork or enter your numbers. We&apos;ll reconstruct
              the deal, check the math, classify every fee and add-on, and build
              your pushback script.
            </p>
          </div>

          <QuoteReviewIntakeForm />

          <div className="mt-6">
            <Disclaimer />
          </div>
        </div>
      </main>
    </div>
  );
}
