import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Inline italic serif, used for the second voice inside headings. */
export function SerifAccent({ className, ...props }: ComponentProps<"em">) {
  return <em className={cn("serif-accent", className)} {...props} />;
}

/**
 * Renders an AI-style question: the opening in sans, the tail in serif
 * italic fading to 40%. `split` is the fraction of words kept in sans.
 */
export function FadedQuestion({
  text,
  split = 0.6,
  className,
}: {
  text: string;
  split?: number;
  className?: string;
}) {
  const words = text.trim().split(/\s+/);
  const cut = Math.max(1, Math.min(words.length - 1, Math.round(words.length * split)));
  const head = words.slice(0, cut).join(" ");
  const tail = words.slice(cut).join(" ");
  return (
    <span className={className}>
      {head}
      {tail && (
        <>
          {" "}
          <span
            className="serif-accent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgb(242 241 238 / 0.75), rgb(242 241 238 / 0.4))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {tail}
          </span>
        </>
      )}
    </span>
  );
}

export function GlassCard({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("glass rounded-[26px]", className)} {...props} />;
}

export function Chip({
  selected,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { selected?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 items-center rounded-full px-4 text-[13px] font-medium transition-[background,color,transform] duration-200 active:scale-95",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
        selected
          ? "bg-white text-black"
          : "glass-thin text-white/90 hover:bg-white/15",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({
  className,
  label,
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "glass-thin flex size-11 items-center justify-center rounded-full text-white/85 transition-transform active:scale-[0.96]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative overflow-hidden rounded-2xl bg-white/[0.06]", className)}
    >
      <div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
        style={{ animation: "shimmer 1.4s infinite" }}
      />
    </div>
  );
}

/**
 * Entrance delays for list items: non-uniform (fast at first, easing off) and
 * capped, so the 7th item onward appears with the 6th and nothing ever waits.
 */
export const STAGGER = [0, 0.04, 0.07, 0.095, 0.115, 0.13] as const;
