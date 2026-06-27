/**
 * Maps the buyer-submitted form payload into the fairness-engine input shape
 * and into a database row. Keeping this in one place means the engine and the
 * DB schema stay decoupled from the form's wire format.
 */
import type {
  FairnessInput,
  WarrantyCoverageTier,
  CreditBand,
} from "./fairness-engine";

/** Wire format sent by the Deal Check form (all optional/nullable strings). */
export interface DealSubmission {
  lead?: { name?: string; email?: string };
  vehicle?: {
    year?: number | string;
    make?: string;
    model?: string;
    trim?: string;
    mileage?: number | string;
    vin?: string;
  };
  deal?: {
    vehiclePrice?: number | string;
    fees?: { label?: string; amount?: number | string }[];
    downPayment?: number | string;
    apr?: number | string;
    termMonths?: number | string;
    monthlyPayment?: number | string;
    creditBand?: string;
  };
  warranty?: {
    provider?: string;
    coverageTier?: string;
    termMonths?: number | string;
    termMiles?: number | string;
    priceQuoted?: number | string;
  };
  tradeIn?: {
    offer?: number | string;
    estimatedValue?: number | string;
    loanPayoff?: number | string;
  };
  /** Two-letter US state code where the buyer is purchasing (state-aware copy
   * now, fee caps later). Optional. */
  buyerState?: string;
  inputPath?: "manual" | "upload";
  uploadedFilePath?: string;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

const COVERAGE_TIERS: WarrantyCoverageTier[] = [
  "powertrain",
  "named_component",
  "stated_component",
  "exclusionary",
  "unknown",
];

const CREDIT_BANDS: CreditBand[] = [
  "excellent",
  "good",
  "fair",
  "poor",
  "unknown",
];

export function toFairnessInput(s: DealSubmission): FairnessInput {
  const fees = (s.deal?.fees ?? [])
    .map((f) => ({ label: str(f.label) ?? "", amount: num(f.amount) ?? 0 }))
    .filter((f) => f.label || f.amount);

  const coverage = str(s.warranty?.coverageTier)?.toLowerCase();
  const band = str(s.deal?.creditBand)?.toLowerCase();

  return {
    vehicle: {
      year: num(s.vehicle?.year) ?? new Date().getFullYear(),
      make: str(s.vehicle?.make) ?? "",
      model: str(s.vehicle?.model) ?? "",
      trim: str(s.vehicle?.trim),
      mileage: num(s.vehicle?.mileage),
      vin: str(s.vehicle?.vin),
    },
    deal: {
      vehiclePrice: num(s.deal?.vehiclePrice),
      fees,
      downPayment: num(s.deal?.downPayment),
      apr: num(s.deal?.apr),
      termMonths: num(s.deal?.termMonths),
      monthlyPayment: num(s.deal?.monthlyPayment),
      creditBand: (CREDIT_BANDS.includes(band as CreditBand)
        ? (band as CreditBand)
        : "unknown") as CreditBand,
    },
    warranty: {
      provider: str(s.warranty?.provider),
      coverageTier: (COVERAGE_TIERS.includes(coverage as WarrantyCoverageTier)
        ? (coverage as WarrantyCoverageTier)
        : null) as WarrantyCoverageTier | null,
      termMonths: num(s.warranty?.termMonths),
      termMiles: num(s.warranty?.termMiles),
      priceQuoted: num(s.warranty?.priceQuoted),
    },
    tradeIn: s.tradeIn
      ? {
          offer: num(s.tradeIn.offer),
          estimatedValue: num(s.tradeIn.estimatedValue),
          loanPayoff: num(s.tradeIn.loanPayoff),
        }
      : null,
    documentUploaded: s.inputPath === "upload",
  };
}

/** Build the DB column object for `deals` from a submission + engine result. */
export function toDealRow(
  s: DealSubmission,
  input: FairnessInput,
  result: import("./fairness-engine").FairnessResult,
  leadId: string | null,
) {
  const buyerState = str(s.buyerState)?.toUpperCase().slice(0, 2) ?? null;
  return {
    lead_id: leadId,
    buyer_state: buyerState,
    vehicle_year: input.vehicle.year,
    vehicle_make: input.vehicle.make,
    vehicle_model: input.vehicle.model,
    vehicle_trim: input.vehicle.trim,
    vehicle_mileage: input.vehicle.mileage,
    vehicle_vin: input.vehicle.vin,
    vehicle_price: input.deal.vehiclePrice,
    fees: input.deal.fees ?? [],
    down_payment: input.deal.downPayment,
    apr: input.deal.apr,
    term_months: input.deal.termMonths,
    monthly_payment: input.deal.monthlyPayment,
    credit_band: input.deal.creditBand,
    warranty_provider: input.warranty?.provider ?? null,
    warranty_coverage_tier: input.warranty?.coverageTier ?? null,
    warranty_term_months: input.warranty?.termMonths ?? null,
    warranty_term_miles: input.warranty?.termMiles ?? null,
    warranty_price: input.warranty?.priceQuoted ?? null,
    uploaded_file_path: s.uploadedFilePath ?? null,
    input_path: s.inputPath ?? "manual",
    auto_verdict: result.overallVerdict,
    auto_result: result,
    status: "new" as const,
  };
}
