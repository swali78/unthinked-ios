import { ImageResponse } from "next/og";
import { OrbIcon } from "@/lib/orb-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<OrbIcon size={180} />, size);
}
