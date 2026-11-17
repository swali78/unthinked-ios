import { ImageResponse } from "next/og";
import { OrbIcon } from "@/lib/orb-icon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<OrbIcon size={512} />, size);
}
