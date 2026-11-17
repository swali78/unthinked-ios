import { Suspense } from "react";
import { FlightSearch } from "@/components/unthinked/flight-search";

export default function Page() {
  return (
    <Suspense>
      <FlightSearch />
    </Suspense>
  );
}
