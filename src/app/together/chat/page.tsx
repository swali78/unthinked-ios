import { Suspense } from "react";
import { TogetherChat } from "@/components/unthinked/together-chat";

export default function Page() {
  return (
    <Suspense>
      <TogetherChat />
    </Suspense>
  );
}
