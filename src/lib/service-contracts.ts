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
 *
 * DISPLAY vs. MATCH: the grouped display list errs toward exhaustiveness so any
 * buyer recognizes their product. The match list ({@link SERVICE_CONTRACT_MATCH_TERMS})
 * is deliberately narrower — it omits generic tier words ("platinum", "gold")
 * and ambiguous abbreviations ("VSA" = Honda Vehicle Stability Assist, "UCC" =
 * Uniform Commercial Code) so the parser never misclassifies a fee as warranty.
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
      "Extended car warranty",
      "Vehicle service contract (VSC)",
      "Auto service contract",
      "Extended service contract (ESC)",
      "Extended service plan (ESP)",
      "Vehicle service agreement (VSA)",
      "Extended protection plan (EPP)",
      "Vehicle protection plan (VPP)",
      "Vehicle protection contract",
      "Auto protection plan",
      "Mechanical breakdown insurance (MBI)",
      "Mechanical breakdown protection (MBP)",
      "Mechanical repair coverage",
      "Repair agreement",
      "Factory- or manufacturer-backed extended coverage",
      "Aftermarket / third-party warranty",
      "Breakdown coverage",
    ],
  },
  {
    label: "How it reads on the paperwork",
    names: [
      "Powertrain coverage",
      "Drivetrain / driveline coverage",
      "Stated-component coverage",
      "Named-component coverage",
      "Listed-component coverage",
      "Inclusionary coverage",
      "Exclusionary coverage",
      "Bumper-to-bumper (comprehensive) coverage",
      "Wrap / wraparound coverage",
      "Certified Pre-Owned (CPO) coverage",
      "Limited warranty extension",
      "High-mileage coverage",
      "New- or pre-owned-vehicle coverage",
      "Hybrid / EV (battery & drive-unit) coverage",
      "Coverage tiers: Platinum · Gold · Gold Plus · Silver · Bronze · Titanium · Classic",
    ],
  },
  {
    label: "Manufacturer plans",
    names: [
      "Toyota Extra Care",
      "Lexus Extra Care / Extended Care",
      "Honda Care",
      "Acura Care",
      "Ford Protect (PremiumCARE · ExtraCARE · BaseCARE · PowertrainCARE)",
      "Lincoln Protect",
      "Chevrolet / GMC / Buick / Cadillac Protection Plan (GM Protection Plan, GMPP)",
      "Mopar Vehicle Protection (MVP) — Maximum Care · Added Care Plus",
      "Stellantis FlexCare (Chrysler · Dodge · Jeep · Ram · Fiat · Alfa Romeo)",
      "Hyundai Protection Plan",
      "Kia Distinction / Kia Protection Plan",
      "Genesis Protection Plan",
      "Nissan Security+Plus",
      "INFINITI Elite",
      "Subaru Added Security (Classic · Gold Plus)",
      "Mazda Protection Products / Extended Confidence",
      "Volkswagen Drive Easy",
      "Audi Pure Protection",
      "BMW Ultimate Protection / Extended Service",
      "MINI Motoring Protection",
      "Mercedes-Benz Extended Limited Warranty",
      "Volvo Increased Protection (VIP)",
      "Porsche Vehicle Service Protection (EVSP)",
      "Land Rover / Jaguar Vehicle Service Protection",
      "Mitsubishi Diamond Care",
      "Tesla Extended Service Agreement (ESA)",
      "Polestar Vehicle Service Contract",
      "Rivian Care",
      "Maserati Extended Warranty (Extra10)",
      "Ferrari New Power",
      "Lamborghini Selezione Warranty Extension",
      "Bentley Extended Service Program",
      "Rolls-Royce Extended Service Contract",
    ],
  },
  {
    label: "Providers & administrators",
    names: [
      "Endurance",
      "CarShield",
      "American Auto Shield",
      "CARCHEX",
      "Zurich / Zurich Shield",
      "Ally Premier Protection (Major · Value · Basic Guard)",
      "Fidelity Warranty Services (FWS)",
      "JM&A Group",
      "Assurant Vehicle Care",
      "Protective Asset Protection / XtraRide",
      "AUL Corp",
      "EasyCare",
      "GWC Warranty",
      "National Auto Care (NAC)",
      "Safe-Guard",
      "Warrantech / CustomEdge",
      "American Guardian (AGWS) / Compass",
      "CNA National",
      "Royal Administration Services",
      "Omega Auto Care",
      "olive",
      "Toco Warranty",
      "autopom!",
      "Nation Safe Drivers (NSD)",
      "CARS Protection Plus",
      "CareGard",
      "Portfolio",
      "Total Warranty Services / First Mile",
      "Old Republic (Total Vehicle Protection)",
      "United Car Care",
      "Veritas Global Protection",
      "EG Assurance",
      "Mechanical Protection Plan (MPP)",
      "SilverRock / CarvanaCare",
      "Route 66",
      "ASC Warranty",
      "ForeverCar",
      "Premier Auto Protect",
      "American Dream Auto Protect",
      "Concord Auto Protect",
    ],
  },
];

