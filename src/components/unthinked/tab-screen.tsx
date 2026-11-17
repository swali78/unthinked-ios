import type { ReactNode } from "react";
import { TabBar } from "./tab-bar";

/** Root tab screen: iOS large title, scrolling body, glass tab bar pinned below. */
export function TabScreen({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="relative h-full">
      {/* Fades content scrolling under the status bar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[max(env(safe-area-inset-top),16px)] bg-gradient-to-b from-[#0b0b0c] to-[#0b0b0c]/0 md:h-[58px] md:from-[#0b0b0c] md:via-[#0b0b0c]/90"
      />
      <div className="h-full overflow-y-auto overscroll-contain px-4 pb-32 pt-[max(env(safe-area-inset-top),16px)] [scrollbar-width:none] md:pt-[62px]">
        <header className="flex items-end justify-between gap-3 pb-4 pt-2">
          <h1 className="text-[34px] font-medium leading-none tracking-[-0.02em] text-white">{title}</h1>
          {action}
        </header>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),10px)] md:pb-6">
        <div className="absolute inset-0 -top-10 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/85 to-transparent" />
        <div className="pointer-events-auto relative">
          <TabBar />
        </div>
      </div>
    </div>
  );
}
