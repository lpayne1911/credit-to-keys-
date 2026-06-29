/**
 * ============================================================================
 *  Driveway Advocate — Used-Car Risk Report (pilot engine)
 * ============================================================================
 *
 * A self-contained, deterministic, rule-based engine that turns a buyer's
 * description of a used vehicle into a buyer-side RISK PREVIEW — never a paid,
 * completed, mechanical, title, safety, or legal determination.
 *
 * Compliance rules (mirrors the rest of the product):
 *  - Buyer-side only. No commissions, no kickbacks, no steering.
 *  - No false precision. Confidence levels, never an "exact value."
 *  - Never calls a vehicle unsafe, determines title legality, accuses anyone of
 *    wrongdoing, guarantees reliability/refund/savings/outcome, or invents
 *    vehicle-history facts. It reflects ONLY what the buyer entered and points
 *    them at independent verification.
 *  - Decision support, not legal, financial, tax, or insurance advice.
 *
 * No AI, no network, no database. Pure function: same input → same output.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
//  INPUT TYPES
// ---------------------------------------------------------------------------

export type SignedStatus = "not_yet" | "already_signed" | "not_sure";

export type SellerType =
  | "franchise_dealer"
  | "independent_dealer"
  | "private_seller"
  | "online_retailer"
  | "auction"
  | "not_sure";

export type TitleStatus =
  | "clean"
  | "rebuilt"
  | "salvage"
  | "branded"
  | "lemon_buyback"
  | "not_sure"
  | "unknown";

export type AccidentHistory =
  | "none_reported"
  | "minor"
  | "moderate"
  | "severe"
  | "airbag_deployed"
  | "structural_damage"
  | "not_sure"
  | "unknown";

export type UseHistory =
  | "personal"
  | "rental"
  | "fleet"
  | "commercial"
  | "rideshare"
  | "not_sure"
  | "unknown";

export type NumberOfOwners = "one" | "two" | "three_plus" | "unknown";

export type OpenRecalls = "none_known" | "yes" | "not_checked" | "unknown";

export type CpoClaimed = "yes" | "no" | "not_sure";

export type Concern =
  | "price_too_good"
  | "dealer_rushing"
  | "history_missing"
  | "title_unclear"
  | "prev_rental_fleet"
  | "accident_worry"
  | "mileage_inconsistent"
  | "no_full_otd"
  | "inspection_not_needed"
  | "already_signed_trapped"
  | "need_seller_questions"
  | "need_walkaway_triggers";

export interface UsedCarVehicle {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  mileage?: number | null;
  askingPrice?: number | null;
  outTheDoorPrice?: number | null;
  purchaseState?: string | null;
  sellerType: SellerType;
}

export interface UsedCarStatus {
  titleStatus: TitleStatus;
  accidentHistory: AccidentHistory;
  useHistory: UseHistory;
  numberOfOwners: NumberOfOwners;
  openRecalls: OpenRecalls;
  cpoClaimed: CpoClaimed;
}

export interface UsedCarRiskInput {
  signed: SignedStatus;
  vehicle: UsedCarVehicle;
  status: UsedCarStatus;
  concerns: Concern[];
}

// ---------------------------------------------------------------------------
//  OUTPUT TYPES
// ---------------------------------------------------------------------------

export type OverallLabel =
  | "low_concern"
  | "inspect_first"
  | "slow_down"
  | "renegotiate_or_verify"
  | "walk_away"
  | "needs_documents";

export type RiskLevel = "low" | "moderate" | "high" | "severe";
export type Confidence = "low" | "medium" | "high";
export type Severity = "low" | "medium" | "high";

export interface RiskFlag {
  title: string;
  severity: Severity;
  explanation: string;
  buyerQuestion: string;
}

export interface UsedCarRiskResult {
  overallLabel: OverallLabel;
  overallDisplay: string;
  confidence: Confidence;
  overallSummary: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFlags: RiskFlag[];
  inspectionPriorities: string[];
  sellerQuestions: string[];
  documentChecklist: string[];
  nextSteps: string[];
  suggestedScript: string;
}

export const OVERALL_DISPLAY: Record<OverallLabel, string> = {
  low_concern: "Low concern",
  inspect_first: "Inspect first",
  slow_down: "Slow down",
  renegotiate_or_verify: "Renegotiate or verify",
  walk_away: "Walk away",
  needs_documents: "Needs documents",
};

export const RISK_LEVEL_DISPLAY: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  severe: "Severe",
};

// ---------------------------------------------------------------------------
//  HEURISTIC CONSTANTS (transparent, not value claims)
// ---------------------------------------------------------------------------

const HIGH_MILEAGE = 120_000;
const VERY_HIGH_MILEAGE = 150_000;

const USE_RISK: UseHistory[] = ["rental", "fleet", "commercial", "rideshare"];

// ---------------------------------------------------------------------------
//  ENGINE
// ---------------------------------------------------------------------------

export function reviewUsedCar(input: UsedCarRiskInput): UsedCarRiskResult {
  const { vehicle: v, status: st } = input;
  const has = (x: Concern) => input.concerns.includes(x);
  const signed = input.signed === "already_signed";

  const flags: RiskFlag[] = [];
  let score = 0;
  const add = (f: RiskFlag, points: number) => {
    flags.push(f);
    score += points;
  };

  const mileageHigh = v.mileage != null && v.mileage >= HIGH_MILEAGE;
  const mileageVeryHigh = v.mileage != null && v.mileage >= VERY_HIGH_MILEAGE;
  const titleUnclear = st.titleStatus === "not_sure" || st.titleStatus === "unknown";
  const accidentUnclear =
    st.accidentHistory === "not_sure" || st.accidentHistory === "unknown";
  const priceMissing = v.askingPrice == null && v.outTheDoorPrice == null;
  const otdMissing = v.outTheDoorPrice == null || has("no_full_otd");

  /* ----- Title ----- */
  if (st.titleStatus === "salvage") {
    add(
      {
        title: "Salvage title",
        severity: "high",
        explanation:
          "A salvage title generally means an insurer once considered the vehicle a total loss. Based on the information entered, this is a strong walk-away signal and needs independent verification.",
        buyerQuestion:
          "Can you provide the salvage paperwork and any inspection that cleared the vehicle for the road?",
      },
      60,
    );
  } else if (st.titleStatus === "lemon_buyback") {
    add(
      {
        title: "Lemon-law buyback title",
        severity: "high",
        explanation:
          "A lemon-law buyback generally means the vehicle was repurchased over unresolved defects. Based on the information entered, this is a strong walk-away signal that needs independent verification.",
        buyerQuestion:
          "Can you provide the buyback documentation and records of the repairs that were attempted?",
      },
      50,
    );
  } else if (st.titleStatus === "rebuilt") {
    add(
      {
        title: "Rebuilt title",
        severity: "high",
        explanation:
          "A rebuilt title generally means the vehicle was previously a total loss and repaired. Based on the information entered, this needs documentation and an independent inspection before moving forward.",
        buyerQuestion:
          "Can you provide the repair documentation and the inspection that re-titled the vehicle?",
      },
      40,
    );
  } else if (st.titleStatus === "branded") {
    add(
      {
        title: "Branded title",
        severity: "medium",
        explanation:
          "A branded title generally signals a notable event in the vehicle's past. Based on the information entered, the brand and any repairs need independent verification.",
        buyerQuestion:
          "What is the exact title brand, and can you provide documentation of what caused it?",
      },
      30,
    );
  } else if (titleUnclear) {
    add(
      {
        title: "Title status unclear",
        severity: "medium",
        explanation:
          "The title status isn't confirmed yet. Based on the information entered, confirm it with the actual title document before relying on it.",
        buyerQuestion: "Can you show me the title document so I can confirm the current status?",
      },
      15,
    );
  }

  /* ----- Accident / damage ----- */
  if (st.accidentHistory === "structural_damage") {
    add(
      {
        title: "Reported structural damage",
        severity: "high",
        explanation:
          "Reported structural or frame damage is a strong walk-away signal. Based on the information entered, this needs independent verification by a mechanic you choose — don't rely only on the seller's explanation.",
        buyerQuestion:
          "Can you provide the repair records and let my own mechanic inspect the structure?",
      },
      55,
    );
  } else if (st.accidentHistory === "airbag_deployed") {
    add(
      {
        title: "Reported airbag deployment",
        severity: "high",
        explanation:
          "A reported airbag deployment points to a significant prior impact. Based on the information entered, this is a strong walk-away signal that needs independent verification of the repairs.",
        buyerQuestion:
          "Can you provide records of the airbag and related repairs, and confirmation the systems were properly restored?",
      },
      55,
    );
  } else if (st.accidentHistory === "severe") {
    add(
      {
        title: "Severe accident reported",
        severity: "high",
        explanation:
          "A severe accident in the history needs independent verification of the repairs before moving forward.",
        buyerQuestion: "Can I see the full damage and repair records from the accident?",
      },
      35,
    );
  } else if (st.accidentHistory === "moderate") {
    add(
      {
        title: "Moderate accident reported",
        severity: "medium",
        explanation:
          "A moderate accident appears in the history. Based on the information entered, an independent inspection can confirm the quality of the repairs.",
        buyerQuestion: "What was damaged, and can I see the repair records?",
      },
      20,
    );
  } else if (st.accidentHistory === "minor") {
    add(
      {
        title: "Minor accident reported",
        severity: "low",
        explanation:
          "A minor accident appears in the history. It may be nothing, but it's worth confirming with the records.",
        buyerQuestion: "Can I see what the history report lists for this incident?",
      },
      8,
    );
  } else if (accidentUnclear) {
    add(
      {
        title: "Accident history unclear",
        severity: "medium",
        explanation:
          "The accident history isn't confirmed. Based on the information entered, a history report and an inspection can fill the gap.",
        buyerQuestion: "Can you provide a full vehicle history report so I can review the accident record?",
      },
      12,
    );
  }

  /* ----- Use history ----- */
  if (USE_RISK.includes(st.useHistory) || has("prev_rental_fleet")) {
    const label =
      st.useHistory === "rideshare"
        ? "Possible rideshare use"
        : st.useHistory === "commercial"
          ? "Possible commercial use"
          : st.useHistory === "fleet"
            ? "Possible fleet use"
            : "Possible rental/fleet use";
    add(
      {
        title: label,
        severity: "medium",
        explanation:
          "Rental, fleet, commercial, or rideshare vehicles often see harder use. Based on the information entered, this is worth verifying and inspecting — it isn't automatically a deal-breaker.",
        buyerQuestion: "Can you confirm how the vehicle was used and provide records of its service history?",
      },
      st.useHistory === "rideshare" ? 18 : st.useHistory === "commercial" ? 15 : 12,
    );
  } else if (st.useHistory === "not_sure" || st.useHistory === "unknown") {
    score += 6;
  }

  /* ----- Owners ----- */
  if (st.numberOfOwners === "three_plus") {
    add(
      {
        title: "Several prior owners",
        severity: "low",
        explanation:
          "Multiple prior owners isn't a problem by itself, but it's worth confirming consistent maintenance across them.",
        buyerQuestion: "Is there service history across the prior owners I can review?",
      },
      10,
    );
  } else if (st.numberOfOwners === "unknown") {
    score += 5;
  }

  /* ----- Recalls ----- */
  if (st.openRecalls === "yes") {
    add(
      {
        title: "Open recall reported",
        severity: "medium",
        explanation:
          "An open recall should be confirmed by VIN and addressed. Based on the information entered, verify the recall status and whether the repair is complete.",
        buyerQuestion: "Can you confirm the open recall by VIN and whether the repair has been completed?",
      },
      12,
    );
  } else if (st.openRecalls === "not_checked" || st.openRecalls === "unknown") {
    add(
      {
        title: "Recalls not checked",
        severity: "low",
        explanation:
          "Open recalls haven't been checked. Based on the information entered, confirm them by VIN at the manufacturer or NHTSA.",
        buyerQuestion: "Has anyone checked this VIN for open recalls? Can we confirm it together?",
      },
      8,
    );
  }

  /* ----- CPO claim ----- */
  if (st.cpoClaimed === "yes") {
    add(
      {
        title: "CPO claim needs verification",
        severity: "low",
        explanation:
          "A certified pre-owned claim is only as good as its inspection and coverage. Based on the information entered, confirm the certification checklist and what it actually covers.",
        buyerQuestion: "Can you show me the CPO inspection report and the certification's coverage in writing?",
      },
      5,
    );
  }

  /* ----- Mileage ----- */
  if (mileageVeryHigh) {
    add(
      {
        title: "Very high mileage",
        severity: "medium",
        explanation:
          "The mileage entered is well above average. Based on the information entered, focus an inspection on wear items and confirm the price reflects the mileage.",
        buyerQuestion: "Given the mileage, what major service has been done recently, and can I see records?",
      },
      18,
    );
  } else if (mileageHigh) {
    add(
      {
        title: "High mileage",
        severity: "low",
        explanation:
          "The mileage entered is on the higher side. An inspection focused on wear items can confirm condition.",
        buyerQuestion: "What's the recent service history for the mileage on this vehicle?",
      },
      12,
    );
  } else if (v.mileage == null) {
    score += 8;
  }

  /* ----- Concern-driven signals ----- */
  if (has("price_too_good")) {
    add(
      {
        title: "Price seems too good to be true",
        severity: "medium",
        explanation:
          "A price well below the market can reflect a hidden issue. Based on the information entered, verify the title, history, and condition before assuming it's a bargain.",
        buyerQuestion: "Is there a reason this is priced below similar vehicles I should know about?",
      },
      15,
    );
  }
  if (has("dealer_rushing")) {
    add(
      {
        title: "Pressure to move quickly",
        severity: "medium",
        explanation:
          "Pressure to decide fast is a reason to slow down, not speed up. Based on the information entered, take the time to verify before signing.",
        buyerQuestion: "I need time to inspect and verify — can the price and terms hold while I do that?",
      },
      10,
    );
  }
  if (has("history_missing")) {
    add(
      {
        title: "History report missing",
        severity: "medium",
        explanation:
          "Without a history report, the title and accident picture is incomplete. Based on the information entered, ask for a full report in writing.",
        buyerQuestion: "Can you provide a full vehicle history report for this VIN in writing?",
      },
      18,
    );
  }
  if (has("title_unclear") && !titleUnclear) {
    add(
      {
        title: "Buyer unsure about title",
        severity: "medium",
        explanation:
          "Confirm the title status against the actual title document before relying on it.",
        buyerQuestion: "Can I see the physical title document to confirm the status?",
      },
      12,
    );
  }
  if (otdMissing && !priceMissing) {
    add(
      {
        title: "Full out-the-door price missing",
        severity: "medium",
        explanation:
          "Without the full out-the-door price in writing, fees can hide. Based on the information entered, ask for an itemized OTD figure before deciding.",
        buyerQuestion: "Can you put the full out-the-door price in writing, with every fee itemized?",
      },
      10,
    );
  }
  if (has("inspection_not_needed")) {
    add(
      {
        title: "Seller discourages inspection",
        severity: "high",
        explanation:
          "A seller discouraging an independent inspection is a strong reason to insist on one. Based on the information entered, don't rely only on the seller's explanation.",
        buyerQuestion: "I'd like my own mechanic to inspect the car before going further — can we arrange that?",
      },
      20,
    );
  }
  if (has("mileage_inconsistent")) {
    add(
      {
        title: "Mileage looks inconsistent",
        severity: "high",
        explanation:
          "A mileage reading that doesn't match the records needs independent verification before moving forward.",
        buyerQuestion: "Can you provide records that confirm the mileage history for this vehicle?",
      },
      15,
    );
  }
  if (has("accident_worry") && st.accidentHistory === "none_reported") {
    score += 6;
  }

  // ----- Roll-up -----
  const highCount = flags.filter((f) => f.severity === "high").length;
  const hardWalk =
    st.titleStatus === "salvage" ||
    st.titleStatus === "lemon_buyback" ||
    st.accidentHistory === "structural_damage" ||
    st.accidentHistory === "airbag_deployed" ||
    (st.titleStatus === "rebuilt" &&
      (has("history_missing") || accidentUnclear || st.openRecalls === "unknown"));
  const walkAway = hardWalk || highCount >= 2;

  const missing = [
    titleUnclear,
    accidentUnclear,
    v.mileage == null,
    priceMissing,
    has("history_missing"),
  ].filter(Boolean).length;
  const needsDocs = !walkAway && missing >= 3;

  const riskLevel: RiskLevel =
    walkAway || score >= 70
      ? "severe"
      : score >= 40
        ? "high"
        : score >= 15
          ? "moderate"
          : "low";

  const slowDown =
    has("dealer_rushing") ||
    otdMissing ||
    has("mileage_inconsistent") ||
    USE_RISK.includes(st.useHistory) ||
    has("prev_rental_fleet") ||
    titleUnclear ||
    (has("title_unclear") && !titleUnclear);

  const inspectFirst =
    st.accidentHistory === "moderate" ||
    accidentUnclear ||
    mileageHigh ||
    mileageVeryHigh ||
    has("history_missing") ||
    st.openRecalls === "not_checked" ||
    st.openRecalls === "unknown" ||
    st.openRecalls === "yes" ||
    st.cpoClaimed === "yes" ||
    has("inspection_not_needed") ||
    has("price_too_good");

  let overallLabel: OverallLabel;
  if (walkAway) overallLabel = "walk_away";
  else if (needsDocs) overallLabel = "needs_documents";
  else if (riskLevel === "high" || riskLevel === "severe")
    overallLabel = "renegotiate_or_verify";
  else if (slowDown) overallLabel = "slow_down";
  else if (inspectFirst) overallLabel = "inspect_first";
  else if (riskLevel === "moderate") overallLabel = "renegotiate_or_verify";
  else overallLabel = "low_concern";

  return {
    overallLabel,
    overallDisplay: OVERALL_DISPLAY[overallLabel],
    confidence: confidenceFor(input),
    overallSummary: summaryFor(overallLabel),
    riskScore: score,
    riskLevel,
    riskFlags: flags,
    inspectionPriorities: inspectionPriorities(input, { mileageHigh, mileageVeryHigh }),
    sellerQuestions: sellerQuestions(input),
    documentChecklist: documentChecklist(input),
    nextSteps: nextSteps(input, { walkAway, signed }),
    suggestedScript: SCRIPTS[overallLabel],
  };
}

