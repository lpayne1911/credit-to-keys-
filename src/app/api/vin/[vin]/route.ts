/**
 * GET /api/vin/[vin] — decode a VIN into year/make/model/trim via NHTSA vPIC.
 *
 * Pure enhancement for the Deal Check form's "Decode" button. Always returns
 * 200 with `{ vehicle: DecodedVehicle | null }` so the client can prefill what
 * it gets and the buyer fills the rest — never a hard dependency.
 */
import { NextResponse } from "next/server";
import { decodeVin } from "@/lib/vin";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: { vin: string } },
) {
  // Proxies an outbound decode per call — throttle per IP. NHTSA is free, so the
  // limit is generous; it just stops the endpoint being used as a flood relay.
  const limit = rateLimit(req, { key: "vin-decode", limit: 60, windowMs: 5 * 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { vehicle: null },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const vehicle = await decodeVin(params.vin ?? "");
  return NextResponse.json({ vehicle });
}
