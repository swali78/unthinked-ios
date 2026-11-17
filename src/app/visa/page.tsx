import { Suspense } from "react";
import { VisaCheck } from "@/components/unthinked/visa-check";

export default function Page() {
  return (
    <Suspense>
      <VisaCheck />
    </Suspense>
  );
}
