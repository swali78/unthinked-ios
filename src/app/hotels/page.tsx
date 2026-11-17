import { Suspense } from "react";
import { HotelSearch } from "@/components/unthinked/hotel-search";

export default function Page() {
  return (
    <Suspense>
      <HotelSearch />
    </Suspense>
  );
}