// ---------------------------------------------------------------------------
//  SUPPORTING BUILDERS
// ---------------------------------------------------------------------------

const SUMMARY: Record<OverallLabel, string> = {
  low_concern:
    "Based on the information entered, nothing stands out as a major red flag — but this is only a preview. Still get an independent inspection and the history report in writing before you commit.",
  inspect_first:
    "Based on the information entered, this car appears worth an independent inspection and a closer look at its history before you go further.",
  slow_down:
    "Based on the information entered, there's reason to slow down. Get the missing details and documents in writing, and don't decide under pressure.",
  renegotiate_or_verify:
    "Based on the information entered, the risk here is meaningful. Verify the title, history, and condition independently — the results may change the price or the decision.",
  walk_away:
    "Based on the information entered, this is a strong walk-away signal. It deserves independent verification before moving forward, and you shouldn't rely only on the seller's explanation.",
  needs_documents:
    "Too much is missing to give a confident read. Gather the history report, title document, mileage, and price, then run this preview again.",
};
function summaryFor(label: OverallLabel): string {
  return SUMMARY[label];
}

const SCRIPTS: Record<OverallLabel, string> = {
  low_concern:
    "Things look reasonable so far. Before I finalize, I'd still like a quick independent inspection and the vehicle history report in writing.",
  inspect_first:
    "I'd like to take the car to my own mechanic for a pre-purchase inspection, and to see the full vehicle history report, before we go any further.",
  slow_down:
    "I'm not ready to sign today. Please send me the full out-the-door price in writing and the vehicle history report so I can review everything without pressure.",
  renegotiate_or_verify:
    "Before I go further, I need the history report, the title document, and an independent inspection in writing. Depending on what they show, the price may need to change.",
  walk_away:
    "Based on what I've found, I'm not comfortable moving forward at this price without independent verification. I'd need the title documentation, the full history report, and my own mechanic's inspection before I'd reconsider.",
  needs_documents:
    "I can't make a decision yet. Please send me the vehicle history report, the title document, and the full out-the-door price in writing so I can review.",
};

