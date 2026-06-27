import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/products/ProductCard";
import { PRODUCT_CARDS } from "@/lib/products/product-catalog";

export const metadata = {
  title: "Products — Driveway Advocate",
  description:
    "Choose what you need help with: full deal check, warranty check, APR/payment check, add-ons & fees, human review, or deal rescue.",
};

export default function ProductsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="font-serif text-3xl font-semibold text-navy sm:text-4xl">
          Choose what you need help with
        </h1>
        <p className="mt-3 max-w-2xl text-navy/65">
          The free deal inspector reviews everything — but if you only need one
          thing checked, go straight to it. Every path is buyer‑side and
          decision‑support only.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_CARDS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <p className="mt-10 text-sm text-navy/55">
          Not buying yet?{" "}
          <Link href="/credit-to-keys" className="font-semibold text-gold-dark hover:underline">
            If you&apos;re 3–9 months out, start with Credit‑to‑Keys →
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
