import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy — Driveway Advocate",
  description:
    "What Driveway Advocate collects, what we deliberately don't, and the choices you have. We never store your name, date of birth, driver's license, or insurance policy number.",
};

/**
 * Plain-language privacy policy reflecting exactly what the app does today:
 *  - We store the deal facts (vehicle, pricing, fees, add-ons, financing,
 *    trade-in, dealer/seller details, insurance CARRIER name).
 *  - We never collect buyer identity (name, DOB, driver's license, insurance
 *    policy number, SSN).
 *  - We keep a de-identified market-data record (no account link) used for
 *    research and potential data products, and we describe the opt-out.
 *
 * NOTE FOR OPERATORS: have counsel review before relying on this, and set a
 * real contact address (CONTACT_EMAIL) + effective date below.
 */
const CONTACT_EMAIL = "privacy@drivewayadvocate.com";
const LAST_UPDATED = "June 30, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      <div className="mt-3 space-y-3 text-slate">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Privacy
            </h1>
            <p className="mt-3 max-w-2xl text-white/75">
              We&apos;re on the buyer&apos;s side, and that includes your data. Here&apos;s
              exactly what we keep, what we deliberately don&apos;t, and the choices
              you have.
            </p>
            <p className="mt-4 text-sm text-white/50">Last updated: {LAST_UPDATED}</p>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
            <Section title="The short version">
              <p>
                When you review a deal — by uploading paperwork or typing it in —
                we keep the <strong>facts of the deal</strong>: the vehicle, the
                prices and fees, the financing terms, any trade-in, and the
                dealer&apos;s details. We use them to score your deal and to study
                car-buying trends.
              </p>
              <p>
                We do <strong>not</strong> store your name, date of birth,
                driver&apos;s license number, insurance policy number, or Social
                Security number. If your uploaded document contains those, we
                don&apos;t pull them into your record.
              </p>
            </Section>

            <Section title="What we collect">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Vehicle:</strong> year, make, model, trim, condition,
                  color, mileage, and VIN.
                </li>
                <li>
                  <strong>Pricing &amp; the deal:</strong> selling price, MSRP,
                  discounts, rebates, fees, F&amp;I add-ons, taxes, totals, down
                  payment/deposit, and financing terms (APR, term, payment, amount
                  financed, credit band).
                </li>
                <li>
                  <strong>Trade-in:</strong> the trade vehicle&apos;s year, make,
                  model, mileage, and dollar figures.
                </li>
                <li>
                  <strong>Dealer / seller:</strong> dealership name, address,
                  phone, ZIP, state, salesperson, and stock number.
                </li>
                <li>
                  <strong>Insurance carrier name only</strong> (e.g. the company
                  name) — never your policy number or account ID.
                </li>
                <li>
                  <strong>Your uploaded document</strong>, stored privately so we
                  can read the figures from it.
                </li>
                <li>
                  If you create an account, your <strong>email</strong> so you can
                  see your saved reports.
                </li>
              </ul>
            </Section>

            <Section title="What we never collect">
              <p>
                Your name, date of birth, driver&apos;s license number, insurance
                policy / account number, and Social Security number. These add
                nothing to a deal review, so we leave them out by design.
              </p>
            </Section>

            <Section title="How we use it">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>To reconstruct and score your specific deal.</li>
                <li>To operate, secure, and improve the service.</li>
                <li>
                  To maintain a <strong>de-identified market-data record</strong> of
                  deals — vehicle, pricing, and dealer facts — for research and to
                  build aggregate insights and data products. This record is{" "}
                  <strong>not linked to your account or identity</strong>.
                </li>
              </ul>
            </Section>

            <Section title="Sharing & sale of data">
              <p>
                We may share or sell <strong>aggregated or de-identified</strong>{" "}
                market data (for example, pricing and fee trends by vehicle, dealer,
                or region). We do not sell your personal identifying information —
                and as noted above, we don&apos;t collect the most sensitive pieces
                in the first place.
              </p>
              <p>
                Depending on where you live, you may have the right to know what we
                hold about you, to request deletion, and to opt out of the
                &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of your information
                (including under the California Consumer Privacy Act, as amended by
                the CPRA). To exercise any of these, contact us below.
              </p>
            </Section>

            <Section title="Your choices">
              <p>
                Email{" "}
                <a className="font-semibold text-navy underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>{" "}
                to request a copy of your data, ask us to delete it, or opt out of
                data sale/sharing. We&apos;ll honor verified requests as required by
                applicable law.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Questions about this policy? Reach us at{" "}
                <a className="font-semibold text-navy underline" href={`mailto:${CONTACT_EMAIL}`}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <p className="text-sm text-slate/80">
                Driveway Advocate provides decision support, not legal or financial
                advice. See our{" "}
                <Link href="/services" className="underline">
                  services
                </Link>{" "}
                for how we work.
              </p>
            </Section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
