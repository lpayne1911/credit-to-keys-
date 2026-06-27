/**
 * ============================================================================
 *  Service-contract name catalog
 * ============================================================================
 *
 * Dealers and the finance office sell the SAME product — a vehicle service
 * contract (an "extended warranty") — under dozens of different names. A buyer
 * who was sold "Honda Care," an "Endurance" plan, a "VSC," or "mechanical
 * breakdown insurance" may not realize all of these belong in the warranty
 * price-check. The goal here is EXHAUSTIVE recognition: whatever it's called,
 * the buyer should see their product named and feel covered.
 *
 * This catalog drives two things:
 *   1. The warranty step UI — a reassuring "also called…" list so anyone
 *      recognizes their contract.
 *   2. The upload parser — recognizing a service-contract line item no matter
 *      what label the dealer printed on it (see {@link isServiceContract}).
 *
 * It deliberately does NOT include adjacent F&I products that are NOT service
 * contracts — GAP, tire-and-wheel, key replacement, paint/fabric protection,
 * prepaid maintenance — those are handled (or flagged) elsewhere. Mixing them
 * in would make a buyer "feel covered" for something this check doesn't price.
 */

export interface ServiceContractGroup {
  /** Short heading shown above the names in the UI. */
  label: string;
  /** Names/aliases in this group, as a buyer would see them on paperwork. */
  names: string[];
}

/**
 * Grouped for display. Order = how a buyer is most likely to recognize it:
 * the plain terms first, then how it's described on paper, then brand names.
 */
export const SERVICE_CONTRACT_GROUPS: ServiceContractGroup[] = [
  {
    label: "Common names",
    names: [
      "Extended warranty",
      "Extended service contract (ESC)",
      "Extended service plan (ESP)",
      "Vehicle service contract (VSC)",
      "Service contract",
      "Vehicle protection plan",
      "Auto protection plan",
      "Mechanical breakdown insurance (MBI)",
      "Mechanical breakdown protection",
      "Mechanical repair coverage",
      "Repair coverage",
    ],
  },
  {
    label: "How it reads on the paperwork",
    names: [
      "Powertrain coverage",
      "Drivetrain coverage",
      "Stated-component coverage",
      "Named-component coverage",
      "Major-component coverage",
      "Wrap coverage",
      "Exclusionary coverage",
      "Bumper-to-bumper coverage",
      "Certified pre-owned (CPO) coverage",
      "Limited warranty extension",
    ],
  },
  {
    label: "Manufacturer plans",
    names: [
      "Toyota Extra Care",
      "Lexus Extended Care",
      "Honda Care",
      "Acura Care",
      "Ford Protect / Ford ESP / PremiumCARE",
      "Lincoln Protect",
      "GM Protection Plan (GMPP)",
      "Mopar Vehicle Protection / MaxCare",
      "Hyundai Protection Plan",
      "Kia Protect",
      "Nissan Security+Plus",
      "Infiniti Elite",
      "Subaru Added Security / Gold Plus",
      "Mazda Extended Confidence",
      "Volkswagen DriverGard",
      "Audi Pure Protection",
      "BMW Extended Service / Ultimate Care",
      "Mercedes-Benz Extended Limited Warranty",
      "Volvo Increased Protection (VIP)",
      "Tesla Extended Service Agreement (ESA)",
    ],
  },
  {
    label: "Providers & administrators",
    names: [
      "Endurance",
      "CarShield",
      "CARCHEX",
      "Zurich / Zurich Shield",
      "Ally Premier Protection",
      "Fidelity Warranty Services (FWS)",
      "Assurant",
      "Protective Asset Protection / XtraRide",
      "EasyCare",
      "GWC Warranty",
      "Warrantech",
      "JM&A Group",
      "Safe-Guard",
      "SilverRock",
      "AUL Corp",
      "Royal Administration",
      "American Auto Shield",
      "Omega Auto Care",
      "Olive",
      "autopom!",
      "Toco Warranty",
      "NSD",
    ],
  },
];

