import Link from "next/link";
import { Disclaimer } from "./Disclaimer";
import { Logo } from "./SiteHeader";
import { FUNNELS } from "@/lib/funnels";

export function SiteFooter() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-navy-950 text-cream">
      {/* layered glow */}
      <div className="orb -left-24 top-0 h-72 w-72 bg-gold/15" aria-hidden />
      <div className="orb right-0 bottom-0 h-72 w-72 bg-paleblue/10" aria-hidden />
      <div className="absolute inset-0 bg-grid-dark opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand lockup */}
          <div>
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <Logo className="h-9 w-9" />
              <span className="text-xl font-bold tracking-tight text-white">
                Driveway Advocate
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/65">
              A buyer-side advocate for the finance office. We check the math,
              flag the traps, and tell you what to push back on — before you sign.
            </p>
            <p className="mt-4 text-sm font-semibold text-gold">
              They have a team. Now you do too.
            </p>
          </div>

          {/* Funnel paths */}
          <nav aria-label="Paths">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-cream/45">
              Paths
            </h3>
            <ul className="mt-4 space-y-2.5">
              {FUNNELS.map((f) => (
                <li key={f.id}>
                  <Link
                    href={f.route}
                    className="text-sm text-cream/70 transition hover:text-gold-light"
                  >
                    {f.homeTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Buyer paths */}
          <nav aria-label="Get started">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-cream/45">
              Get started
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/check"
                  className="text-sm font-semibold text-cream/85 transition hover:text-gold-light"
                >
                  Check my deal before I sign
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-cream/70 transition hover:text-gold-light"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/#what-we-catch"
                  className="text-sm text-cream/70 transition hover:text-gold-light"
                >
                  What we catch
                </Link>
              </li>
              <li>
                <Link
                  href="/credit-to-keys"
                  className="text-sm text-cream/70 transition hover:text-gold-light"
                >
                  Fix my credit first
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 space-y-6 border-t border-white/10 pt-8">
          <Disclaimer tone="dark" />
          <p className="text-xs text-cream/40">
            © {new Date().getFullYear()} Driveway Advocate. On the buyer&apos;s
            side, always.
          </p>
        </div>
      </div>
    </footer>
  );
}
