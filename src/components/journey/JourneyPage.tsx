import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/ui/Reveal";
import { TrustBar } from "@/components/funnels/primitives";
import { FunnelIcon } from "@/components/funnels/icons";
import { ACCENT_CLASSES } from "@/lib/funnels";
import type { Journey } from "@/lib/journeys";

/**
 * Renders one buyer-state journey page from a `Journey` config: a navy hero with
 * the situation + one primary CTA, a grid of secondary "ways in" that route into
 * existing destination pages, a sample-report trust bridge, and the trust bar.
 * No dead ends — every page offers a primary step plus escape routes.
 */
export function JourneyPage({ journey }: { journey: Journey }) {
  const a = ACCENT_CLASSES[journey.accent];
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-navy text-white">
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-navy-950 via-navy to-navy" />
            <div className="absolute inset-0 bg-grid-dark opacity-40" />
            <div className="orb right-[-8rem] -top-20 h-[26rem] w-[26rem] bg-blue/20" />
          </div>

          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
            <Reveal>
              <Link href="/" className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55 hover:text-white/80">
                ← Where are you in the process?
              </Link>
            </Reveal>
            <Reveal delay={60}>
              <span className={`mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide ${a.text}`}>
                {journey.eyebrow}
              </span>
            </Reveal>
            <Reveal delay={120}>
              <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
                {journey.headline}
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
                {journey.subhead}
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-left">
                <p className="text-sm leading-relaxed text-white/80">{journey.primary.desc}</p>
                <Link href={journey.primary.href} className={`${a.btn} mt-4 w-full text-base`}>
                  {journey.primary.label}
                </Link>
              </div>
            </Reveal>
            {journey.sampleHref && (
              <Reveal delay={300}>
                <p className="mt-5 text-sm text-white/60">
                  Not ready yet?{" "}
                  <Link href={journey.sampleHref} className="font-semibold text-white hover:underline">
                    See a sample report →
                  </Link>
                </p>
              </Reveal>
            )}
          </div>
        </section>

        {/* Secondary ways in */}
        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <Reveal>
              <h2 className="text-2xl font-bold text-navy sm:text-3xl">{journey.optionsTitle}</h2>
              <p className="mt-2 max-w-2xl text-slate">
                Every option below picks up where you are — choose the one that fits.
              </p>
            </Reveal>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {journey.options.map((opt, i) => (
                <Reveal key={opt.href} delay={i * 60}>
                  <Link
                    href={opt.href}
                    className="group flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
                      <FunnelIcon name={opt.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-bold text-navy">{opt.title}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate">{opt.desc}</p>
                    <span className={`mt-4 inline-flex items-center gap-1.5 text-sm font-bold ${a.text} group-hover:underline`}>
                      Continue →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>

            <p className="mt-8 text-center text-xs leading-relaxed text-slate">
              We work the buyer&apos;s side only — no commissions, no kickbacks. We don&apos;t sell
              cars, loans, or warranties, and nothing here is legal or financial advice.
            </p>
          </div>
        </section>

        <TrustBar />
      </main>
      <SiteFooter />
    </>
  );
}
