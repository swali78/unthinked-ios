"use client";

import { Compass, House, Plane, User, WalletCards } from "lucide-react";
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tripEnd, useBooking } from "@/lib/booking-store";
import { cn } from "@/lib/utils";

/**
 * Unthinked's tab bar, built on the @componentry/magnetic-dock mechanics
 * (components/ui/magnetic-dock.tsx) and adapted for a phone:
 * - magnifies under the mouse AND under a finger: press and slide to scrub
 *   across tabs like the iOS dock, release to open the tab you're on;
 * - dark graphite tiles, white tile for the active tab, a gliding indicator;
 * - real links (keyboard, middle-click, prefetch) and live badges;
 * - honours reduced motion.
 */

const TABS = [
  { href: "/", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/trips", label: "Trips", icon: Plane },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
  { href: "/profile", label: "Profile", icon: User },
] as const;

const TILE = 42; // resting tile size, px
const MAX_SCALE = 1.38;
const REACH = 110; // px either side where magnification fades out
const SPRING = { damping: 22, stiffness: 320, mass: 0.45 };

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const { state, ready } = useBooking();
  const pointerX = useMotionValue(Number.POSITIVE_INFINITY);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const scrub = useRef<{ startX: number; moved: boolean; over: number } | null>(null);
  const [scrubbing, setScrubbing] = useState<number | null>(null);

  // Live counts for badges (computed after the store loads, so SSR matches).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, []);
  const upcoming = ready && now ? state.trips.filter((t) => tripEnd(t) >= now).length : 0;

  const activeIndex = TABS.findIndex(({ href }) => (href === "/" ? pathname === "/" : pathname.startsWith(href)));

  const nearest = (x: number) => {
    let best = -1;
    let dist = Number.POSITIVE_INFINITY;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const d = Math.abs(x - (r.left + r.width / 2));
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    scrub.current = { startX: e.clientX, moved: false, over: nearest(e.clientX) };
    pointerX.set(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (reduced) return;
    if (e.pointerType === "mouse") {
      pointerX.set(e.clientX);
      return;
    }
    const s = scrub.current;
    if (!s) return;
    pointerX.set(e.clientX);
    if (!s.moved && Math.abs(e.clientX - s.startX) > 8) {
      s.moved = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    }
    const over = nearest(e.clientX);
    if (s.moved && over !== s.over) {
      s.over = over;
      setScrubbing(over);
      navigator.vibrate?.(6); // a light tick where supported
    }
  };
  const endScrub = (e: React.PointerEvent, cancelled = false) => {
    const s = scrub.current;
    scrub.current = null;
    setScrubbing(null);
    pointerX.set(Number.POSITIVE_INFINITY);
    // A slide that ends on a tab opens it; a plain tap is handled by the link.
    if (!cancelled && s?.moved && s.over >= 0) {
      e.preventDefault();
      router.push(TABS[s.over].href);
    }
  };

  return (
    <nav aria-label="Main" className="relative mx-auto flex w-fit justify-center px-4 max-[359px]:px-2">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endScrub(e)}
        onPointerCancel={(e) => endScrub(e, true)}
        onPointerLeave={(e) => e.pointerType === "mouse" && pointerX.set(Number.POSITIVE_INFINITY)}
        className="glass-thin flex h-[66px] touch-none items-end gap-1.5 rounded-[26px] px-2.5 pb-[7px] select-none max-[359px]:gap-1 max-[359px]:px-1.5"
      >
        {TABS.map((tab, i) => (
          <DockTab
            key={tab.href}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            tab={tab}
            active={i === activeIndex}
            highlighted={scrubbing === i}
            badge={tab.href === "/trips" ? upcoming : 0}
            pointerX={pointerX}
            reduced={reduced}
          />
        ))}
      </div>
    </nav>
  );
}

function DockTab({
  tab,
  active,
  highlighted,
  badge,
  pointerX,
  reduced,
  ref,
}: {
  tab: (typeof TABS)[number];
  active: boolean;
  highlighted: boolean;
  badge: number;
  pointerX: MotionValue<number>;
  reduced: boolean;
  ref: (el: HTMLAnchorElement | null) => void;
}) {
  const own = useRef<HTMLAnchorElement | null>(null);
  const distance = useTransform(pointerX, (x) => {
    const el = own.current;
    if (!el || !Number.isFinite(x)) return REACH + 1;
    const r = el.getBoundingClientRect();
    return x - (r.left + r.width / 2);
  });
  const scale = useSpring(useTransform(distance, [-REACH, 0, REACH], [1, MAX_SCALE, 1]), SPRING);
  const size = useTransform(scale, (s) => s * TILE);
  const lift = useTransform(scale, (s) => (s - 1) * -14);
  const Icon = tab.icon;

  return (
    <Link
      ref={(el) => {
        own.current = el;
        ref(el);
      }}
      href={tab.href}
      aria-current={active ? "page" : undefined}
      aria-label={badge ? `${tab.label}, ${badge} upcoming` : tab.label}
      draggable={false}
      className="group relative flex w-[54px] flex-col max-[359px]:w-[46px] items-center gap-1 rounded-[16px] outline-none focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <motion.span
        className="relative flex items-center justify-center"
        style={reduced ? { width: TILE, height: TILE } : { width: size, height: size, y: lift }}
        whileTap={reduced ? undefined : { scale: 0.96 }}
      >
        {/* Tile */}
        <span
          className={cn(
            "absolute inset-0 rounded-[30%] transition-[background,box-shadow] duration-200",
            active
              ? "bg-white shadow-[0_8px_24px_-6px_rgb(255_255_255/0.35),inset_0_-2px_0_rgb(0_0_0/0.08)]"
              : "bg-[linear-gradient(180deg,#3a3a3d,#202022)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_6px_14px_-6px_rgb(0_0_0/0.8)]",
            highlighted && !active && "bg-[linear-gradient(180deg,#4a4a4e,#2a2a2d)]",
          )}
        />
        {/* Glass shine */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[30%] bg-[linear-gradient(140deg,rgb(255_255_255/0.22)_0%,transparent_45%)] opacity-70"
        />
        <Icon
          aria-hidden
          className={cn("relative size-[46%] transition-colors", active ? "text-black" : "text-white/80 group-hover:text-white")}
          strokeWidth={active ? 2.3 : 1.9}
        />
        {/* Badge */}
        <AnimatePresence initial={false}>
          {badge > 0 && (
            <motion.span
              key="badge"
              initial={reduced ? false : { scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-400 px-1 text-[10.5px] font-semibold tabular-nums text-black ring-2 ring-[#1c1c1e]"
            >
              {badge > 9 ? "9+" : badge}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.span>
      <span className={cn("text-[10px] font-medium leading-none transition-colors", active ? "text-white" : "text-white/45")}>
        {tab.label}
      </span>
      {/* Gliding active indicator */}
      {active && (
        <motion.span
          layoutId="dock-active-dot"
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 34 }}
          className="absolute -bottom-[5px] h-[3px] w-4 rounded-full bg-white"
        />
      )}
    </Link>
  );
}
