import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { FUNNELS, ACCENT_CLASSES } from "@/lib/funnels";
import { FunnelIcon } from "@/components/funnels/icons";

export const metadata = {
  title: "Services & pricing — Driveway Advocate",
  description:
    "Pick the level of help that fits your moment: Quote Review, Build My Plan, Concierge, or Post-Sale Triage. Flat fees, paid only by you.",
};

export default function ServicesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-16">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
              Pick the help that fits your moment.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/75">
              Four buyer-side paths, flat fees, and one promise: you&apos;re the only one paying
              us — never the dealer, lender, finance office, or warranty company.
            </p>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FUNNELS.map((f) => {
                const a = ACCENT_CLASSES[f.accent];
                return (
                  <div key={f.id} className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
                      <FunnelIcon name={f.heroIcon} className="h-6 w-6" />
                    </span>
                    <h2 className="mt-4 text-lg font-bold text-navy">{f.homeTitle}</h2>
                    <p className="mt-1 text-sm text-slate">{f.homeCopy}</p>
                    <p className={`mt-4 text-2xl font-extrabold tracking-tight ${a.text}`}>
                      {f.pricing.amount}
                    </p>
                    {f.pricing.sub && <p className="mt-1 text-xs text-slate">{f.pricing.sub}</p>}
                    <Link href={f.route} className={`${a.btn} mt-5 w-full text-sm`}>
                      {f.homeCta}
                    </Link>
                  </div>
                );
              })}
            </div>

            <div className="mt-10">
              <Disclaimer />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