/**
 * Distinctive substrings used to RECOGNIZE a service contract in free text
 * (e.g. a quote line item the parser pulled). Kept separate from the display
 * names so we can: (a) normalize away the "(ABBR)" parentheticals, (b) split
 * "A / B" display entries into their real-world variants, and (c) add bare
 * abbreviations a dealer might print on their own. Short/ambiguous tokens are
 * matched on word boundaries (see {@link isServiceContract}) to avoid false
 * positives like "esp" inside "especially".
 */
export const SERVICE_CONTRACT_MATCH_TERMS: string[] = [
  // Generic terms
  "extended warranty",
  "extended service contract",
  "extended service plan",
  "vehicle service contract",
  "service contract",
  "service agreement",
  "vehicle protection plan",
  "auto protection plan",
  "mechanical breakdown insurance",
  "mechanical breakdown protection",
  "mechanical breakdown",
  "mechanical repair coverage",
  "breakdown coverage",
  // Coverage descriptions
  "powertrain coverage",
  "powertrain protection",
  "drivetrain coverage",
  "stated component",
  "named component",
  "major component",
  "wrap coverage",
  "exclusionary coverage",
  "bumper-to-bumper coverage",
  "certified pre-owned coverage",
  "cpo coverage",
  "limited warranty extension",
  // Manufacturer plans
  "extra care",
  "honda care",
  "acura care",
  "lexus extended care",
  "ford protect",
  "premiumcare",
  "lincoln protect",
  "gm protection plan",
  "mopar vehicle protection",
  "maxcare",
  "hyundai protection",
  "kia protect",
  "security+plus",
  "security plus",
  "infiniti elite",
  "added security",
  "gold plus",
  "extended confidence",
  "drivergard",
  "pure protection",
  "ultimate care",
  "extended limited warranty",
  "increased protection",
  "extended service agreement",
  // Providers & administrators
  "endurance",
  "carshield",
  "carchex",
  "zurich",
  "premier protection",
  "fidelity warranty",
  "assurant",
  "asset protection",
  "xtraride",
  "easycare",
  "gwc warranty",
  "warrantech",
  "jm&a",
  "safe-guard",
  "safeguard",
  "silverrock",
  "aul corp",
  "royal administration",
  "american auto shield",
  "omega auto care",
  "autopom",
  "toco warranty",
  // Bare abbreviations (word-boundary matched)
  "vsc",
  "esc",
  "esp",
  "mbi",
  "gmpp",
  "vip",
  "esa",
  "fws",
  "nsd",
];

/** A flat, de-duplicated list of every display name (for prompts/exports). */
export const SERVICE_CONTRACT_NAMES: string[] = Array.from(
  new Set(SERVICE_CONTRACT_GROUPS.flatMap((g) => g.names)),
);

/** Abbreviations short enough to need whole-word matching to avoid false hits. */
const SHORT_TERMS = new Set([
  "vsc",
  "esc",
  "esp",
  "mbi",
  "gmpp",
  "vip",
  "esa",
  "fws",
  "nsd",
  "cpo",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+&-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Does this text (a quote line item, fee label, or free-form name) refer to a
 * vehicle service contract / extended warranty? Conservative on purpose:
 * multi-word phrases and distinctive brand names match as substrings; bare
 * abbreviations match only as standalone words.
 */
export function isServiceContract(text: string | null | undefined): boolean {
  if (!text) return false;
  const norm = normalize(text);
  if (!norm) return false;
  const padded = ` ${norm} `;
  for (const term of SERVICE_CONTRACT_MATCH_TERMS) {
    const t = normalize(term);
    if (!t) continue;
    if (SHORT_TERMS.has(t)) {
      if (padded.includes(` ${t} `)) return true;
    } else if (norm.includes(t)) {
      return true;
    }
  }
  return false;
}
