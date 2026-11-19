import { Suspense } from "react";
import { TogetherProfile } from "@/components/unthinked/together-profile";

export default function Page() {
  return (
    <Suspense>
      <TogetherProfile />
    </Suspense>
  );
}