function confidenceFor(input: UsedCarRiskInput): Confidence {
  const { vehicle: v, status: st } = input;
  let total = 0;
  let known = 0;
  const k = (present: boolean) => {
    total += 1;
    if (present) known += 1;
  };
  k(input.signed !== "not_sure");
  k(st.titleStatus !== "unknown" && st.titleStatus !== "not_sure");
  k(st.accidentHistory !== "unknown" && st.accidentHistory !== "not_sure");
  k(st.useHistory !== "unknown" && st.useHistory !== "not_sure");
  k(st.openRecalls !== "unknown");
  k(v.mileage != null);
  k(v.askingPrice != null || v.outTheDoorPrice != null);
  k(!input.concerns.includes("history_missing"));

  const ratio = known / total;
  if (ratio >= 0.8) return "high";
  if (ratio >= 0.5) return "medium";
  return "low";
}

function inspectionPriorities(
  input: UsedCarRiskInput,
  m: { mileageHigh: boolean; mileageVeryHigh: boolean },
): string[] {
  const { status: st } = input;
  const out: string[] = [
    "An independent pre-purchase inspection by a mechanic you choose — not one arranged by the seller.",
  ];
  if (
    ["moderate", "severe", "structural_damage", "airbag_deployed", "not_sure", "unknown"].includes(
      st.accidentHistory,
    ) ||
    input.concerns.includes("accident_worry")
  ) {
    out.push(
      "A check for prior collision or structural repair — panel gaps, paint matching, and frame/unibody condition.",
    );
  }
  if (m.mileageHigh || m.mileageVeryHigh || input.vehicle.mileage == null) {
    out.push("Wear items appropriate to the mileage — brakes, tires, suspension, and fluids.");
  }
  if (st.openRecalls === "yes" || st.openRecalls === "not_checked" || st.openRecalls === "unknown") {
    out.push("Open-recall status by VIN at the manufacturer or NHTSA, and whether repairs are complete.");
  }
  if (["rebuilt", "branded", "salvage", "lemon_buyback"].includes(st.titleStatus)) {
    out.push("Confirmation, with documentation, that any prior damage was properly repaired.");
  }
  if (st.cpoClaimed === "yes") {
    out.push("The certified pre-owned inspection checklist and exactly what the certification covers.");
  }
  return out;
}

