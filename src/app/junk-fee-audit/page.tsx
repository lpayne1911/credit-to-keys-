import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { JunkFeeAudit } from "@/components/JunkFeeAudit";

export const metadata = {
  title: "Free Junk Fee Audit — Driveway Advocate",
  description:
    "Paste the fees from your dealer worksheet and instantly see which ones are padded or pure junk — and roughly how much you could claw back.",
};

export default function JunkFeeAuditPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-5xl px-4 pb-6 pt-12 sm:pt-16">
          <span className="inline-block rounded-full border border-edge bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy">
            Free tool · instant
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-navy sm:text-5xl">
            What can I actually challenge?
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy/70">
            Dealers bury padded and bogus fees in the fine print, betting you
            won&apos;t question them. Paste your worksheet line items below and
            we&apos;ll hand you a <strong>challenge list</strong> — which fees are
            junk, which look high, and roughly what each should be. Free, instant,
            no account.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-12">
          <JunkFeeAudit />
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-14">
          <Disclaimer />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
