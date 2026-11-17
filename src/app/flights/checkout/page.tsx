import { Suspense } from "react";
import { FlightCheckout } from "@/components/unthinked/flight-checkout";

export default function Page() {
  return (
    <Suspense>
      <FlightCheckout />
    </Suspense>
  );
}
