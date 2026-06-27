import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { UsedCarRiskReview } from "@/components/UsedCarRiskReview";

export const metadata = {
  title: "Used-Car Risk Report — pilot preview — Driveway Advocate",
  description:
    "A free, buyer-side pilot preview: describe a used vehicle and get a reference-point read on whether to inspect, slow down, renegotiate, or walk away. No payment, no account, nothing saved.",
};

export default function UsedCarRiskCheckPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 pb-6 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              Used-Car Risk Report · pilot
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Is this used car a mistake?
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            Tell us about the vehicle, its title and history, and what&apos;s
            nagging you. We&apos;ll hand back a buyer-side{" "}
            <strong>risk preview</strong> — the red flags, what to inspect, the
            questions to ask, the documents to gather, and whether the signals say
            inspect, slow down, renegotiate, or walk away.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-navy/55">
            This is a <strong>free pilot preview</strong>. It collects no payment,
            it isn&apos;t the full paid Used-Car Risk Report, and it is not legal,
            financial, tax, insurance, title, mechanical, or safety advice. It
            doesn&apos;t guarantee a vehicle&apos;s condition, reliability, title
            status, a refund, savings, or any outcome — and nothing you enter is
            uploaded or saved.
          </p>
          <div className="mt-5">
            <Link
              href="/services/used-car-risk-report"
              className="text-sm font-semibold text-gold-dark hover:underline"
            >
              ← Back to the Used-Car Risk Report overview
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-12">
          <UsedCarRiskReview />
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-14">
          <Disclaimer />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
