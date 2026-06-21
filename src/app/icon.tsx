import { ImageResponse } from "next/og";
import { brandIcon } from "@/lib/brand-icon";

// App favicon / browser icon, generated from the brand shield.
export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(brandIcon(256), { ...size });
}
