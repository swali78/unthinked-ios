"use client";

import { useRouter } from "next/navigation";
import { Composer } from "./composer";
import { TabBar } from "./tab-bar";

/** Composer + tab bar pinned to the bottom of Home, over a fade. */
export function HomeDock() {
  const router = useRouter();
  const go = (q: string) => router.push(`/chat?q=${encodeURIComponent(q)}`);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),10px)] frame:pb-6">
      <div className="absolute inset-0 -top-16 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/90 to-transparent" />
      <div className="pointer-events-auto relative space-y-3">
        <Composer
          className="px-4"
          onSubmit={go}
          onMic={() => router.push("/chat?voice=1")}
        />
        <TabBar />
      </div>
    </div>
  );
}
