import { Suspense } from "react";
import { PassengerDetails } from "@/components/unthinked/passenger-details";

export default function Page() {
  return (
    <Suspense>
      <PassengerDetails />
    </Suspense>
  );
}
