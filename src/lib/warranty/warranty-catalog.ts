/**
 * ============================================================================
 *  Vehicle service contract / extended warranty — name catalog
 * ============================================================================
 *
 * Dealers and the finance office sell the SAME product — a vehicle service
 * contract ("extended warranty") — under dozens of names. A buyer sold "Honda
 * Care," an "Endurance" plan, a "VSC," or "mechanical breakdown insurance" may
 * not realize all of these belong in the warranty price-check. The goal is
 * EXHAUSTIVE recognition: whatever it's called, the buyer feels covered.
 *
 * This file is the SINGLE SOURCE OF TRUTH for the catalog. It is consumed by:
 *   - the matcher in ./detect-warranty-line-item.ts
 *   - the warranty step UI (via WARRANTY_DISPLAY_GROUPS)
 *   - the upload parser (line-item classification)
 *
 * DISPLAY vs. MATCH: the display arrays err toward exhaustiveness so any buyer
 * recognizes their product. `matchTerms` is deliberately narrower — it omits
 * generic tier words and ambiguous abbreviations (see `ambiguousTermsExcluded`)
 * so the parser never misclassifies a fee or a vehicle feature as warranty.
 */

/** Plain, generic names a buyer most often hears. */
export const commonNames: string[] = [
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
];

/** How the coverage is described on the paperwork. */
export const paperworkNames: string[] = [
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
];

/** Official OEM / manufacturer-branded plan names. */
export const manufacturerPlans: string[] = [
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
];

/** Third-party providers, administrators, and aftermarket brands. */
export const providersAndAdministrators: string[] = [
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
];

/**
 * Distinctive substrings used to RECOGNIZE a service contract in free text.
 * Conservative: multi-word phrases and distinctive brand names match as
 * substrings; bare abbreviations (see SHORT_TERMS in the matcher) match only as
 * standalone words. Generic tier words and ambiguous abbreviations are excluded
 * (see `ambiguousTermsExcluded`).
 */
export const matchTerms: string[] = [
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
  // Bare abbreviations (word-boundary matched in the matcher)
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

/**
 * Adjacent F&I products that are NOT service contracts. Detection must keep
 * these OUT so the buyer is never told they're "covered" for something this
 * check doesn't price. Used as an explicit veto in the matcher.
 */
export const excludedProducts: string[] = [
  "gap",
  "guaranteed asset protection",
  "tire and wheel",
  "tire & wheel",
  "road hazard",
  "key replacement",
  "key fob",
  "remote replacement",
  "paint protection",
  "fabric protection",
  "appearance protection",
  "environmental protection",
  "ceramic coating",
  "paintless dent",
  "dent and ding",
  "ding protection",
  "windshield protection",
  "windshield repair",
  "theft etch",
  "vin etch",
  "anti-theft",
  "lojack",
  "gps recovery",
  "prepaid maintenance",
  "scheduled maintenance",
  "maintenance plan",
  "oil change plan",
  "credit life",
  "credit disability",
  "debt cancellation",
  "roadside assistance plan",
  "motor club",
];

/**
 * Bare terms that must NEVER match on their own — they're either generic tier
 * words that appear on unrelated add-ons, or abbreviations that collide with
 * vehicle features / finance-doc jargon (VSA = Honda Vehicle Stability Assist,
 * UCC = Uniform Commercial Code, etc.).
 */
export const ambiguousTermsExcluded: string[] = [
  "platinum",
  "gold",
  "silver",
  "bronze",
  "wrap",
  "vsa",
  "ucc",
  "aas",
  "ras",
  "nac",
  "tws",
  "mrc",
  "sgi",
];

export interface WarrantyDisplayGroup {
  label: string;
  names: string[];
}

/** Grouped for the warranty step UI ("names it goes by"). */
export const WARRANTY_DISPLAY_GROUPS: WarrantyDisplayGroup[] = [
  { label: "Common names", names: commonNames },
  { label: "How it reads on the paperwork", names: paperworkNames },
  { label: "Manufacturer plans", names: manufacturerPlans },
  { label: "Providers & administrators", names: providersAndAdministrators },
];

/** Flat, de-duplicated list of every display name (for prompts/exports/UI). */
export const WARRANTY_DISPLAY_NAMES: string[] = Array.from(
  new Set(WARRANTY_DISPLAY_GROUPS.flatMap((g) => g.names)),
);

/**
 * Catalog size snapshot. A dev/admin test asserts the live catalog never
 * accidentally shrinks below these counts (see warranty-catalog.test.ts).
 */
export const CATALOG_MIN_COUNTS = {
  commonNames: 16,
  paperworkNames: 14,
  manufacturerPlans: 30,
  providersAndAdministrators: 38,
  matchTerms: 120,
} as const;
