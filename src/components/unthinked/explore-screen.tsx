"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { usd } from "@/lib/data/booking";
import { DESTINATIONS } from "@/lib/data/seed";
import type { Destination } from "@/lib/data/types";
import { Chip, SerifAccent } from "./primitives";
import { TabScreen } from "./tab-screen";
import { photo } from "@/lib/photo";

const THEMES: { id: Destination["themes"][number] | "all"; label: string }[] = [
  { id: "all", label: "Everywhere" },
  { id: "sea", label: "Sea" },
  { id: "city", label: "City" },
  { id: "culture", label: "Culture" },
  { id: "food", label: "Food" },
  { id: "desert", label: "Desert" },
];

export function ExploreScreen() {
  const [theme, setTheme] = useState<(typeof THEMES)[number]["id"]>("all");
  const list = theme === "all" ? DESTINATIONS : DESTINATIONS.filter((d) => d.themes.includes(theme));

  return (
    <TabScreen
      title={
        <>
          <SerifAccent>Explore</SerifAccent>
        </>
      }
    >
      <Link href="/plan" className="glass flex items-center gap-3 rounded-[24px] p-4">
        <span className="flex size-11 items-center justify-center rounded-full bg-white text-black">
          <Sparkles className="size-5" />
        </span>
        <span className="flex-1">
          <span className="block text-[16px] text-white">
            Not sure where? <SerifAccent className="text-white/70">Let&apos;s plan it.</SerifAccent>
          </span>
          <span className="block text-[12.5px] text-white/55">Six questions, then flights that fit.</span>
        </span>
      </Link>

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <Chip key={t.id} role="radio" aria-checked={theme === t.id} selected={theme === t.id} onClick={() => setTheme(t.id)} className="shrink-0">
            {t.label}
          </Chip>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5">
        {list.map((d, i) => (
          <li key={d.id} className={i % 3 === 0 ? "col-span-2" : undefined}>
            <Link
              href={`/chat?q=${encodeURIComponent(`Plan a trip to ${d.city}`)}`}
              className={`relative block overflow-hidden rounded-[24px] ${i % 3 === 0 ? "h-[220px]" : "h-[200px]"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img {...(i % 3 === 0 ? photo(d.image, 400, 220) : photo(d.image, 180, 200))} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <p className="text-[18px] font-medium leading-tight text-white">
                  {d.city} {d.city !== d.country && i % 3 === 0 && <SerifAccent className="text-white/70">{d.country}</SerifAccent>}
                </p>
                {i % 3 === 0 && <p className="mt-1 line-clamp-1 text-[12.5px] text-white/70">{d.blurb}</p>}
                <p className="mt-1 text-[11.5px] text-white/60">
                  {d.bestMonths} · from {usd(d.fromPrice)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </TabScreen>
  );
}
