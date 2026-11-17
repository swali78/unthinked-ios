"use client";

import { ChevronLeft, Minus, Plus } from "lucide-react";
import { animate, AnimatePresence, motion, type PanInfo, useMotionValue } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentProps, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ---------------- Screen shell ---------------- */

/**
 * Standard pushed screen: back button, centred title, scrolling body and an
 * optional pinned footer. Everything is absolutely scoped to the phone screen.
 */
export function Screen({
  title,
  back = "back",
  right,
  footer,
  children,
  overlay,
  bodyClassName,
}: {
  title: ReactNode;
  /** "back" uses history; a string is a fallback href. */
  back?: "back" | string;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** Sheets and dialogs, rendered above the body. */
  overlay?: ReactNode;
  bodyClassName?: string;
}) {
  const router = useRouter();
  const goBack = () => {
    if (back !== "back") router.push(back);
    else if (window.history.length > 1) router.back();
    else router.push("/");
  };
  const swipe = useEdgeSwipe(goBack);
  return (
    <div
      {...swipe.handlers}
      style={swipe.style}
      className="relative flex h-full flex-col pt-[max(env(safe-area-inset-top),12px)] md:pt-[54px]"
    >
      <header className="relative z-10 grid grid-cols-[44px_1fr_44px] items-center gap-2 px-4 pb-2">
        {back === "back" ? (
          <button
            type="button"
            aria-label="Back"
            onClick={goBack}
            className="glass-thin flex size-11 items-center justify-center rounded-full text-white/85 transition-transform active:scale-[0.96]"
          >
            <ChevronLeft className="size-5" />
          </button>
        ) : (
          <Link
            href={back}
            aria-label="Back"
            className="glass-thin flex size-11 items-center justify-center rounded-full text-white/85 transition-transform active:scale-[0.96]"
          >
            <ChevronLeft className="size-5" />
          </Link>
        )}
        <h1 className="truncate text-center text-[17px] text-white">{title}</h1>
        <div className="flex justify-end">{right}</div>
      </header>
      <main className={cn("relative flex-1 overflow-y-auto overscroll-contain px-4 pb-8 [scrollbar-width:none]", bodyClassName)}>
        {children}
      </main>
      {footer && (
        <div className="relative z-10 border-t border-white/[0.06] bg-[#0b0b0c]/85 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl md:pb-7">
          {footer}
        </div>
      )}
      {overlay}
    </div>
  );
}

/**
 * iOS-style back gesture: a touch that starts within 24px of the left edge
 * drags the screen along and goes back past 90px. Mouse input is ignored.
 */
function useEdgeSwipe(onBack: () => void) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  // Last two samples, for release velocity (px/ms).
  const sample = useRef({ x: 0, t: 0, v: 0 });
  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      const t = e.touches[0];
      const left = (e.currentTarget as HTMLElement).getBoundingClientRect().left;
      start.current = t.clientX - left < 24 ? { x: t.clientX, y: t.clientY } : null;
      sample.current = { x: t.clientX, t: e.timeStamp, v: 0 };
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!start.current) return;
      const t = e.touches[0];
      const x = t.clientX - start.current.x;
      // Vertical scrolls cancel the gesture.
      if (Math.abs(t.clientY - start.current.y) > 40 && x < 30) {
        start.current = null;
        setDx(0);
        return;
      }
      const dt = Math.max(1, e.timeStamp - sample.current.t);
      sample.current = { x: t.clientX, t: e.timeStamp, v: (t.clientX - sample.current.x) / dt };
      setDx(Math.max(0, x));
    },
    onTouchEnd: () => {
      // Far enough, or a quick flick: a flick shouldn't need to travel 90px.
      if (start.current && (dx > 90 || (dx > 24 && sample.current.v > 0.5))) onBack();
      start.current = null;
      setDx(0);
    },
  };
  const style = dx
    ? { transform: `translateX(${dx}px)`, boxShadow: "-12px 0 30px rgb(0 0 0 / 0.5)" }
    : { transition: "transform 0.25s var(--ease-drawer)" };
  return { handlers, style };
}

/* ---------------- Buttons ---------------- */

const base =
  "inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-6 text-[16px] font-medium transition-[transform,opacity] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70";

export function PrimaryButton({ className, ...props }: ComponentProps<"button">) {
  return <button type="button" className={cn(base, "bg-white text-black", className)} {...props} />;
}
export function SecondaryButton({ className, ...props }: ComponentProps<"button">) {
  return <button type="button" className={cn(base, "glass-thin text-white", className)} {...props} />;
}
export function PrimaryLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={cn(base, "bg-white text-black", className)} {...props} />;
}

/* ---------------- Stepper ---------------- */

export function Stepper({
  value,
  min = 0,
  max = 9,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const btn =
    "flex size-10 items-center justify-center rounded-full text-white/85 transition-[transform,background] active:scale-[0.96] hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none";
  return (
    <div className="glass-thin flex items-center gap-1 rounded-full p-1" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="size-4" />
      </button>
      <span className="w-6 text-center text-[16px] font-medium tabular-nums text-white" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/* ---------------- Bottom sheet ---------------- */

/**
 * iOS-style sheet with a grabber. Drag down (or flick) to dismiss; the
 * overlay fades with the drag, the sheet rubber-bands if pulled up, and it
 * leaves faster than it arrives. Tap the scrim or press Escape to close.
 */
export function BottomSheet(props: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return <AnimatePresence>{props.open && <Sheet {...props} />}</AnimatePresence>;
}

const DRAWER = [0.32, 0.72, 0, 1] as const;

function Sheet({
  onClose,
  title,
  children,
  footer,
}: {
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const id = useId();
  const scrim = useMotionValue(1);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3, ease: DRAWER } }}
        exit={{ opacity: 0, transition: { duration: 0.2, ease: DRAWER } }}
      >
        <motion.button type="button" aria-label="Close" className="absolute inset-0 bg-black/55" style={{ opacity: scrim }} onClick={onClose} />
      </motion.div>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        className="absolute inset-x-0 bottom-0 flex max-h-[85%] flex-col rounded-t-[32px] bg-[#1c1c1e] shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]"
        initial={{ y: "100%" }}
        animate={{ y: 0, transition: { type: "spring", stiffness: 420, damping: 40 } }}
        exit={{ y: "100%", transition: { duration: 0.22, ease: DRAWER } }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        // A little give upward (rubber band), plenty downward.
        dragElastic={{ top: 0.06, bottom: 0.6 }}
        onDrag={(_, info: PanInfo) => scrim.set(Math.max(0, Math.min(1, 1 - info.offset.y / 360)))}
        onDragEnd={(_, info: PanInfo) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose();
          else animate(scrim, 1, { duration: 0.2, ease: DRAWER });
        }}
      >
        <div className="flex justify-center pb-1 pt-2.5">
          <span className="h-[5px] w-9 rounded-full bg-white/25" />
        </div>
        <h2 id={id} className="px-5 pb-3 pt-1 text-[20px] font-medium text-white">
          {title}
        </h2>
        <div className="flex-1 overflow-y-auto px-5 pb-4 [scrollbar-width:none]">{children}</div>
        {footer && <div className="px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-2 md:pb-8">{footer}</div>}
      </motion.div>
    </div>
  );
}

/* ---------------- Section label ---------------- */

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mb-2.5 px-1 text-[13px] text-white/55", className)}>{children}</h2>;
}
