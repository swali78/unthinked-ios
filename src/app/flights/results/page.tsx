import { Suspense } from "react";
import { FlightResults } from "@/components/unthinked/flight-results";

export default function Page() {
  return (
    <Suspense>
      <FlightResults />
    </Suspense>
  );
}
