/**
 * Map raw MarketCheck JSON into the normalized internal model, scoring each
 * listing as a comparable. Defensive — raw fields are all treated as optional.
 */
import type { RawActiveResponse, RawListing, RawSpecs } from "./connector";
import type { ComparableListing, VehicleIdentity, MarketCheckRequest } from "./types";
import type { VehicleEquipment } from "@/lib/vin";
import { scoreComparableListing } from "./filters";

/** Overlay free vPIC equipment onto an identity. Each field the decode resolved
 *  wins over what's already there (it overrides mock placeholders); fields vPIC
 *  couldn't resolve leave the existing value untouched. Used as a baseline in
 *  the live path (the MarketCheck specs decode still overrides via mergeSpecs)
 *  and over the mock fallback's hardcoded specs. */
export function applyEquipment(
  identity: VehicleIdentity,
  equip: VehicleEquipment | null,
): VehicleIdentity {
  if (!equip) return identity;
  return {
    ...identity,
    bodyStyle: equip.bodyStyle ?? identity.bodyStyle,
    drivetrain: equip.drivetrain ?? identity.drivetrain,
    engine: equip.engine ?? identity.engine,
    transmission: equip.transmission ?? identity.transmission,
    fuelType: equip.fuelType ?? identity.fuelType,
  };
}

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

/** Best-effort merge of MarketCheck VIN-decode specs onto the identity. Pulls
 *  year/make/model too (a VIN-only request has none), so comps can be scored
 *  against a real target instead of an empty one. */
export function mergeSpecs(identity: VehicleIdentity, specs: RawSpecs | null): VehicleIdentity {
  if (!specs) return identity;
  const s = specs as Record<string, unknown>;
  return {
    ...identity,
    year: n(s.year) || identity.year,
    make: str(s.make) ?? (identity.make || ""),
    model: str(s.model) ?? (identity.model || ""),
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

/** Backfill the target's year/make/model/trim from the returned listings when
 *  the request + decode left them blank. A VIN search returns that exact
 *  vehicle, so the listings' own build is the most reliable identity — without
 *  this, comps would be scored against an empty target and all read "poor". */
export function backfillIdentityFromListings(
  identity: VehicleIdentity,
  listings: RawListing[],
): VehicleIdentity {
  const builds = listings.map((l) => l.build).filter(Boolean) as NonNullable<RawListing["build"]>[];
  if (builds.length === 0) return identity;

  const mode = <T,>(vals: (T | null | undefined)[]): T | null => {
    const counts = new Map<T, number>();
    for (const v of vals) {
      if (v == null || v === "") continue;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    let best: T | null = null;
    let bestN = 0;
    for (const [v, c] of counts) {
      if (c > bestN) {
        best = v;
        bestN = c;
      }
    }
    return best;
  };

  return {
    ...identity,
    year: identity.year || mode(builds.map((b) => b.year)) || identity.year,
    make: identity.make || str(mode(builds.map((b) => b.make))) || identity.make,
    model: identity.model || str(mode(builds.map((b) => b.model))) || identity.model,
    trim: identity.trim ?? str(mode(builds.map((b) => b.trim))),
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
