import { Suspense } from "react";
import { TripPlanner } from "@/components/unthinked/trip-planner";

// Month chips depend on today's date, so render per request.
export default function PlanPage() {
  return (
    <Suspense>
      <TripPlanner />
    </Suspense>
  );
}
