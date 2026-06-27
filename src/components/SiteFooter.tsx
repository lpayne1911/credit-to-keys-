import Link from "next/link";
import { Disclaimer } from "./Disclaimer";
import { PRODUCTS } from "@/lib/products/product-catalog";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-cream-100">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <nav aria-label="Products" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/products" className="text-sm font-semibold text-navy/75 hover:text-navy">
            All products
          </Link>
          {PRODUCTS.filter((p) => p.status !== "coming_soon").map((p) => (
            <Link
              key={p.id}
              href={p.route}
              className="text-sm text-navy/60 hover:text-navy"
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <Disclaimer />
        <p className="text-xs text-navy/45">
          © {new Date().getFullYear()} Driveway Advocate. On the buyer&apos;s
          side, always.
        </p>
      </div>
    </footer>
  );
}
