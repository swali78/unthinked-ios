"use client";

import { BedDouble, CalendarDays, Plane } from "lucide-react";
import Link from "next/link";
import type { FlightTrip, StayTrip, Trip } from "@/lib/booking-store";
import { fmtDay, fmtTime } from "@/lib/data/booking";
import { DESTINATIONS } from "@/lib/data/seed";
import { cn } from "@/lib/utils";
import { photo } from "@/lib/photo";

const FALLBACK_IMG = DESTINATIONS.find((d) => d.id === "cai")!.image;

/** Photo for a flight's destination, falling back to a generic travel shot. */
export const flightImage = (t: FlightTrip) =>
  DESTINATIONS.find((d) => d.airport === t.flight.to)?.image ?? FALLBACK_IMG;

export const stayRange = (t: StayTrip) => {
  const a = new Date(`${t.checkIn}T00:00:00`);
  const b = new Date(a);
  b.setDate(b.getDate() + t.nights);
  const f = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${f(a)} – ${f(b)}`;
};

export function TripCard({ trip, past }: { trip: Trip; past?: boolean }) {
  const href = `/wallet?pass=${trip.id}`;
  if (trip.kind === "flight") {
    const f = trip.flight;
    return (
      <Link href={href} className={cn("glass block overflow-hidden rounded-[24px]", past && "opacity-70")}>
        <div className="relative h-[92px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...photo(flightImage(trip), 400, 92)} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center gap-3 px-4">
            <span className="text-[30px] font-medium tracking-tight text-white">{f.from}</span>
            <Plane className="size-4 rotate-45 text-white/70" />
            <span className="text-[30px] font-medium tracking-tight text-white">{f.to}</span>
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 text-[12.5px]">
          <span className="flex items-center gap-1.5 text-white/75">
            <CalendarDays className="size-3.5" /> {fmtDay(f.departAt)} · {fmtTime(f.departAt)}
          </span>
          <span className="text-white/50">
            {f.flightNumber} · Ref {trip.id}
          </span>
        </div>
      </Link>
    );
  }
  return (
    <Link href={href} className={cn("glass flex gap-3 rounded-[24px] p-2.5", past && "opacity-70")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...photo(trip.image, 84, 84)} alt="" className="size-[84px] shrink-0 rounded-[18px] object-cover" />
      <div className="min-w-0 py-1 pr-1">
        <p className="flex items-center gap-1.5 text-[12px] text-white/55">
          <BedDouble className="size-3.5" /> {trip.city}
        </p>
        <p className="mt-0.5 truncate text-[16px] font-medium text-white">{trip.hotelName}</p>
        <p className="mt-1 text-[12.5px] text-white/60">
          {stayRange(trip)} · {trip.nights} night{trip.nights > 1 ? "s" : ""} · Ref {trip.id}
        </p>
      </div>
    </Link>
  );
}
