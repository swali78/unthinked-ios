"use client";

import {
  BedDouble,
  Check,
  ChevronLeft,
  Dumbbell,
  Heart,
  MapPin,
  Maximize2,
  Plane,
  Sparkles,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useBooking } from "@/lib/booking-store";
import { usd } from "@/lib/data/booking";
import { getHotel, hotelPhotos, hotelReviews, hotelRooms, ratingWord, reviewBreakdown, type Review } from "@/lib/data/hotels";
import { cn } from "@/lib/utils";
import { checkOutDate, fmtShort, hotelQuery, parseHotelSearch, Stars } from "./hotel-ui";
import { SerifAccent } from "./primitives";
import { BottomSheet, PrimaryButton, PrimaryLink, SectionLabel } from "./screen";
import { StayMap } from "./stay-map";
import { photo } from "@/lib/photo";

const AMENITY_ICON: [RegExp, typeof Wifi][] = [
  [/wi-?fi/i, Wifi],
  [/pool|beach|reef|snorkel|lagoon|surf|dive|board/i, Waves],
  [/spa|hammam|onsen|yoga|hot tub/i, Sparkles],
  [/breakfast|dinner|kaiseki|inclusive/i, UtensilsCrossed],
  [/gym/i, Dumbbell],
  [/airport/i, Plane],
];
const amenityIcon = (a: string) => AMENITY_ICON.find(([re]) => re.test(a))?.[1] ?? Check;

