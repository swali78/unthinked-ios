import { Suspense } from "react";
import { HotelResults } from "@/components/unthinked/hotel-results";

export default function Page() {
  return (
    <Suspense>
      <HotelResults />
    </Suspense>
  );
}
