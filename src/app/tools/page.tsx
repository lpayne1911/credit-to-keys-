import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Disclaimer } from "@/components/Disclaimer";
import { ACCENT_CLASSES, type Accent } from "@/lib/funnels";
import { FunnelIcon, type FunnelIconName } from "@/components/funnels/icons";

export const metadata = {
  title: "Free Tools — Driveway Advocate",
  description:
    "Free buyer-side tools: the Red Flag Scan, warranty and service-contract check, APR and payment check, add-ons and fees check, and a local Market Check. No signup, no charge.",
};

/**
 * The Free Tools hub — every free, self-serve check in one place. These are the
 * lead magnets: quick and genuinely useful, with the paid human services
 * (Quote Review, Build My Plan, Concierge, Deal Rescue) one clear step away.
 */
type Tool = {
  name: string;
  whoFor: string;
  what: string;
  time: string;
  href: string;
  cta: string;
  accent: Accent;
  icon: FunnelIconName;
};

const TOOLS: Tool[] = [
  {
    name: "Free Red Flag Scan",
    whoFor: "You have a quote, worksheet, or ballpark numbers and want a fast gut-check.",
    what: "Scans the whole deal — price, fees, APR, trade-in, and warranty — for the red flags buyers miss, and ends on a clear sign / push back / walk read.",
    time: "~1 min",
    href: "/check",
    cta: "Run my free scan",
    accent: "green",
    icon: "summary",
  },
  {
    name: "Warranty / Service Contract Check",
    whoFor: "You were offered an extended warranty, VSC, or protection plan.",
    what: "Checks whether the quoted price sits in a fair range for that coverage and term, with a counter-offer line if it's high.",
    time: "~30 sec",
    href: "/warranty-check",
    cta: "Check my warranty",
    accent: "green",
    icon: "shieldAlert",
  },
  {
    name: "APR / Payment Check",
    whoFor: "You're financing and the rate or monthly payment feels high.",
    what: "Compares your APR to what your credit band typically qualifies for and checks whether the payment looks packed.",
    time: "~30 sec",
    href: "/apr-check",
    cta: "Check my APR",
    accent: "blue",
    icon: "chart",
  },
  {
    name: "Add-ons / Fees Check",
    whoFor: "Your paperwork has add-ons and fees you didn't ask for.",
    what: "Categorizes each line — likely-junk, negotiable, government, or service contract — with estimated clawback ranges where they apply.",
    time: "~30 sec",
    href: "/add-on-check",
    cta: "Check my add-ons",
    accent: "gold",
    icon: "listCheck",
  },
  {
    name: "Market Check",
    whoFor: "You want to know what this vehicle actually sells for near you.",
    what: "Pulls comparable local listings and shows the market range, median, a suggested target price, and safety/recall data for the vehicle.",
    time: "~1 min",
    href: "/market-check",
    cta: "Check the market",
    accent: "blue",
    icon: "search",
  },
];

export default function ToolsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-16">
            <span className="inline-block rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gold">
              Free · no signup · no charge
            </span>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Free buyer-side tools
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/75">
              Quick, honest checks you can run right now. When you want the full
              paperwork review and a pushback plan, Quote Review is one step away.
            </p>
          </div>
        </section>

        <section className="bg-cream">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((t) => {
                const a = ACCENT_CLASSES[t.accent];
                return (
                  <div
                    key={t.href}
                    className="flex h-full flex-col rounded-2xl border border-edge bg-white p-6 shadow-card"
                  >
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.soft} ${a.softText}`}>
                      <FunnelIcon name={t.icon} className="h-6 w-6" />
                    </span>
                    <h2 className="mt-4 text-lg font-bold text-navy">{t.name}</h2>
                    <p className={`mt-2 text-xs font-bold uppercase tracking-wide ${a.text}`}>
                      Who it&apos;s for
                    </p>
                    <p className="mt-0.5 text-sm text-slate">{t.whoFor}</p>
                    <p className={`mt-3 text-xs font-bold uppercase tracking-wide ${a.text}`}>
                      What it checks
                    </p>
                    <p className="mt-0.5 flex-1 text-sm text-slate">{t.what}</p>
                    <p className="mt-3 text-xs font-semibold text-slate">{t.time}</p>
                    <Link href={t.href} className={`${a.btn} mt-4 w-full text-sm`}>
                      {t.cta} →
                    </Link>
                  </div>
                );
              })}

              {/* Upgrade card — the hub's one paid pointer. */}
              <div className="flex h-full flex-col rounded-2xl border-2 border-green/40 bg-green-soft p-6">
                <h2 className="text-lg font-bold text-navy">
                  Want the full paperwork review?
                </h2>
                <p className="mt-2 flex-1 text-sm text-ink/80">
                  The free tools give you a fast read. Quote Review is the deep,
                  human-backed teardown of your actual paperwork — every fee and
                  add-on classified, with a word-for-word pushback plan — before you sign.
                </p>
                <p className="mt-3 text-sm font-bold text-green-dark">
                  Starting at $199 · scope confirmed before work begins · no charge today
                </p>
                <Link href="/quote-review" className="btn-green mt-4 w-full text-sm">
                  Start Quote Review →
                </Link>
              </div>
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
