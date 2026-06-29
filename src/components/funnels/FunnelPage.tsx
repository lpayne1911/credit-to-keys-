import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Funnel } from "@/lib/funnels";
import { FunnelHero } from "./FunnelHero";
import { FunnelIcon } from "./icons";
import { DeliverableCard, PricingCard, TrustBar, CTASection, SectionHeading } from "./primitives";

/**
 * Shared funnel-page template. Renders hero, workflow, the page's bespoke sample
 * deliverable, the "what you'll receive" grid, pricing, an optional intake slot,
 * a CTA band, and the compliance disclaimer — all driven by one `Funnel`.
 */
export function FunnelPage({
  funnel,
  sideCard,
  sample,
  intake,
  notice,
}: {
  funnel: Funnel;
  sideCard?: ReactNode;
  sample?: ReactNode;
  intake?: ReactNode;
  notice?: ReactNode;
}) {
  const a = ACCENT_CLASSES[funnel.accent];
  return (
    <>
      <SiteHeader />
      <main>
        <FunnelHero funnel={funnel} sideCard={sideCard} />

        {notice && (
          <section className="bg-cream">
            <div className="mx-auto max-w-6xl px-4 pt-8">{notice}</div>
          </section>
        )}

        {/* Workflow */}
        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
            <SectionHeading>{funnel.stepsTitle}</SectionHeading>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {funnel.steps.map((s) => (
                <div key={s.n} className="flex h-full gap-3.5 rounded-xl border border-edge bg-white p-5 shadow-sm">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${a.bar}`}>
                    {s.n}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={a.softText}><FunnelIcon name={s.icon} className="h-4 w-4" /></span>
                      <p className="text-sm font-bold text-ink">{s.title}</p>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-slate">{s.desc}</p>
                    {s.time && <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${a.text}`}>{s.time}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className={`mt-6 flex items-start gap-3 rounded-2xl ${a.soft} px-5 py-4`}>
              <span className={`mt-0.5 ${a.softText}`}><FunnelIcon name="target" className="h-5 w-5" /></span>
              <p className="text-sm text-ink">
                <span className={`font-bold ${a.textDark}`}>{funnel.outcome.title}: </span>
                {funnel.outcome.body}
              </p>
            </div>
          </div>
        </section>

        {/* Sample deliverable */}
        {sample && (
          <section className="border-y border-edge bg-cream-100">
            <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
              <SectionHeading sub="Illustrative sample — your report uses your numbers.">
                What you&apos;ll get
              </SectionHeading>
              <div className="mt-6">{sample}</div>
            </div>
          </section>
        )}

        {/* Deliverables */}
        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
            <SectionHeading>What you&apos;ll receive</SectionHeading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {funnel.deliverables.map((d) => (
                <DeliverableCard key={d.label} item={d} accent={funnel.accent} />
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-edge bg-cream-100">
          <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
            <SectionHeading>Simple, transparent pricing</SectionHeading>
            <div className="mt-6">
              <PricingCard
                accent={funnel.accent}
                label={funnel.pricing.label}
                amount={funnel.pricing.amount}
                sub={funnel.pricing.sub}
                bullets={funnel.pricing.bullets}
                addOn={funnel.pricing.addOn}
                cta={funnel.primaryCta.label}
                href={funnel.primaryCta.href}
              />
            </div>
          </div>
        </section>

        {/* Intake (blue/gold/red) */}
        {intake && (
          <section className="bg-cream">
            <div className="mx-auto max-w-3xl px-4 py-14 sm:py-16">{intake}</div>
          </section>
        )}

        {/* CTA */}
        <CTASection
          accent={funnel.accent}
          headline="Ready to get the right deal?"
          body="Buyer-side only. No commissions, no kickbacks. You make the final decision."
          cta={funnel.primaryCta.label}
          href={funnel.primaryCta.href}
        />

        {/* Compliance */}
        <section className="bg-cream">
          <div className="mx-auto max-w-5xl px-4 py-10">
            <Disclaimer />
          </div>
        </section>

        <TrustBar />
      </main>
      <SiteFooter />
    </>
  );
}
