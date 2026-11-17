import { Suspense } from "react";
import { SeatSelection } from "@/components/unthinked/seat-selection";

export default function Page() {
  return (
    <Suspense>
      <SeatSelection />
    </Suspense>
  );
}