export function HotelDetail() {
  const router = useRouter();
  const params = useSearchParams();
  const search = parseHotelSearch(params);
  const hotel = getHotel(params.get("id") ?? "");
  const { update } = useBooking();
  const rooms = useMemo(() => (hotel ? hotelRooms(hotel) : []), [hotel]);
  const [roomId, setRoomId] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (!hotel) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-[20px] font-medium text-white">This stay isn&apos;t available</p>
        <p className="text-[14.5px] text-white/60">It may have been removed. Search again to see what&apos;s open.</p>
        <PrimaryLink href="/hotels" className="mt-3 h-11 text-[15px]">
          Search stays
        </PrimaryLink>
      </div>
    );
  }

  const photos = hotelPhotos(hotel);
  const reviews = hotelReviews(hotel);
  const breakdown = reviewBreakdown(hotel);
  // Default to the cheapest flexible room that fits everyone.
  const room =
    rooms.find((r) => r.id === roomId) ??
    rooms.find((r) => r.cancellation === "free" && r.sleeps >= search.guests) ??
    rooms[0];
  const fits = room.sleeps >= search.guests;

  const reserve = () => {
    update({ stay: { ...search, hotelId: hotel.id, roomId: room.id } });
    router.push("/hotels/checkout");
  };

  return (
    <div className="relative flex h-full flex-col">
      <div
        className="flex-1 overflow-y-auto overscroll-contain pb-6 [scrollbar-width:none]"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 280)}
      >
        <Carousel photos={photos} name={hotel.name} />

        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 text-[12.5px] text-white/55">
            <Stars n={hotel.stars} /> {hotel.area}, {hotel.city}
          </div>
          <h1 className="mt-1.5 text-[28px] font-medium leading-[1.1] tracking-[-0.02em] text-white">{hotel.name}</h1>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="rounded-[10px] bg-white px-2 py-1 text-[14px] font-semibold tabular-nums text-black">{hotel.rating.toFixed(1)}</span>
            <span className="text-[14px] text-white">{ratingWord(hotel.rating)}</span>
            <span className="text-[13px] text-white/50">· {hotel.reviews.toLocaleString()} reviews</span>
          </div>

          <SectionLabel className="mt-7">What this place offers</SectionLabel>
          <ul className="grid grid-cols-2 gap-2">
            {hotel.amenities.map((a) => {
              const Icon = amenityIcon(a);
              return (
                <li key={a} className="glass-thin flex items-center gap-2.5 rounded-[16px] px-3 py-2.5 text-[13.5px] text-white/85">
                  <Icon className="size-4 shrink-0 text-white/60" /> {a}
                </li>
              );
            })}
          </ul>

          <SectionLabel className="mt-7">
            Choose a room · {search.nights} night{search.nights > 1 ? "s" : ""}, {fmtShort(search.checkIn)} – {fmtShort(checkOutDate(search))}
          </SectionLabel>
          <div role="radiogroup" aria-label="Room" className="space-y-2.5">
            {rooms.map((r) => {
              const on = r.id === room.id;
              const tooSmall = r.sleeps < search.guests;
              return (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setRoomId(r.id)}
                  className={cn(
                    "glass w-full rounded-[22px] p-4 text-left transition-[box-shadow,transform] active:scale-[0.99]",
                    on && "shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.85)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[16px] font-medium text-white">{r.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-white/55">
                        <span className="flex items-center gap-1"><BedDouble className="size-3.5" /> {r.bed}</span>
                        <span className="flex items-center gap-1"><Maximize2 className="size-3.5" /> {r.size} m²</span>
                        <span className={cn("flex items-center gap-1", tooSmall && "text-amber-300")}>
                          <Users className="size-3.5" /> Sleeps {r.sleeps}
                        </span>
                      </p>
                    </div>
                    <span className="text-right">
                      <span className="block text-[17px] font-semibold tabular-nums text-white">{usd(r.price)}</span>
                      <span className="whitespace-nowrap text-[11.5px] text-white/50">per night</span>
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.perks.map((p) => (
                      <span key={p} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[11.5px] text-white/75">{p}</span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[12.5px]">
                    <span className={r.cancellation === "free" ? "text-emerald-300" : "text-white/50"}>
                      {r.cancellation === "free" ? "Free cancellation" : "Non-refundable · lowest price"}
                    </span>
                    {r.left ? <span className="text-amber-300/90">{r.left === 1 ? "Last room" : `${r.left} rooms left`}</span> : null}
                  </div>
                </button>
              );
            })}
          </div>

          <SectionLabel className="mt-7">Guest reviews</SectionLabel>
          <div className="glass rounded-[24px] p-4">
            <div className="flex items-end gap-3">
              <span className="text-[40px] font-medium leading-none tracking-tight text-white">{hotel.rating.toFixed(1)}</span>
              <span className="pb-1">
                <span className="block text-[15px] text-white">{ratingWord(hotel.rating)}</span>
                <span className="text-[12px] text-white/50">{hotel.reviews.toLocaleString()} verified stays</span>
              </span>
            </div>
            <dl className="mt-4 space-y-2">
              {breakdown.map((b) => (
                <div key={b.label} className="grid grid-cols-[88px_1fr_32px] items-center gap-3 text-[12.5px]">
                  <dt className="text-white/60">{b.label}</dt>
                  <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <span className="block h-full rounded-full bg-white/80" style={{ width: `${b.score * 10}%` }} />
                  </span>
                  <dd className="text-right tabular-nums text-white">{b.score.toFixed(1)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <ul className="mt-2.5 space-y-2.5">
            {reviews.slice(0, 2).map((r) => (
              <ReviewItem key={r.id} r={r} />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setAllReviews(true)}
            className="glass-thin mt-2.5 h-11 w-full rounded-full text-[14px] text-white/85"
          >
            Read all {reviews.length} recent reviews
          </button>

          <SectionLabel className="mt-7">Where you&apos;ll be</SectionLabel>
          <div className="overflow-hidden rounded-[24px]">
            <StayMap hotels={[hotel]} selected={hotel.id} onSelect={() => {}} maxZoom={13} className="h-[180px]" />
          </div>
          <p className="mt-2 flex items-center gap-1 px-1 text-[13px] text-white/60">
            <MapPin className="size-3.5" /> {hotel.area}, {hotel.city}, {hotel.country}
          </p>
        </div>
      </div>

      {/* Floating top controls over the photo; a solid bar fades in once the photo scrolls away */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)] transition-[background,box-shadow] duration-300 frame:pt-[54px]",
          scrolled && "bg-[#0b0b0c]/90 shadow-[0_1px_0_rgb(255_255_255/0.06)] backdrop-blur-xl",
        )}
      >
        <p
          aria-hidden={!scrolled}
          className={cn(
            "absolute inset-x-16 bottom-[18px] truncate text-center text-[16px] text-white transition-opacity duration-300",
            scrolled ? "opacity-100" : "opacity-0",
          )}
        >
          {hotel.name}
        </p>
        <button
          type="button"
          aria-label="Back"
          onClick={() => router.push(`/hotels/results?${hotelQuery(search)}`)}
          className="glass-thin pointer-events-auto flex size-11 items-center justify-center rounded-full text-white active:scale-[0.96]"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save stay"}
          onClick={() => setSaved((s) => !s)}
          className="glass-thin pointer-events-auto flex size-11 items-center justify-center rounded-full active:scale-[0.96]"
        >
          <Heart className={cn("size-5", saved ? "fill-rose-400 text-rose-400" : "text-white")} />
        </button>
      </div>

      <div className="relative z-10 border-t border-white/[0.06] bg-[#0b0b0c]/85 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl frame:pb-7">
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] text-white/55">
              {room.name} · {search.nights} night{search.nights > 1 ? "s" : ""}
            </p>
            <p className="text-[22px] font-semibold tabular-nums tracking-tight text-white">{usd(room.price * search.nights)}</p>
            {!fits && <p className="text-[11.5px] text-amber-300">Sleeps {room.sleeps}. Pick a bigger room for {search.guests} guests.</p>}
          </div>
          <PrimaryButton onClick={reserve} disabled={!fits}>
            Reserve
          </PrimaryButton>
        </div>
      </div>

      <BottomSheet
        open={allReviews}
        onClose={() => setAllReviews(false)}
        title={
          <>
            What guests <SerifAccent>are saying</SerifAccent>
          </>
        }
      >
        <ul className="space-y-2.5">
          {reviews.map((r) => (
            <ReviewItem key={r.id} r={r} />
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
}

function Carousel({ photos, name }: { photos: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLUListElement>(null);
  return (
    <div className="relative">
      <ul
        ref={ref}
        aria-label={`Photos of ${name}`}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className="flex h-[360px] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
      >
        {photos.map((p, i) => (
          <li key={p} className="h-full w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...photo(p, 430, 360)} alt={i === 0 ? name : ""} loading={i === 0 ? "eager" : "lazy"} className="size-full object-cover" />
          </li>
        ))}
      </ul>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-[#0b0b0c]" />
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5" aria-hidden>
        {photos.map((p, i) => (
          <span key={p} className={cn("h-1.5 rounded-full transition-[width,background-color] duration-200", i === index ? "w-5 bg-white" : "w-1.5 bg-white/45")} />
        ))}
      </div>
      <span className="glass-thin absolute bottom-3 right-4 rounded-full px-2.5 py-1 text-[11.5px] tabular-nums text-white/85">
        {index + 1}/{photos.length}
      </span>
    </div>
  );
}

function ReviewItem({ r }: { r: Review }) {
  return (
    <li className="glass rounded-[20px] p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/10 text-[13px] font-medium text-white">{r.name[0]}</span>
          <span>
            <span className="block text-[14px] text-white">{r.name}</span>
            <span className="block text-[11.5px] text-white/50">
              {r.from} · {r.trip} · {r.date}
            </span>
          </span>
        </span>
        <span className="rounded-[8px] bg-white/10 px-1.5 py-0.5 text-[12.5px] font-semibold tabular-nums text-white">{r.score.toFixed(1)}</span>
      </div>
      <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/80">{r.text}</p>
    </li>
  );
}
