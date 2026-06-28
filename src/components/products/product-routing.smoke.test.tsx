import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductCard } from "@/components/products/ProductCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getProduct, PRODUCTS } from "@/lib/products/product-catalog";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("product CTA routing (rendered markup)", () => {
  it("each product card links to its own route, not /check", () => {
    const cases: Array<[string, string]> = [
      ["warranty-check", "/warranty-check"],
      ["apr-check", "/apr-check"],
      ["add-on-check", "/add-on-check"],
      ["human-review", "/human-review"],
      ["deal-rescue", "/deal-rescue"],
    ];
    for (const [id, route] of cases) {
      const markup = html(createElement(ProductCard, { product: getProduct(id)! }));
      expect(markup, id).toContain(`href="${route}"`);
      expect(markup, `${id} must not route to /check`).not.toContain('href="/check"');
    }
  });

  it("the Free Deal Inspector card routes to /check", () => {
    const markup = html(createElement(ProductCard, { product: getProduct("deal-inspector")! }));
    expect(markup).toContain('href="/check"');
  });

  it("footer exposes product links (not only the free check)", () => {
    const markup = html(createElement(SiteFooter));
    expect(markup).toContain('href="/products"');
    expect(markup).toContain('href="/warranty-check"');
    expect(markup).toContain('href="/apr-check"');
    expect(markup).toContain('href="/add-on-check"');
    expect(markup).toContain('href="/human-review"');
    expect(markup).toContain('href="/deal-rescue"');
  });

  it("header nav routes to human review, deal rescue, and the free check", () => {
    const markup = html(createElement(SiteHeader));
    expect(markup).toContain('href="/human-review"');
    expect(markup).toContain('href="/deal-rescue"');
    expect(markup).toContain('href="/check"');
    expect(markup).toContain("How it works");
    expect(markup).toContain("What we catch");
    expect(markup).not.toContain("Pricing");
  });

  it("coming-soon products render no live CTA link", () => {
    const comingSoon = PRODUCTS.filter((p) => p.status === "coming_soon");
    for (const p of comingSoon) {
      const markup = html(createElement(ProductCard, { product: p }));
      expect(markup).not.toContain(`href="${p.route}"`);
    }
  });
});
