/**
 * Request validation schemas (Zod). One source of truth for the shapes that
 * cross the network boundary, shared by the API routes. The Deal Check wire
 * format is intentionally LOOSE — numeric fields arrive as strings from the
 * form — so these schemas validate STRUCTURE and bound sizes (to prevent abuse)
 * while `deal-mapper.ts` does the actual string→number coercion + enum guarding.
 */
import { z } from "zod";

/** A numeric field that may arrive as a string ("$24,500") or a number. */
const numLike = z.union([z.string().max(40), z.number()]).optional();
const shortStr = z.string().max(120).optional();

const feeSchema = z.object({
  label: z.string().max(120).optional(),
  amount: numLike,
});

export const dealSubmissionSchema = z.object({
  lead: z
    .object({
      name: z.string().max(200).optional(),
      email: z.string().max(320).optional(),
    })
    .optional(),
  vehicle: z
    .object({
      year: numLike,
      make: shortStr,
      model: shortStr,
      trim: shortStr,
      mileage: numLike,
      vin: z.string().max(32).optional(),
    })
    .optional(),
  deal: z
    .object({
      vehiclePrice: numLike,
      fees: z.array(feeSchema).max(40).optional(),
      downPayment: numLike,
      apr: numLike,
      termMonths: numLike,
      monthlyPayment: numLike,
      creditBand: z.string().max(40).optional(),
      outsideApproval: z.boolean().optional(),
      addOnsFinanced: z.boolean().optional(),
      addOnApr: numLike,
      addOnTermMonths: numLike,
    })
    .optional(),
  warranty: z
    .object({
      provider: shortStr,
      coverageTier: z.string().max(40).optional(),
      termMonths: numLike,
      termMiles: numLike,
      deductible: numLike,
      priceQuoted: numLike,
    })
    .optional(),
  tradeIn: z
    .object({
      offer: numLike,
      estimatedValue: numLike,
      loanPayoff: numLike,
    })
    .optional(),
  buyerState: z.string().max(8).optional(),
  alreadySigned: z.boolean().optional(),
  // Internal location signal (not a scoring input). ZIP-derived; never shown to
  // the buyer. Optional so it never blocks a submission.
  location: z
    .object({
      zip: z.string().max(10).optional(),
      state: z.string().max(2).optional(),
    })
    .optional(),
  inputPath: z.enum(["manual", "upload"]).optional(),
  uploadedFilePath: z.string().max(400).optional(),
});

/**
 * Quote Review intake (deep, line-item entry). Loose like the Deal Check wire
 * format — numeric fields may arrive as strings; `normalizeDealInput` does the
 * coercion. Validates structure and bounds array sizes to prevent abuse.
 */
const addOnSchema = z.object({
  label: z.string().max(120).optional(),
  amount: numLike,
  financed: z.boolean().optional(),
});

export const quoteReviewSchema = z.object({
  vehicle: z
    .object({
      year: numLike,
      make: shortStr,
      model: shortStr,
      trim: shortStr,
      mileage: numLike,
      vin: z.string().max(32).optional(),
      condition: z.string().max(20).optional(),
      color: z.string().max(40).optional(),
    })
    .optional(),
  pricing: z
    .object({
      vehiclePrice: numLike,
      msrp: numLike,
      dealerDiscount: numLike,
      rebates: numLike,
      outTheDoor: numLike,
      downPayment: numLike,
      totalVehiclePrice: numLike,
      balanceDue: numLike,
    })
    .optional(),
  fees: z.array(feeSchema).max(40).optional(),
  addOns: z.array(addOnSchema).max(40).optional(),
  finance: z
    .object({
      apr: numLike,
      termMonths: numLike,
      monthlyPayment: numLike,
      amountFinanced: numLike,
      creditBand: z.string().max(40).optional(),
    })
    .optional(),
  trade: z
    .object({
      offer: numLike,
      estimatedValue: numLike,
      loanPayoff: numLike,
      year: numLike,
      make: shortStr,
      model: shortStr,
      mileage: numLike,
    })
    .optional()
    .nullable(),
  dealerName: z.string().max(200).optional(),
  dealerAddress: z.string().max(200).optional(),
  dealerPhone: z.string().max(40).optional(),
  salesperson: z.string().max(120).optional(),
  stockNumber: z.string().max(60).optional(),
  insuranceCarrier: z.string().max(80).optional(),
  buyerState: z.string().max(8).optional(),
  dealerZip: z.string().max(12).optional(),
  registrationZip: z.string().max(12).optional(),
  alreadySigned: z.boolean().optional(),
  source: z.enum(["manual", "upload", "mixed"]).optional(),
  uploadedFilePath: z.string().max(400).optional(),
  documentUploaded: z.boolean().optional(),
});

