/** "Powered by Flyinco" with the official Flyinco logo (light version for the dark UI). */
export function PoweredBy({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <span className="text-[11px] tracking-[0.02em] text-white/40">powered by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/flyinco-logo-light.png" alt="Flyinco Travel Management Company" width={136} height={58} className="h-auto w-[136px] opacity-90" />
    </div>
  );
}
