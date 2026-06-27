"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FocusedCheck } from "@/components/products/FocusedCheck";
import { ProductIntro } from "@/components/products/ProductIntro";
import { getProduct } from "@/lib/products/product-catalog";

/**
 * Entry page for an automated focused check (warranty / APR / add-ons). Shows a
 * tailored intro (what it checks, what to provide, what you get), then launches
 * the product-specific FocusedCheck flow — only the questions that product needs,
 * its own result. No /check redirect, no whole-deal requirement.
 */
export function FocusedCheckLanding({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const [started, setStarted] = useState(false);

  if (!product) return null;
  if (started) {
    return <FocusedCheck productId={productId} />;
  }

  return (
    <>
      <SiteHeader />
      <main className="relative mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="orb -left-16 top-0 h-64 w-64 bg-gold/12" />
          <div className="orb right-[-4rem] top-1/3 h-72 w-72 bg-paleblue/60" />
        </div>
        <div className="glass p-6 sm:p-8">
          <ProductIntro product={product} />
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setStarted(true)}
            data-analytics={`clicked_${product.id.replace(/-/g, "_")}`}
            className="btn-primary w-full !py-4 text-base"
          >
            {product.ctaLabel}
          </button>
          <p className="mt-3 text-center text-xs text-slate">
            Free. No account needed. About 30 seconds.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
