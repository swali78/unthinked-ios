import { Suspense } from "react";
import { HotelCheckout } from "@/components/unthinked/hotel-checkout";

export default function Page() {
  return (
    <Suspense>
      <HotelCheckout />
    </Suspense>
  );
}
