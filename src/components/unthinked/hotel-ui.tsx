"use client";

import { Heart, MapPin, Star } from "lucide-react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import { useState } from "react";
import type { HotelSearch } from "@/lib/booking-store";
import { usd } from "@/lib/data/booking";
import { ratingWord } from "@/lib/data/hotels";
import { defaultDepartDate } from "@/lib/data/search";
import type { Hotel } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { photo } from "@/lib/photo";

export function parseHotelSearch(params: ReadonlyURLSearchParams | URLSearchParams): HotelSearch {
  return {
    city: params.get("city") ?? "Bali",
    checkIn: params.get("checkIn") ?? defaultDepartDate(),
    nights: Math.min(30, Math.max(1, Number(params.get("nights")) || 3)),
    guests: Math.min(8, Math.max(1, Number(params.get("guests")) || 2)),
  };
}

export const hotelQuery = (s: HotelSearch, extra: Record<string, string> = {}) =>
  new URLSearchParams({ city: s.city, checkIn: s.checkIn, nights: String(s.nights), guests: String(s.guests), ...extra }).toString();

export const checkOutDate = (s: HotelSearch) => {
  const d = new Date(`${s.checkIn}T00:00:00`);
  d.setDate(d.getDate() + s.nights);
  return d;
};

export const fmtShort = (d: Date | string) =>
  (typeof d === "string" ? new Date(`${d}T00:00:00`) : d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function RatingPill({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cn("glass-thin inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-medium text-white", className)}>
      <Star className="size-3 fill-white" /> {rating.toFixed(1)}
    </span>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n}-star hotel`}>
      {Array.from({ length: n }, (_, i) => (
        <Star key={i} className="size-3 fill-amber-200/90 text-amber-200/90" />
      ))}
    </span>
  );
}

/** Full-width list card with photo. */
export function HotelCard({ hotel: h, nights, onOpen }: { hotel: Hotel; nights: number; onOpen: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <article className="glass relative overflow-hidden rounded-[26px]">
      <button type="button" onClick={onOpen} className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white/70">
        <div className="relative h-[176px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...photo(h.image, 400, 176)} alt="" loading="lazy" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <RatingPill rating={h.rating} className="absolute left-3 top-3" />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2">
            <Stars n={h.stars} />
            <span className="text-[12px] text-white/55">
              {ratingWord(h.rating)} · {h.reviews.toLocaleString()} reviews
            </span>
          </div>
          <p className="mt-1.5 text-[18px] font-medium leading-tight text-white">{h.name}</p>
          <p className="mt-1 flex items-center gap-1 text-[12.5px] text-white/55">
            <MapPin className="size-3.5" /> {h.area} · {h.amenities.slice(0, 2).join(" · ")}
          </p>
          <div className="mt-3 flex items-end justify-between border-t border-white/[0.07] pt-3">
            <span className="text-[12px] text-white/50">
              {nights} night{nights > 1 ? "s" : ""} · {usd(h.pricePerNight * nights)} total
            </span>
            <span className="text-[12px] text-white/55">
              <span className="text-[18px] font-semibold tabular-nums text-white">{usd(h.pricePerNight)}</span> / night
            </span>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={() => setSaved((s) => !s)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${h.name} from saved` : `Save ${h.name}`}
        className="glass-thin absolute right-3 top-3 flex size-10 items-center justify-center rounded-full transition-transform active:scale-[0.96]"
      >
        <Heart className={cn("size-[18px]", saved ? "fill-rose-400 text-rose-400" : "text-white")} />
      </button>
    </article>
  );
}
