import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { VerdictView } from "@/components/VerdictView";
import { SAMPLE_RESULT, SAMPLE_LOAN, SAMPLE_VEHICLE } from "@/lib/sample-report";

export const metadata = {
  title: "Sample deal report — Driveway Advocate",
  description:
    "See exactly what you get: a real Driveway Advocate deal report on a sample 2021 Toyota Camry — Deal Score, every risk flag explained, estimated dollar impact, and a word-for-word pushback script for the desk.",
};

/** What every report gives the buyer — the orientation legend above the sample. */
const INCLUDES = [
  "A clear 0–100 Deal Score and verdict",
  "Every risk flag we found",
  "Why each issue matters, in plain English",
  "Estimated dollar impact where we can size it",
  "The confidence level and assumptions behind it",
  "A word-for-word script for the desk",
  "What to do next — push back or get a human review",
];

export default function SamplePage() {
  return (
    <>
      <SiteHeader />
      <main className="relative overflow-x-clip">
        {/* layered background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream to-cream" />
          <div className="absolute inset-0 bg-grid mask-fade-b opacity-60" />
          <div className="orb -left-24 -top-20 h-96 w-96 bg-gold/15" />
          <div className="orb right-[-8rem] top-24 h-[26rem] w-[26rem] bg-paleblue/60" />
        </div>

        {/* Intro — answer "what do I actually get?" */}
        <section className="mx-auto max-w-3xl px-4 pt-12 text-center sm:pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark shadow-sm backdrop-blur">
            Sample report
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.08] text-navy sm:text-5xl">
            This is exactly what you get.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate">
            A real Driveway Advocate report on a sample{" "}
            <strong className="text-navy">2021 Toyota Camry</strong> deal — the
            same thing you receive after a free check. The numbers are realistic
            but fictional, so you can see the format before you run your own.
          </p>

          <ul className="mx-auto mt-8 grid max-w-2xl gap-x-6 gap-y-2.5 text-left sm:grid-cols-2">
            {INCLUDES.map((i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check />
                <span className="text-sm font-medium text-navy/80">{i}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* The real report, rendered through the production verdict system */}
        <section className="mx-auto max-w-md px-4 pb-6 pt-12">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse-ring rounded-full bg-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate">
              Live sample · 2021 Toyota Camry
            </span>
          </div>
          <VerdictView
            result={SAMPLE_RESULT}
            loan={SAMPLE_LOAN}
            vehicle={SAMPLE_VEHICLE}
            expandDetails
          />
        </section>

        {/* Convert — now run a real one */}
        <section className="mx-auto max-w-2xl px-4 pb-20 pt-8 text-center">
          <h2 className="font-serif text-3xl font-semibold text-navy">
            Now check your real deal.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate">
            Upload your quote or tap through a few questions and get a report just
            like this one — built on your numbers, before you sign.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/check" className="btn-primary text-base">
              Check my deal before I sign
            </Link>
            <Link href="/#what-we-catch" className="btn-secondary text-base">
              See what we check
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-xs leading-relaxed text-slate">
            This sample uses realistic but fictional numbers to show the format of
            a report. Driveway Advocate provides decision support, not legal or
            financial advice, and never takes money from dealers, lenders, or
            warranty companies.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="mt-0.5 h-4 w-4 shrink-0 text-gold-dark"
      aria-hidden
    >
      <circle cx="10" cy="10" r="9" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M6 10.5l2.5 2.5L14 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
