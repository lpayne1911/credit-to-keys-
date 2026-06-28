import Link from "next/link";
import { type Product } from "@/lib/products/product-catalog";

/**
 * Cleaner, confidence-building badges. We deliberately avoid stamping "Beta" on
 * everything (it reads unfinished) — instead each card signals HOW it's
 * fulfilled: a focused automated scan, a human review, or post-purchase rescue.
 */
const BADGE: Record<string, { label: string; cls: string }> = {
  "deal-inspector": {
    label: "Full check",
    cls: "bg-gold/15 text-gold-dark ring-gold/30",
  },
  "warranty-check": {
    label: "Focused check",
    cls: "bg-paleblue text-navy/70 ring-navy/10",
  },
  "apr-check": {
    label: "Focused check",
    cls: "bg-paleblue text-navy/70 ring-navy/10",
  },
  "add-on-check": {
    label: "Focused check",
    cls: "bg-paleblue text-navy/70 ring-navy/10",
  },
  "human-review": {
    label: "Human review",
    cls: "bg-navy/8 text-navy/70 ring-navy/15",
  },
  "deal-rescue": {
    label: "Deal rescue",
    cls: "bg-flag-orange/12 text-flag-orange ring-flag-orange/25",
  },
};

const FALLBACK_BADGE = { label: "Fast scan", cls: "bg-navy/8 text-navy/70 ring-navy/15" };

/**
 * One product card. Routes to the product's OWN route from the catalog — never
 * hard-codes /check. Glass surface with a tactile hover-lift and a gold gradient
 * sheen that warms on hover.
 */
export function ProductCard({ product }: { product: Product }) {
  const isComingSoon = product.status === "coming_soon";
  const badge = BADGE[product.id] ?? FALLBACK_BADGE;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white/80 p-6 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift">
      {/* hover wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-transparent transition-colors duration-300 group-hover:from-gold/[0.05] group-hover:to-paleblue/40" />

      <div className="relative flex items-center justify-between gap-2">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy/5 text-2xl ring-1 ring-navy/10 transition group-hover:bg-gold/10"
          aria-hidden
        >
          {product.emoji}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      <h3 className="relative mt-4 font-serif text-lg font-semibold text-navy">
        {product.label}
      </h3>
      <p className="relative mt-1.5 text-sm leading-relaxed text-navy/75">
        &ldquo;{product.problem}&rdquo;
      </p>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-slate">
        {product.shortDescription}
      </p>
      <p className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate/80">
        <span>{product.estTime}</span>
        <span aria-hidden>·</span>
        <span>{product.intakeLabel}</span>
      </p>

      {isComingSoon ? (
        <span className="relative mt-5 inline-flex items-center justify-center rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy/45">
          Coming soon
        </span>
      ) : (
        <Link
          href={product.route}
          data-analytics={`clicked_${product.id.replace(/-/g, "_")}`}
          className="relative mt-5 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gold-dark transition group-hover:gap-2.5"
        >
          {product.ctaLabel}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
