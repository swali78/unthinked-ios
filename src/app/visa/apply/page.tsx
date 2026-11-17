import { Suspense } from "react";
import { VisaApply } from "@/components/unthinked/visa-apply";

export default function Page() {
  return (
    <Suspense>
      <VisaApply />
    </Suspense>
  );
}
