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

export const loginSchema = z.object({
  password: z.string().min(1).max(400),
});
