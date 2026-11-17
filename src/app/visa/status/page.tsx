import { Suspense } from "react";
import { VisaStatus } from "@/components/unthinked/visa-status";

export default function Page() {
  return (
    <Suspense>
      <VisaStatus />
    </Suspense>
  );
}
