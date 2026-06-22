import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { VerdictGauge } from "@/components/VerdictView";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero — the panic moment, not the ecosystem */}
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
                Buyer-side car-deal protection
              </span>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
                Before you sign, we check the deal.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-navy/70">
                Upload your dealer quote, buyer&apos;s order, or payment
                worksheet. We review the numbers, expose the junk fees and
                finance-office traps, and tell you whether to{" "}
                <strong>sign, push back, or walk away</strong> — before the
                paperwork becomes permanent.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/check" className="btn-primary">
                  Upload my deal
                </Link>
                <a href="#paths" className="btn-secondary">
                  I&apos;m 3–9 months from buying
                </a>
              </div>
              <p className="mt-4 text-sm text-navy/50">
                Free first scan. No account needed. About a minute.
              </p>
            </div>
            <ReportPreview />
          </div>
        </section>

        {/* The trust promise — loudest line in the brand */}
        <section className="bg-navy text-cream">
          <div className="mx-auto max-w-5xl px-4 py-12 text-center">
            <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">
              The dealer has a team. Now you do too.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-cream/80">
              We&apos;re paid by <span className="font-semibold text-gold-light">you</span>{" "}
              — never the dealer, the lender, the finance office, or the warranty
              company. No commissions, no kickbacks, ever. Yours is the only side
              we&apos;re on.
            </p>
          </div>
        </section>

        {/* Three doors — every buyer gets a clear entry point */}
        <section id="paths" className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="font-serif text-3xl font-semibold text-navy">
            Three ways in
          </h2>
          <p className="mt-2 text-navy/60">
            Wherever you are in the process, there&apos;s a door for you.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <Door
              live
              title="Check my deal"
              who="You have a quote, worksheet, or payment in hand — and a bad feeling."
              cta="Check my deal"
              href="/check"
            />
            <Door
              title="Help me buy"
              who="You haven't picked the car yet and want a pro in your corner from the start."
              href="/services"
            />
            <Door
              title="Fix my credit first"
              who="Your score is about to cost you thousands. Credit-to-Keys preps it before you buy."
              href="/services"
            />
          </div>
        </section>

        {/* What we check — the Red Flag Matrix */}
        <section className="bg-white">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="font-serif text-3xl font-semibold text-navy">
              What we check — the Red Flag Matrix
            </h2>
            <p className="mt-2 max-w-2xl text-navy/60">
              Every review runs your deal through eight categories of where
              buyers get worked, and ends with a plain-English call.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {RED_FLAGS.map((r) => (
                <Flag key={r.title} title={r.title} body={r.body} />
              ))}
            </div>

            {/* Verdict scale */}
            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <Tier color="bg-verdict-green" label="Green" note="Looks fair — sign it." />
              <Tier color="bg-verdict-amber" label="Yellow" note="Negotiate before you sign." />
              <Tier color="bg-verdict-red" label="Red" note="Don't sign yet." />
              <Tier color="bg-navy-900" label="Black" note="Walk away — fraud or legal concern." />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="font-serif text-3xl font-semibold text-navy">
            How it works
          </h2>
          <p className="mt-2 text-navy/60">Three steps. About a minute.</p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            <Step
              n={1}
              title="Upload or tap in the offer"
              body="Snap a photo of the quote, or tap through a few questions — no forms."
            />
            <Step
              n={2}
              title="Get your Deal Score"
              body="A clear score and a sign / push back / walk verdict, plus a fairness check on the extended warranty."
            />
            <Step
              n={3}
              title="Know your red flags"
              body="Padded fees, marked-up interest, and overpriced add-ons explained — with the numbers to push back."
            />
          </ol>
          <div className="mt-10">
            <Link href="/check" className="btn-primary">
              Upload my deal
            </Link>
          </div>
        </section>

        {/* Disclaimer — persistent on landing */}
        <section className="mx-auto max-w-5xl px-4 py-10">
          <Disclaimer />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/* The eight Red Flag Matrix categories. */
const RED_FLAGS = [
  { title: "Price", body: "Markups, “market adjustments,” and an out-the-door number that doesn't add up." },
  { title: "Fees", body: "Junk doc, prep, nitrogen, VIN-etch, and vague “procurement” padding." },
  { title: "Financing", body: "Rate markup over what your credit qualifies for, and stretched terms." },
  { title: "Trade-in", body: "Lowball trade values and negative equity buried in the payment." },
  { title: "Warranty & F&I", body: "Overpriced service contracts, GAP, and add-ons sold under pressure." },
  { title: "Used-car risk", body: "Condition, history, and title red flags on a used vehicle." },
  { title: "Contract & legal", body: "Terms that don't match what you were told, or that aren't legal." },
  { title: "Pressure tactics", body: "Payment-packing and finance-office moves designed to rush you." },
];

function ReportPreview() {
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-navy/10">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy/45">
          2021 Toyota Camry · sample
        </p>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-navy/50">
              Deal score
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-serif text-5xl font-bold leading-none text-verdict-amber">
                64
              </span>
              <span className="text-lg font-semibold text-navy/35">/100</span>
            </div>
          </div>
          <span className="rounded-full bg-verdict-amber/10 px-3 py-1 text-sm font-semibold text-verdict-amber ring-1 ring-verdict-amber/30">
            Push back first
          </span>
        </div>
        <VerdictGauge score={64} />
        <div className="mt-5 rounded-xl border border-navy/10 bg-cream-100 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy/55">
            Potential savings we spotted
          </p>
          <p className="font-serif text-2xl font-bold text-gold-dark">
            $1,400–$2,900
          </p>
        </div>
      </div>
    </div>
  );
}

function Door({
  title,
  who,
  cta,
  href,
  live = false,
}: {
  title: string;
  who: string;
  cta?: string;
  href?: string;
  live?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl font-semibold text-navy">{title}</h3>
        {live ? (
          <span className="rounded-full bg-verdict-green/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-verdict-green">
            Live
          </span>
        ) : (
          <span className="rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy/45">
            Soon
          </span>
        )}
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-navy/65">{who}</p>
      {live && href && cta ? (
        <Link href={href} className="btn-primary mt-5">
          {cta}
        </Link>
      ) : href ? (
        <Link
          href={href}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-navy/20 px-6 py-3 text-sm font-semibold text-navy transition hover:border-navy/40"
        >
          See options
        </Link>
      ) : (
        <span className="mt-5 inline-flex items-center justify-center rounded-xl border border-navy/15 px-6 py-3 text-sm font-semibold text-navy/45">
          Coming soon
        </span>
      )}
    </div>
  );
}

function Flag({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-navy/10 bg-cream-100 p-4">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gold-dark">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-navy/65">{body}</p>
    </div>
  );
}

function Tier({
  color,
  label,
  note,
}: {
  color: string;
  label: string;
  note: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-navy/10 bg-white p-4">
      <span className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${color}`} />
      <div>
        <p className="font-semibold text-navy">{label}</p>
        <p className="text-sm text-navy/60">{note}</p>
      </div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="card">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-serif text-lg font-semibold text-gold-dark">
        {n}
      </div>
      <h3 className="mt-3 text-lg font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-navy/65">{body}</p>
    </li>
  );
}
