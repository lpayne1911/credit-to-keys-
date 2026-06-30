import { describe, it, expect } from "vitest";
import {
  PRODUCTS,
  PRODUCT_CARDS,
  NAV_LINKS,
  getProduct,
  getProductByRoute,
} from "./product-catalog";

describe("product catalog routing", () => {
  it("each product routes to its own distinct path", () => {
    const expected: Record<string, string> = {
      "deal-inspector": "/check",
      "warranty-check": "/warranty-check",
      "apr-check": "/apr-check",
      "add-on-check": "/add-on-check",
      "human-review": "/human-review",
      // Post-signing help now lives at /post-sale-triage (the funnel page).
      "deal-rescue": "/post-sale-triage",
      "build-my-plan": "/build-my-plan",
      concierge: "/concierge",
    };
    for (const [id, route] of Object.entries(expected)) {
      expect(getProduct(id)?.route, id).toBe(route);
    }
  });

  it("ONLY the Free Deal Inspector routes to /check", () => {
    const toCheck = PRODUCTS.filter((p) => p.route === "/check");
    expect(toCheck).toHaveLength(1);
    expect(toCheck[0].id).toBe("deal-inspector");
  });

  it("routes are unique and non-empty", () => {
    const routes = PRODUCTS.map((p) => p.route);
    expect(new Set(routes).size).toBe(routes.length);
    for (const r of routes) expect(r.startsWith("/")).toBe(true);
  });

  it("every product card has a CTA label and a buyer intent", () => {
    for (const p of PRODUCT_CARDS) {
      expect(p.ctaLabel.length, p.id).toBeGreaterThan(0);
      expect(p.intent.length, p.id).toBeGreaterThan(0);
      expect(["live", "beta", "human_review_only", "coming_soon"]).toContain(p.status);
    }
  });

  it("non-automated products do not claim automated scoring", () => {
    expect(getProduct("human-review")?.usesAutomatedScoring).toBe(false);
    expect(getProduct("deal-rescue")?.usesAutomatedScoring).toBe(false);
  });

  it("nav routes by buyer situation into the journey-router pages", () => {
    const byLabel = Object.fromEntries(NAV_LINKS.map((l) => [l.label, l]));
    expect(byLabel["Deal in hand"].href).toBe("/deal-in-hand");
    expect(byLabel["Still shopping"].href).toBe("/still-shopping");
    expect(byLabel["Already signed"].href).toBe("/already-signed");
    expect(byLabel["Market Check"].href).toBe("/market-check");
    const primary = NAV_LINKS.find((l) => l.primary);
    expect(primary?.href).toBe("/deal-in-hand");
  });

  it("getProductByRoute round-trips", () => {
    expect(getProductByRoute("/warranty-check")?.id).toBe("warranty-check");
    expect(getProductByRoute("/apr-check")?.id).toBe("apr-check");
    expect(getProductByRoute("/nope")).toBeUndefined();
  });
});
