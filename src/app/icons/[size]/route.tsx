import { ImageResponse } from "next/og";
import { brandIcon } from "@/lib/brand-icon";

// Stable PNG icon endpoints for the PWA manifest: /icons/192 and /icons/512.
export const runtime = "edge";

export function GET(
  _req: Request,
  { params }: { params: { size: string } },
) {
  const n = params.size === "512" ? 512 : 192;
  return new ImageResponse(brandIcon(n), { width: n, height: n });
}