/** Build My Plan intake — forward-looking, so it's lighter than a full quote. */
export const buildPlanSchema = z.object({
  vehicle: z
    .object({
      year: numLike,
      make: shortStr,
      model: shortStr,
      trim: shortStr,
      mileage: numLike,
    })
    .optional(),
  condition: z.enum(["new", "used", "cpo"]).optional(),
  zip: z.string().max(12).optional(),
  buyerState: z.string().max(8).optional(),
  creditBand: z.enum(["excellent", "good", "fair", "poor", "unknown"]).optional(),
  termMonths: numLike,
  downPayment: numLike,
  maxMonthly: numLike,
  maxOutTheDoor: numLike,
  trade: z
    .object({
      estimatedValue: numLike,
      loanPayoff: numLike,
    })
    .optional()
    .nullable(),
});

/** Deal Rescue (post-sale) intake — already signed; what was bought + the basics. */
export const postSaleSchema = z.object({
  buyerState: z.string().max(8).optional(),
  daysSinceSigned: numLike,
  financed: z.boolean().optional(),
  lienholder: z.string().max(120).optional(),
  dealerName: z.string().max(200).optional(),
  // Private-bucket storage path returned by /api/parse (signed-paperwork upload).
  uploadedFilePath: z.string().max(500).optional(),
  addOns: z
    .array(
      z.object({
        rawLabel: z.string().max(120).optional(),
        amount: numLike,
        financed: z.boolean().optional(),
      }),
    )
    .max(40)
    .optional(),
});

export const reviewRequestSchema = z.object({
  name: z.string().max(200).optional(),
  email: z.string().max(320).optional(),
});

const verdictEnum = z.enum(["green", "amber", "red", "black"]);

export const publishSchema = z.object({
  verdict: verdictEnum,
  headline: z.string().max(2000).optional().default(""),
  flags: z
    .array(
      z.object({
        type: z.string().max(60),
        severity: z.enum(["info", "low", "medium", "high"]),
        title: z.string().max(300),
        explanation: z.string().max(4000),
        estimatedImpact: z.unknown().optional(),
      }),
    )
    .max(50)
    .default([]),
});

/** Console operator sign-in with email + password (Supabase Auth). */
export const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(400),
});

/** Buyer sign-in (email + password). */
export const accountLoginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(400),
});

/** Buyer sign-up (email + password, with a minimum length). */
export const accountSignupSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(400),
});

/** Start an OAuth/social sign-in for the console. */
export const oauthStartSchema = z.object({
  provider: z.enum(["google", "apple"]),
});

/** Admin: invite/allowlist an operator by email. */
export const addOperatorSchema = z.object({
  email: z.string().email().max(320),
  role: z.enum(["reviewer", "admin"]).default("reviewer"),
});

/** Admin: update an operator's status/role. At least one field required. */
export const updateOperatorSchema = z
  .object({
    active: z.boolean().optional(),
    role: z.enum(["reviewer", "admin"]).optional(),
  })
  .refine((v) => v.active !== undefined || v.role !== undefined, {
    message: "Provide active and/or role.",
  });
