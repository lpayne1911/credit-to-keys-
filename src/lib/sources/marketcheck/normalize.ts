/**
 * Map raw MarketCheck JSON into the normalized internal model, scoring each
 * listing as a comparable. Defensive — raw fields are all treated as optional.
 */
import type { RawActiveResponse, RawListing, RawSpecs } from "./connector";
import type { ComparableListing, VehicleIdentity, MarketCheckRequest } from "./types";
import { scoreComparableListing } from "./filters";

export function vehicleIdentityFromRequest(req: MarketCheckRequest): VehicleIdentity {
  return {
    year: req.year ?? 0,
    make: req.make ?? "",
    model: req.model ?? "",
    trim: req.trim ?? null,
    vin: req.vin ?? null,
    mileage: req.mileage ?? null,
    identityConfidence: req.vin ? "high" : req.trim ? "medium" : "low",
  };
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
function n(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Best-effort merge of MarketCheck VIN-decode specs onto the identity. */
export function mergeSpecs(identity: VehicleIdentity, specs: RawSpecs | null): VehicleIdentity {
  if (!specs) return identity;
  const s = specs as Record<string, unknown>;
  return {
    ...identity,
    trim: str(s.trim) ?? identity.trim,
    bodyStyle: str(s.body_type) ?? str(s.body_subtype) ?? identity.bodyStyle,
    drivetrain: str(s.drivetrain) ?? identity.drivetrain,
    engine: str(s.engine) ?? identity.engine,
    transmission: str(s.transmission) ?? identity.transmission,
    fuelType: str(s.fuel_type) ?? identity.fuelType,
    msrp: n(s.msrp) ?? identity.msrp,
    identityConfidence: "high",
  };
}

export function normalizeListings(
  raw: RawActiveResponse | null,
  target: VehicleIdentity,
): ComparableListing[] {
  const rows = raw?.listings ?? [];
  return rows
    .map((l: RawListing, i): ComparableListing | null => {
      const price = n(l.price);
      const year = l.build?.year ?? target.year;
      const make = str(l.build?.make) ?? target.make;
      const model = str(l.build?.model) ?? target.model;
      if (!price || price <= 0) return null;
      const sc = scoreComparableListing(target, {
        year,
        make,
        model,
        trim: l.build?.trim ?? null,
        mileage: n(l.miles),
        distanceMiles: n(l.dist),
      });
      return {
        sourceListingId: str(l.id) ?? str(l.vin) ?? `mc-${i}`,
        vin: str(l.vin),
        year,
        make,
        model,
        trim: str(l.build?.trim),
        mileage: n(l.miles),
        listPrice: price,
        dealerName: str(l.dealer?.name),
        dealerZip: str(l.dealer?.zip),
        distanceMiles: n(l.dist),
        daysOnMarket: n(l.dom),
        url: null,
        matchQuality: sc.quality,
        matchScore: sc.score,
        reasons: sc.reasons,
      };
    })
    .filter((c): c is ComparableListing => c !== null);
}
