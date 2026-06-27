import { Disclaimer } from "@/components/Disclaimer";
import {
  STATUS_LABEL,
  type Product,
  type ProductType,
} from "@/lib/products/product-catalog";

const TYPE_LABEL: Record<ProductType, string> = {
  automated: "Instant automated check",
  human_review: "Reviewed by a real person",
  intake: "Guided intake → human advocate",
};

const STATUS_STYLE: Record<string, string> = {
  live: "bg-verdict-green/10 text-verdict-green",
  beta: "bg-gold/15 text-gold-dark",
  human_review_only: "bg-navy-50 text-navy/70",
  coming_soon: "bg-navy-50 text-navy/45",
};

/**
 * Tailored intro shown at the top of every product route. Renders entirely from
 * the product catalog so copy and routing can't drift: what it checks, what to
 * provide, what you get back, whether it's automated or human, and the
 * decision-support disclaimer.
 */
export function ProductIntro({ product }: { product: Product }) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
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
      <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-navy">
        {product.label}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-navy/70">
        {product.page.what}
      </p>

      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-navy/50">
            What you provide
          </dt>
          <dd className="mt-1.5">
            <ul className="list-disc space-y-1 pl-5 text-sm text-navy/70">
              {product.page.inputs.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-navy/50">
            What you get back
          </dt>
          <dd className="mt-1 text-sm text-navy/70">{product.page.result}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-navy/50">
            How it works
          </dt>
          <dd className="mt-1 text-sm text-navy/70">
            {TYPE_LABEL[product.type]}
            {product.supportsHumanReview && product.type === "automated"
              ? " — with the option to escalate to a human advocate."
              : ""}
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <Disclaimer variant="compact" />
      </div>
    </div>
  );
}