function sellerQuestions(input: UsedCarRiskInput): string[] {
  const { status: st, vehicle: v } = input;
  const out: string[] = [
    "Can I take the car to my own mechanic for a pre-purchase inspection before we go further?",
  ];
  if (input.concerns.includes("history_missing") || st.titleStatus === "not_sure" || st.titleStatus === "unknown") {
    out.push("Can you provide a full vehicle history report and the title document in writing?");
  }
  if (["rebuilt", "salvage", "branded", "lemon_buyback"].includes(st.titleStatus)) {
    out.push("Can you provide documentation of the title brand and any repairs that were performed?");
  }
  if (st.cpoClaimed === "yes") {
    out.push("Can you show me the certified pre-owned inspection report and the certification's coverage in writing?");
  }
  if (v.outTheDoorPrice == null || input.concerns.includes("no_full_otd")) {
    out.push("Can you provide the full out-the-door price in writing, with every fee itemized?");
  }
  if (
    ["moderate", "severe", "structural_damage", "airbag_deployed"].includes(st.accidentHistory) ||
    input.concerns.includes("accident_worry")
  ) {
    out.push("What does the history report show for accidents or damage, and can I see it in writing?");
  }
  if (input.concerns.includes("mileage_inconsistent")) {
    out.push("Can you explain the mileage history and provide records that confirm it?");
  }
  return out;
}

