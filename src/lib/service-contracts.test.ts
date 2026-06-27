import { describe, it, expect } from "vitest";
import {
  SERVICE_CONTRACT_GROUPS,
  SERVICE_CONTRACT_NAMES,
  isServiceContract,
} from "./service-contracts";

describe("service-contract catalog", () => {
  it("is grouped and non-trivially exhaustive", () => {
    expect(SERVICE_CONTRACT_GROUPS.length).toBeGreaterThanOrEqual(4);
    for (const g of SERVICE_CONTRACT_GROUPS) {
      expect(g.label.length).toBeGreaterThan(0);
      expect(g.names.length).toBeGreaterThan(0);
    }
    // The flat list should be sizable and de-duplicated.
    expect(SERVICE_CONTRACT_NAMES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(SERVICE_CONTRACT_NAMES).size).toBe(
      SERVICE_CONTRACT_NAMES.length,
    );
  });
});

describe("isServiceContract", () => {
  it("recognizes the product under whatever name a buyer was sold", () => {
    const yes = [
      "Extended Warranty",
      "EXTENDED SERVICE CONTRACT",
      "Vehicle Service Contract",
      "VSC",
      "MBI",
      "Mechanical Breakdown Insurance",
      "Honda Care",
      "Acura Care",
      "Ford Protect PremiumCARE",
      "GM Protection Plan",
      "Mopar MaxCare",
      "Nissan Security+Plus",
      "Subaru Added Security",
      "Volvo Increased Protection",
      "Tesla Extended Service Agreement",
      "Endurance Supreme",
      "Zurich Shield",
      "CarShield plan",
      "Ally Premier Protection",
      "Fidelity Warranty Services",
      "Powertrain coverage 60mo",
      "Exclusionary coverage",
      "Stellantis FlexCare",
      "Kia Distinction",
      "Genesis Protection Plan",
      "Mitsubishi Diamond Care",
      "olive VSC",
      "SilverRock Limited Warranty",
      "Route 66 Powertrain",
      "Veritas Global Protection",
      "Mechanical Protection Plan",
    ];
    for (const name of yes) {
      expect(isServiceContract(name), `should match: ${name}`).toBe(true);
    }
  });

  it("does not misfire on adjacent F&I products or unrelated fees", () => {
    const no = [
      "GAP Insurance",
      "Tire & Wheel Protection",
      "Paint and fabric protection",
      "Appearance Protection Package",
      "Key Replacement",
      "Prepaid Maintenance",
      "Documentation Fee",
      "Nitrogen tire fill",
      "Dealer prep fee",
      "especially clean carfax", // 'esp' must not match inside a word
      "Vehicle Stability Assist (VSA)", // Honda feature, not a contract
      "Uniform Commercial Code filing", // 'UCC' finance jargon, not a contract
      "Platinum paint protection package", // tier word must not match alone
      "Gold appearance package",
      "",
      null,
      undefined,
    ];
    for (const name of no) {
      expect(isServiceContract(name), `should NOT match: ${name}`).toBe(false);
    }
  });
});
