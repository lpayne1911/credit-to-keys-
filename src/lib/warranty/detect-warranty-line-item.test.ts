import { describe, it, expect } from "vitest";
import {
  detectWarrantyLineItem,
  isWarrantyLineItem,
} from "./detect-warranty-line-item";

describe("detectWarrantyLineItem — matches service contracts under any name", () => {
  const MATCHES = [
    "Honda Care",
    "Toyota Extra Care",
    "Ford Protect ESP",
    "Mopar Maximum Care",
    "Stellantis FlexCare",
    "GM Protection Plan",
    "Nissan Security+Plus",
    "Subaru Added Security",
    "VW Drive Easy",
    "Audi Pure Protection",
    "BMW Ultimate Protection",
    "Mercedes Extended Limited Warranty",
    "Zurich VSC",
    "Endurance",
    "CarShield",
    "Fidelity Warranty Services",
    "JM&A",
    "Safe-Guard",
    "EasyCare",
    "GWC Warranty",
    "AUL Corp",
    "Protective XtraRide",
    "SilverRock",
    "CarvanaCare",
    // Regression (found by the full release matrix): brand-specific GM
    // Protection Plan variants and Rivian Care were missed before.
    "Chevrolet Protection Plan",
    "GMC Protection Plan",
    "Buick Protection Plan",
    "Cadillac Protection Plan",
    "Subaru Added Security Gold Plus",
    "Rivian Care - $4,000",
    // a few generic forms too
    "Extended Warranty",
    "Vehicle Service Contract",
    "Mechanical Breakdown Insurance",
  ];

  for (const name of MATCHES) {
    it(`matches: ${name}`, () => {
      const d = detectWarrantyLineItem(name);
      expect(d.isWarranty, `${name} → ${JSON.stringify(d)}`).toBe(true);
      expect(d.matchedTerm).toBeTruthy();
    });
  }
});

describe("detectWarrantyLineItem — excludes non-warranty F&I products", () => {
  const NON_WARRANTY = [
    "GAP",
    "GAP Insurance",
    "Guaranteed Asset Protection",
    "Tire and Wheel Protection",
    "Tire & Wheel",
    "Road Hazard",
    "Key Replacement",
    "Paint and Fabric Protection",
    "Appearance Protection Package",
    "Prepaid Maintenance",
    "Windshield Protection",
    "Theft Etch",
    "VIN Etch",
    "Anti-Theft",
    "Credit Life",
    "Roadside Assistance Plan",
    // Regression (found by the full release matrix): a paint-protection-film
    // "wrap coverage" must NOT read as a VSC wrap policy.
    "Wrap Coverage for Paint Film",
  ];

  for (const name of NON_WARRANTY) {
    it(`does not match: ${name}`, () => {
      expect(isWarrantyLineItem(name), name).toBe(false);
    });
  }
});

describe("detectWarrantyLineItem — never matches ambiguous bare terms", () => {
  const AMBIGUOUS = [
    "Platinum",
    "Gold",
    "Silver",
    "Bronze",
    "Wrap",
    "Vehicle Stability Assist", // VSA
    "VSA",
    "Uniform Commercial Code", // UCC
    "UCC filing",
    "AAS",
    "RAS",
    "NAC",
    "TWS",
    "MRC",
    "SGI",
    "especially clean carfax", // 'esp' inside a word must not match
    // Regression: tier word "Gold Plus" on a detailing package must not match.
    "Gold Plus Detailing Package",
    "Platinum Interior Protection",
    "Silver Exterior Bundle",
  ];

  for (const name of AMBIGUOUS) {
    it(`does not match: ${name}`, () => {
      expect(isWarrantyLineItem(name), name).toBe(false);
    });
  }

  it("handles empty/nullish input", () => {
    expect(isWarrantyLineItem("")).toBe(false);
    expect(isWarrantyLineItem(null)).toBe(false);
    expect(isWarrantyLineItem(undefined)).toBe(false);
  });

  it("an excluded product vetoes even when a warranty word is present", () => {
    // "tire & wheel protection plan" contains 'protection' phrasing but the
    // excluded product must win.
    const d = detectWarrantyLineItem("Tire & Wheel Protection Plan");
    expect(d.isWarranty).toBe(false);
    expect(d.excludedBy).toBeTruthy();
  });
});
