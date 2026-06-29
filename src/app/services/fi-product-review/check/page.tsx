import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { FiProductReview } from "@/components/FiProductReview";

export const metadata = {
  title: "F&I Product Review — pilot preview — Driveway Advocate",
  description:
    "A free, buyer-side pilot preview: describe the finance-office products on your deal and get a reference-point read on what to keep, challenge, or cancel. No payment, no account, nothing saved.",
};

export default function FiProductReviewCheckPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-4 pb-6 pt-12 sm:pt-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              F&amp;I Product Review · pilot
            </span>
            <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
              Soon
            </span>
          </div>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
            Should you buy — or cancel — these add-ons?
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            Tell us about the warranty, GAP, and add-ons the finance office put
            in front of you. We&apos;ll hand back a buyer-side{" "}
            <strong>review preview</strong> — what to keep, what to challenge,
            what to try to cancel, the questions to ask, and a script to use.
          </p>
          <p className="mt-4 max-w-2xl text-sm text-navy/55">
            This is a <strong>pilot preview</strong>, not the full paid review and
            not legal advice. It does not collect payment, it doesn&apos;t replace
            a complete F&amp;I review, and nothing you enter is uploaded or saved.
          </p>
          <div className="mt-5">
            <Link
              href="/services/fi-product-review"
              className="text-sm font-semibold text-gold-dark hover:underline"
            >
              ← Back to the F&amp;I Product Review overview
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-12">
          <FiProductReview />
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-14">
          <Disclaimer />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
