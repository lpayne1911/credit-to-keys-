/**
 * GET /api/vin/[vin] — decode a VIN into year/make/model/trim via NHTSA vPIC.
 *
 * Pure enhancement for the Deal Check form's "Decode" button. Always returns
 * 200 with `{ vehicle: DecodedVehicle | null }` so the client can prefill what
 * it gets and the buyer fills the rest — never a hard dependency.
 */
import { NextResponse } from "next/server";
import { decodeVin } from "@/lib/vin";

export async function GET(
  _req: Request,
  { params }: { params: { vin: string } },
) {
  const vehicle = await decodeVin(params.vin ?? "");
  return NextResponse.json({ vehicle });
}
