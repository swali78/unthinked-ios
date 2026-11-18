"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBooking } from "@/lib/booking-store";
import { DESTINATIONS } from "@/lib/data/seed";
import { cn } from "@/lib/utils";
import { AIOrb } from "./ai-orb";
import { FadedQuestion } from "./primitives";
import { photo } from "@/lib/photo";
import { ShaderGradient } from "@/components/ui/shader-gradient";

const SLIDES = [
  { img: "mle", title: "Plan a whole trip just by asking", body: "Tell the assistant where you dream of going. It finds the flights, stays and paperwork." },
  { img: "jtr", title: "Flights and stays in one calm place", body: "Compare fares, pick seats and rooms, and keep every pass in your wallet." },
  { img: "cai", title: "Visas without the usual paperwork", body: "Check what your passport needs and apply for eVisas in about eight minutes." },
] as const;

const EASE = [0.32, 0.72, 0, 1] as const;

/** Sand, lagoon, dusk, sunset clay: the trip in four colours, kept soft. */
const TRAVEL_GRADIENT = ["#E9C99F", "#4FA3B8", "#2B3F6B", "#C9785A"];

export function WelcomeScreen() {
  const router = useRouter();
  const { state, update } = useBooking();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [name, setName] = useState("");
  const last = i === SLIDES.length;

  const go = (n: number) => {
    if (n < 0 || n > SLIDES.length) return;
    setDir(n > i ? 1 : -1);
    setI(n);
  };
  const finish = (displayName?: string) => {
    update({ onboarded: true, prefs: { ...state.prefs, name: displayName?.trim() || state.prefs.name } });
    router.replace("/");
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(i + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(i - 1);
  };

  const slide = SLIDES[Math.min(i, SLIDES.length - 1)];
  const image = DESTINATIONS.find((d) => d.id === slide.img)!.image;

  return (
    <div className="relative h-full overflow-hidden">
      <AnimatePresence initial={false} custom={dir}>
        {last ? (
          // Sign-in: the photos give way to a slow, living gradient.
          <motion.div
            key="shader"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: EASE }}
          >
            <ShaderGradient
              theme="dark"
              colors={TRAVEL_GRADIENT}
              intensity={0.72}
              blur={0.82}
              speed={0.1}
              grain={0.28}
            />
          </motion.div>
        ) : (
          <motion.img
            key={slide.img}
            {...photo(image, 430, 932)}
            alt=""
            className="absolute inset-0 size-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        )}
      </AnimatePresence>
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          last
            ? "bg-[linear-gradient(to_bottom,rgb(11_11_12/0.25)_0%,transparent_35%,rgb(11_11_12/0.55)_70%,#0b0b0c_100%)]"
            : "bg-[linear-gradient(to_bottom,rgb(0_0_0/0.4)_0%,transparent_28%,rgb(11_11_12/0.72)_55%,#0b0b0c_82%)]",
        )}
      />

      <div className="relative flex h-full flex-col px-6 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),20px)] md:pb-10 md:pt-[62px]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[17px] font-medium text-white">
            <AIOrb size={30} /> Unthinked
          </span>
          {!last && (
            <button type="button" onClick={() => go(SLIDES.length)} className="glass-thin h-9 rounded-full px-4 text-[13px] text-white/85">
              Skip
            </button>
          )}
        </div>

        <AnimatePresence>
          {last && (
            <motion.div
              key="orb"
              className="flex flex-1 items-center justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
            >
              <AIOrb size={72} listening />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div className="mt-auto" drag={last ? false : "x"} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={onDragEnd}>
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={i}
              custom={dir}
              variants={{ enter: (d: number) => ({ x: d * 60, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -60, opacity: 0 }) }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: EASE }}
            >
              {last ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    finish(name);
                  }}
                >
                  <h1 className="text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-white">
                    <FadedQuestion text="What should we call you?" split={0.5} />
                  </h1>
                  <label htmlFor="w-name" className="sr-only">
                    Your first name
                  </label>
                  <input
                    id="w-name"
                    autoFocus
                    value={name}
                    maxLength={24}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name"
                    autoComplete="given-name"
                    className="glass-thin mt-6 h-14 w-full rounded-[20px] px-5 text-[17px] text-white placeholder:text-white/40 focus:outline-none focus:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]"
                  />
                  <button type="submit" className="mt-3 h-14 w-full rounded-full bg-white text-[17px] font-medium text-black transition-transform active:scale-[0.98]">
                    Get started
                  </button>
                  <button type="button" onClick={() => finish()} className="mt-2 h-12 w-full rounded-full text-[15px] text-white/70">
                    Continue as {state.prefs.name}
                  </button>
                  <p className="mt-2 text-center text-[11.5px] text-white/40">Demo sign-in. Nothing leaves this device.</p>
                </form>
              ) : (
                <>
                  <h1 className="text-[38px] font-medium leading-[1.05] tracking-[-0.02em] text-white">
                    <FadedQuestion text={slide.title} split={0.55} />
                  </h1>
                  <p className="mt-4 max-w-[32ch] text-[16px] leading-relaxed text-white/70">{slide.body}</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {!last && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1.5" role="tablist" aria-label="Welcome slides">
              {SLIDES.map((s, n) => (
                <button
                  key={s.img}
                  type="button"
                  role="tab"
                  aria-selected={n === i}
                  aria-label={`Slide ${n + 1}`}
                  onClick={() => go(n)}
                  className={cn("h-2 rounded-full transition-[width,background-color] duration-200", n === i ? "w-6 bg-white" : "w-2 bg-white/35")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(i + 1)}
              className="h-14 rounded-full bg-white px-8 text-[16px] font-medium text-black transition-transform active:scale-[0.97]"
            >
              {i === SLIDES.length - 1 ? "Sign in" : "Next"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
