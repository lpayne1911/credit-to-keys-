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
      ["deal-rescue", "/post-sale-triage"],
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

  it("footer exposes the four funnel paths", () => {
    const markup = html(createElement(SiteFooter));
    expect(markup).toContain('href="/quote-review"');
    expect(markup).toContain('href="/build-my-plan"');
    expect(markup).toContain('href="/concierge"');
    expect(markup).toContain('href="/post-sale-triage"');
  });

  it("header nav routes to the funnels with quote review as primary", () => {
    const markup = html(createElement(SiteHeader));
    expect(markup).toContain('href="/concierge"');
    expect(markup).toContain('href="/post-sale-triage"');
    expect(markup).toContain('href="/quote-review"');
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
