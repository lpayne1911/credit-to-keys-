import { describe, it, expect } from "vitest";
import {
  commonNames,
  paperworkNames,
  manufacturerPlans,
  providersAndAdministrators,
  matchTerms,
  excludedProducts,
  ambiguousTermsExcluded,
  WARRANTY_DISPLAY_GROUPS,
  WARRANTY_DISPLAY_NAMES,
  CATALOG_MIN_COUNTS,
} from "./warranty-catalog";

describe("warranty catalog shape", () => {
  it("exposes all required sections, non-empty", () => {
    expect(commonNames.length).toBeGreaterThan(0);
    expect(paperworkNames.length).toBeGreaterThan(0);
    expect(manufacturerPlans.length).toBeGreaterThan(0);
    expect(providersAndAdministrators.length).toBeGreaterThan(0);
    expect(matchTerms.length).toBeGreaterThan(0);
    expect(excludedProducts.length).toBeGreaterThan(0);
    expect(ambiguousTermsExcluded.length).toBeGreaterThan(0);
  });

  it("display groups + flat names are consistent and de-duplicated", () => {
    expect(WARRANTY_DISPLAY_GROUPS.length).toBe(4);
    expect(new Set(WARRANTY_DISPLAY_NAMES).size).toBe(
      WARRANTY_DISPLAY_NAMES.length,
    );
    expect(new Set(matchTerms).size).toBe(matchTerms.length);
  });

  it("no ambiguous term leaked into the match list", () => {
    const ambiguous = new Set(ambiguousTermsExcluded);
    for (const t of matchTerms) {
      expect(ambiguous.has(t.toLowerCase()), `leaked: ${t}`).toBe(false);
    }
  });
});

/**
 * ADMIN / DEV GUARD: fails if the catalog accidentally shrinks (e.g. a refactor
 * drops names). Counts are floors, not exact — adding names is always fine.
 */
describe("catalog does not accidentally shrink", () => {
  it("meets minimum counts", () => {
    expect(commonNames.length).toBeGreaterThanOrEqual(
      CATALOG_MIN_COUNTS.commonNames,
    );
    expect(paperworkNames.length).toBeGreaterThanOrEqual(
      CATALOG_MIN_COUNTS.paperworkNames,
    );
    expect(manufacturerPlans.length).toBeGreaterThanOrEqual(
      CATALOG_MIN_COUNTS.manufacturerPlans,
    );
    expect(providersAndAdministrators.length).toBeGreaterThanOrEqual(
      CATALOG_MIN_COUNTS.providersAndAdministrators,
    );
    expect(matchTerms.length).toBeGreaterThanOrEqual(
      CATALOG_MIN_COUNTS.matchTerms,
    );
  });
});
