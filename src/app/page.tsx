import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:pt-20">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
              The KBB for car deals &amp; extended warranties
            </span>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-navy sm:text-5xl">
              Is your car deal fair, or a rip-off?
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-navy/70">
              Dealers profit because buyers have no reference point. Paste or
              upload the dealer&apos;s offer and get a clear, plain-English
              verdict — fees, interest rate, add-ons, and especially the extended
              warranty — with every red flag explained. We&apos;re on your side,
              not theirs.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/check" className="btn-primary">
                Check my deal
              </Link>
              <a href="#how" className="btn-secondary">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-navy/50">
              Free. No account needed. Takes about two minutes.
            </p>
          </div>
        </section>

        {/* Trust strip */}
        <section className="border-y border-navy/10 bg-white">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-3">
            <Trust
              title="Strictly buyer-side"
              body="We never take money from dealers, lenders, or warranty companies — and never steer you to a partner."
            />
            <Trust
              title="Honest estimates"
              body="Every number is a range with a confidence level. We never invent a fake exact 'fair price.'"
            />
            <Trust
              title="Plain English"
              body="No jargon. Just what's fair, what's padded, and what to push back on before you sign."
            />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="font-serif text-3xl font-semibold text-navy">
            How it works
          </h2>
          <p className="mt-2 text-navy/60">Three steps. Two minutes.</p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            <Step
              n={1}
              title="Enter the offer"
              body="Type the dealer's numbers, or upload a photo or PDF of the quote and we'll read what we can."
            />
            <Step
              n={2}
              title="Get your verdict"
              body="A clear red / amber / green rating, plus a separate fairness check on the extended-warranty price."
            />
            <Step
              n={3}
              title="Know your red flags"
              body="See padded fees, marked-up interest, and overpriced add-ons explained — so you can negotiate."
            />
          </ol>
          <div className="mt-10">
            <Link href="/check" className="btn-primary">
              Check my deal
            </Link>
          </div>
        </section>

        {/* What we check */}
        <section className="bg-navy text-cream">
          <div className="mx-auto max-w-5xl px-4 py-14">
            <h2 className="font-serif text-3xl font-semibold">
              What we look at
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Check
                title="Padded & junk fees"
                body="Dealer prep, nitrogen tires, paint protection, VIN etching, vague 'market adjustments' — the stuff that's pure profit."
              />
              <Check
                title="Marked-up interest"
                body="Dealers often inflate your loan's APR above what you'd qualify for and pocket the difference. We flag it."
              />
              <Check
                title="The extended warranty"
                body="The biggest markup in the finance office. We estimate a fair price range so you know if you're overpaying."
              />
              <Check
                title="Unnecessary add-ons"
                body="Coverage and accessories you may not need, or could buy far cheaper elsewhere."
              />
            </div>
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

function Trust({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-navy">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-navy/60">{body}</p>
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

function Check({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-cream/15 bg-navy-700/40 p-5">
      <h3 className="text-lg font-semibold text-gold-light">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-cream/75">{body}</p>
    </div>
  );
}
