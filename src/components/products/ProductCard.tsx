import Link from "next/link";
import { STATUS_LABEL, type Product } from "@/lib/products/product-catalog";

const STATUS_STYLE: Record<string, string> = {
  live: "bg-verdict-green/10 text-verdict-green",
  beta: "bg-gold/15 text-gold-dark",
  human_review_only: "bg-navy-50 text-navy/70",
  coming_soon: "bg-navy-50 text-navy/45",
};

/**
 * One product card. Routes to the product's OWN route from the catalog — never
 * hard-codes /check. Used on the homepage "what do you need help with" grid and
 * the /products overview.
 */
export function ProductCard({ product }: { product: Product }) {
  const isComingSoon = product.status === "coming_soon";
  return (
    <div className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl" aria-hidden>
          {product.emoji}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
            STATUS_STYLE[product.status] ?? "bg-navy-50 text-navy/60"
          }`}
        >
          {STATUS_LABEL[product.status]}
        </span>
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-navy">
        {product.label}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-navy/70">
        &ldquo;{product.problem}&rdquo;
      </p>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-navy/55">
        {product.shortDescription}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-navy/45">
        <span>{product.estTime}</span>
        <span aria-hidden>·</span>
        <span>{product.intakeLabel}</span>
      </p>
      {isComingSoon ? (
        <span className="mt-5 inline-flex items-center justify-center rounded-xl border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy/45">
          Coming soon
        </span>
      ) : (
        <Link
          href={product.route}
          data-analytics={`clicked_${product.id.replace(/-/g, "_")}`}
          className="btn-primary mt-5 text-center text-sm"
        >
          {product.ctaLabel}
        </Link>
      )}
    </div>
  );
}