function documentChecklist(input: UsedCarRiskInput): string[] {
  const { status: st } = input;
  const docs: string[] = [
    "A full vehicle history report for the VIN",
    "The title document showing the current title status",
    "The full out-the-door price in writing, with itemized fees",
    "Service and maintenance records",
    "Open-recall status by VIN (manufacturer or NHTSA)",
    "Your own independent pre-purchase inspection results",
  ];
  if (["rebuilt", "branded", "salvage", "lemon_buyback"].includes(st.titleStatus)) {
    docs.push("Repair and re-inspection documentation for the title brand");
  }
  if (st.cpoClaimed === "yes") {
    docs.push("The certified pre-owned inspection checklist and coverage terms");
  }
  return docs;
}

function nextSteps(
  input: UsedCarRiskInput,
  ctx: { walkAway: boolean; signed: boolean },
): string[] {
  const steps: string[] = [
    "This is a buyer-side reference point based on the information entered — not a mechanical, title, safety, or legal determination.",
  ];
  if (ctx.walkAway) {
    steps.push(
      "Treat this as a strong walk-away signal: get independent verification before moving forward, and don't rely only on the seller's explanation.",
    );
  }
  if (ctx.signed) {
    steps.push(
      "If you've already signed, gather your documents and seek independent verification right away — and consider discussing your options with a qualified professional.",
    );
  }
  steps.push(
    "Get an independent pre-purchase inspection from a mechanic you choose before you commit.",
  );
  steps.push(
    "Confirm the title and history with the title document, a VIN history report, and the DMV, insurer, or manufacturer as needed.",
  );
  steps.push(
    "Put your questions to the seller and keep the answers in writing, then run this preview again.",
  );
  return steps;
}
