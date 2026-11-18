import { Suspense } from "react";
import { TogetherTrip } from "@/components/unthinked/together-trip";

export default function Page() {
  return (
    <Suspense>
      <TogetherTrip />
    </Suspense>
  );
}
