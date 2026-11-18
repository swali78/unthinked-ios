import { Suspense } from "react";
import { TogetherChats } from "@/components/unthinked/together-chat";

export default function Page() {
  return (
    <Suspense>
      <TogetherChats />
    </Suspense>
  );
}
