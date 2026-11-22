import Link from "next/link";
import { Suspense } from "react";
import { AIOrb } from "@/components/unthinked/ai-orb";
import { HomeDock } from "@/components/unthinked/home-dock";
import { Greeting, NextTrip, OnboardingGate } from "@/components/unthinked/home-live";
import { SerifAccent } from "@/components/unthinked/primitives";
import { DESTINATIONS } from "@/lib/data/seed";
import { photo } from "@/lib/photo";

const ACTIONS = [
  { emoji: "🏝️", title: "Discover", accent: "Favorite place", href: "/plan" },
  { emoji: "✈️", title: "Flight", accent: "Booking", href: "/flights" },
  { emoji: "🏨", title: "Hotel", accent: "Stays", href: "/hotels" },
  { emoji: "🛂", title: "Visa", accent: "Application", href: "/visa" },
] as const;

const chat = (q: string) => `/chat?q=${encodeURIComponent(q)}`;

export default function Home() {
  const ideas = DESTINATIONS.filter((d) => d.id !== "cai");

  return (
    <div className="relative h-full">
    <div className="h-full overflow-y-auto overscroll-contain pb-44 pt-[max(env(safe-area-inset-top),20px)] [scrollbar-width:none] frame:pt-[62px]">
      {/* Greeting */}
      <header className="flex flex-col items-center px-6 pt-6 text-center">
        <AIOrb size={58} />
        <p className="mt-5 text-[17px] text-white/70">
          <span aria-hidden>👋 </span>
          <Greeting />
        </p>
        <h1 className="mt-1 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white">
          How <SerifAccent className="text-[33px]">can</SerifAccent> I help you?
        </h1>
      </header>

      {/* Things you can do */}
      <section aria-labelledby="things" className="mt-9 px-4">
        <h2 id="things" className="mb-3 px-1 text-[13px] text-white/60">
          Things you can do!
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {ACTIONS.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="glass group relative flex h-[124px] flex-col justify-between overflow-hidden rounded-[24px] p-4 transition-transform duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            >
              <span
                aria-hidden
                className="text-[30px] leading-none drop-shadow-[0_6px_10px_rgb(0_0_0/0.55)] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110"
              >
                {a.emoji}
              </span>
              <span className="text-[16px] leading-[1.15] text-white">
                {a.title}
                <br />
                <SerifAccent className="text-[18px] text-white/80">{a.accent}</SerifAccent>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Travel together */}
      <section aria-labelledby="together" className="mt-2.5 px-4">
        <h2 id="together" className="sr-only">Travel together</h2>
        <Link
          href="/together"
          className="relative flex items-center gap-4 overflow-hidden rounded-[24px] p-4 transition-transform duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          style={{ background: "linear-gradient(135deg, rgb(79 163 184 / 0.30), rgb(201 120 90 / 0.24))" }}
        >
          <span aria-hidden className="text-[30px] leading-none drop-shadow-[0_6px_10px_rgb(0_0_0/0.55)]">🧳</span>
          <span className="flex-1 text-[16px] leading-[1.15] text-white">
            Travel <SerifAccent className="text-[18px] text-white/85">together</SerifAccent>
            <span className="mt-1 block text-[12.5px] text-white/65">Find people flying where you are. Plan and split the cost.</span>
          </span>
          <span aria-hidden className="text-white/60">→</span>
        </Link>
      </section>

      {/* Upcoming trip */}
      <section aria-labelledby="upcoming" className="mt-8 px-4">
        <h2 id="upcoming" className="mb-3 px-1 text-[13px] text-white/60">
          Your next trip
        </h2>
        <Suspense fallback={<div className="h-[176px] rounded-[26px] bg-white/[0.06]" />}>
          <NextTrip />
        </Suspense>
      </section>

      {/* Ideas */}
      <section aria-labelledby="ideas" className="mt-8">
        <h2 id="ideas" className="mb-3 px-5 text-[13px] text-white/60">
          Ideas for <SerifAccent className="text-[15px]">this winter</SerifAccent>
        </h2>
        <ul className="flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {ideas.map((d) => (
            <li key={d.id} className="snap-start">
              <Link
                href={chat(`Plan a trip to ${d.city}`)}
                className="relative block h-[190px] w-[140px] overflow-hidden rounded-[22px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img {...photo(d.image, 140, 190)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-[15px] font-medium leading-tight text-white">{d.city}</p>
                  <p className="mt-0.5 text-[11.5px] text-white/65">
                    from ${Math.round(d.fromPrice / 100)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

    </div>
      <HomeDock />
      <OnboardingGate />
    </div>
  );
}
