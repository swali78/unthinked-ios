import { Suspense } from "react";
import { FlightDetails } from "@/components/unthinked/flight-details";

export default function Page() {
  return (
    <Suspense>
      <FlightDetails />
    </Suspense>
  );
}
