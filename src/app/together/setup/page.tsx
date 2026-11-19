import { Suspense } from "react";
import { TogetherSetup } from "@/components/unthinked/together-setup";

export default function Page() {
  return (
    <Suspense>
      <TogetherSetup />
    </Suspense>
  );
}
