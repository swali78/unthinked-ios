import { Suspense } from "react";
import { TripsScreen } from "@/components/unthinked/trips-screen";

export default function Page() {
  return (
    <Suspense>
      <TripsScreen />
    </Suspense>
  );
}
