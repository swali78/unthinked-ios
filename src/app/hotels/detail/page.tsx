import { Suspense } from "react";
import { HotelDetail } from "@/components/unthinked/hotel-detail";

export default function Page() {
  return (
    <Suspense>
      <HotelDetail />
    </Suspense>
  );
}
