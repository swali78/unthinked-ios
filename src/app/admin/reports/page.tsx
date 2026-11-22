import type { Metadata } from "next";
import { Suspense } from "react";
import { ModerationScreen } from "@/components/unthinked/moderation-screen";

export const metadata: Metadata = { title: "Reports · Unthinked", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <ModerationScreen />
    </Suspense>
  );
}
