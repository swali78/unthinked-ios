"use client";

import { fallbackFaceStyle, LiveOrb, resolveVariant } from "@/components/ui/live-orb";
import { cn } from "@/lib/utils";

type OrbProps = {
  size?: number;
  /** Concentric light rings ripple outward (voice / thinking). */
  listening?: boolean;
  /** 0–1 audio level; scales the ripple intensity while listening. */
  level?: number;
  className?: string;
};

/** Lagoon, sand, sunset clay: the same trip palette as the welcome gradient. */
export const ORB_COLORS = ["#4FA3B8", "#E9C99F", "#C9785A"];

/**
 * Below this size the orb is drawn in CSS instead of WebGL. Browsers allow
 * only ~16 live WebGL contexts per page, and chat shows a small orb beside
 * every reply, so tiny orbs stay static.
 */
const LIVE_MIN = 40;

/**
 * Unthinked's assistant: a living orb (@23rd/live-orb) whose eyes follow the
 * pointer, blink, and glance around when idle. Glows softly at rest;
 * ripples rings of light while listening.
 */
export function AIOrb({ size = 56, listening = false, level = 0, className }: OrbProps) {
  const live = size >= LIVE_MIN;
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {listening && (
        <>
          {/* Static halo rings, like the reference voice screen */}
          {[2.2, 3.2, 4.4].map((s, i) => (
            <span
              key={s}
              className="absolute rounded-full border border-white/[0.07]"
              style={{
                width: size * s,
                height: size * s,
                background: `radial-gradient(circle, rgb(255 246 232 / ${0.06 - i * 0.015}) 0%, transparent 70%)`,
              }}
            />
          ))}
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute rounded-full border border-white/25"
              style={{
                width: size * 2.2,
                height: size * 2.2,
                animation: `ring-out 2.4s cubic-bezier(0.2,0.6,0.3,1) ${i * 0.8}s infinite`,
                opacity: 0.4 + level * 0.6,
              }}
            />
          ))}
        </>
      )}
      {/* Soft coloured glow so the orb sits *in* the dark UI, not on it */}
      <span
        className="absolute rounded-full"
        style={{
          inset: -size * 0.18,
          background: "radial-gradient(circle, rgb(79 163 184 / 0.32) 0%, rgb(201 120 90 / 0.14) 45%, transparent 70%)",
          animation: "orb-breathe 4.5s ease-in-out infinite",
        }}
      />
      {live ? (
        <LiveOrb size={size} variant="webgl" colors={ORB_COLORS} className="relative" />
      ) : (
        <StaticOrb size={size} />
      )}
    </span>
  );
}

/** The same face as the live orb, in plain CSS, for small inline use. */
function StaticOrb({ size }: { size: number }) {
  const resolved = resolveVariant("webgl", undefined, undefined, ORB_COLORS);
  return (
    <span className="relative block overflow-hidden rounded-full" style={{ width: size, height: size, ...fallbackFaceStyle(resolved) }}>
      {[31, 56].map((left) => (
        <span
          key={left}
          className="absolute rounded-full"
          style={{ backgroundColor: resolved.eye, width: "13%", height: "28%", left: `${left}%`, top: "34%" }}
        />
      ))}
    </span>
  );
}