/**
 * Distinctive substrings used to RECOGNIZE a service contract in free text
 * (e.g. a quote line item the parser pulled). Kept separate from the display
 * names and deliberately conservative: multi-word phrases and distinctive brand
 * names match as substrings; bare abbreviations match only as standalone words
 * (see {@link isServiceContract}). Generic tier words ("platinum", "gold",
 * "silver", "bronze", bare "wrap") and ambiguous abbreviations ("vsa", "ucc",
 * "aas", "ras", "nac", "tws", "mrc", "sgi") are intentionally EXCLUDED to avoid
 * false positives on vehicle features, finance-doc jargon, or other F&I add-ons.
 */
export const SERVICE_CONTRACT_MATCH_TERMS: string[] = [
  // Generic terms
  "extended warranty",
  "extended car warranty",
  "extended service contract",
  "extended service plan",
  "extended protection plan",
  "vehicle service contract",
  "auto service contract",
  "motor vehicle service contract",
  "service contract",
  "service agreement",
  "vehicle service agreement",
  "vehicle protection plan",
  "vehicle protection contract",
  "auto protection plan",
  "mechanical breakdown insurance",
  "mechanical breakdown protection",
  "mechanical breakdown",
  "mechanical repair coverage",
  "repair agreement",
  "breakdown coverage",
  // Coverage descriptions
  "powertrain coverage",
  "powertrain protection",
  "drivetrain coverage",
  "driveline",
  "stated component",
  "named component",
  "listed component",
  "inclusionary",
  "exclusionary coverage",
  "wrap coverage",
  "wraparound",
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
  "maximum care",
  "added care plus",
  "powertrain care plus",
  "extended care premium",
  "extended care plus",
  "flexcare",
  "hyundai protection",
  "kia distinction",
  "kia protect",
  "genesis protection",
  "security+plus",
  "security plus",
  "infiniti elite",
  "added security",
  "gold plus",
  "extended confidence",
  "drive easy",
  "drivergard",
  "pure protection",
  "ultimate protection",
  "ultimate care",
  "motoring protection",
  "extended limited warranty",
  "increased protection",
  "vehicle service protection",
  "extended service agreement",
  "diamond care",
  "selezione",
  "new power warranty",
  "extra10",
  "extended service program",
  // Providers & administrators
  "endurance",
  "carshield",
  "carchex",
  "american auto shield",
  "zurich",
  "premier protection",
  "fidelity warranty",
  "assurant",
  "asset protection",
  "xtraride",
  "easycare",
  "gwc warranty",
  "national auto care",
  "warrantech",
  "customedge",
  "american guardian",
  "compass protection",
  "cna national",
  "jm&a",
  "safe-guard",
  "safeguard",
  "silverrock",
  "carvanacare",
  "aul corp",
  "royal administration",
  "omega auto care",
  "autopom",
  "toco warranty",
  "nation safe drivers",
  "cars protection plus",
  "caregard",
  "portfolio protection",
  "total warranty services",
  "first mile",
  "old republic",
  "united car care",
  "veritas global",
  "eg assurance",
  "mechanical protection plan",
  "route 66",
  "asc warranty",
  "forevercar",
  "premier auto protect",
  "american dream auto protect",
  "concord auto protect",
  // Bare abbreviations (word-boundary matched)
  "vsc",
  "esc",
  "esp",
  "epp",
  "vpp",
  "mbi",
  "mbp",
  "gmpp",
  "gmepp",
  "mvp",
  "vip",
  "esa",
  "evsp",
  "vsp",
  "mpp",
  "fws",
  "agws",
  "orias",
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
  "epp",
  "vpp",
  "mbi",
  "mbp",
  "gmpp",
  "gmepp",
  "mvp",
  "vip",
  "esa",
  "evsp",
  "vsp",
  "mpp",
  "fws",
  "agws",
  "orias",
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
