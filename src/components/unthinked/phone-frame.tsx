import type { ReactNode } from "react";

/**
 * On phones the app fills the viewport. From 768px up it sits inside an
 * iPhone-sized frame with a dynamic island and status bar, so the desktop
 * preview reads the same as the device.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#050506] md:py-10">
      {/* Ambient light behind the device on desktop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 hidden md:block"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 30%, rgb(255 255 255 / 0.06), transparent 70%)",
        }}
      />
      <div className="relative h-dvh w-full md:h-[852px] md:w-[393px] md:rounded-[60px] md:bg-[#1a1a1c] md:p-[11px] md:shadow-[0_0_0_1px_rgb(255_255_255/0.08),0_0_0_2px_#000,0_50px_120px_-20px_rgb(0_0_0/0.9),inset_0_0_2px_rgb(255_255_255/0.25)]">
        <div
          id="screen"
          className="stage relative isolate h-full w-full overflow-hidden md:rounded-[49px]"
        >
          <StatusBar />
          {children}
          {/* Home indicator */}
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-1/2 z-50 hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/80 md:block"
          />
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-50 hidden h-[54px] items-center justify-between px-8 pt-1 text-[15px] font-semibold text-white md:flex"
    >
      <span className="w-14 text-center tabular-nums">9:41</span>
      <span className="absolute left-1/2 top-[11px] h-[34px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="1" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
          <rect x="10" y="3" width="3" height="9" rx="1" />
          <rect x="15" y="0" width="3" height="12" rx="1" />
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 2.6c2.2 0 4.2.9 5.7 2.3l1.1-1.1A9.6 9.6 0 0 0 8 1 9.6 9.6 0 0 0 1.2 3.8l1.1 1.1A8 8 0 0 1 8 2.6Zm0 3.2c1.3 0 2.5.5 3.4 1.3l1.1-1.1A6.4 6.4 0 0 0 8 4.2c-1.7 0-3.3.7-4.5 1.8l1.1 1.1c.9-.8 2.1-1.3 3.4-1.3Zm0 3.2c-.5 0-1 .2-1.3.5L8 10.8l1.3-1.3A1.9 1.9 0 0 0 8 9Z" />
        </svg>
        <span className="relative flex h-[13px] w-[27px] items-center rounded-[4px] border border-white/40 p-[1.5px]">
          <span className="h-full w-[70%] rounded-[2px] bg-white" />
          <span className="absolute -right-[3px] top-1/2 h-1 w-[1.5px] -translate-y-1/2 rounded-r bg-white/40" />
        </span>
      </span>
    </div>
  );
}
