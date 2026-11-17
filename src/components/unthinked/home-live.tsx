"use client";

import { CalendarDays, Plane, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { tripEnd, tripStart, useBooking } from "@/lib/booking-store";
import { fmtDay } from "@/lib/data/booking";
import { AIRPORTS, DESTINATIONS } from "@/lib/data/seed";
import { stageOf } from "@/lib/data/visa";
import { SerifAccent, Skeleton } from "./primitives";
import { flightImage, stayRange } from "./trip-ui";
import { photo } from "@/lib/photo";

/** "Hey {name}!" from the profile. */
export function Greeting() {
  const { state, ready } = useBooking();
  return <SerifAccent>Hey {ready ? state.prefs.name : "there"}!</SerifAccent>;
}

/** Sends first-time visitors to the welcome screens. */
export function OnboardingGate() {
  const { state, ready } = useBooking();
  const router = useRouter();
  useEffect(() => {
    if (ready && !state.onboarded) router.replace("/welcome");
  }, [ready, state.onboarded, router]);
  return null;
}

/** The next booked trip, or an invitation to plan one. */
export function NextTrip() {
  const { state, ready } = useBooking();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!ready) return <Skeleton className="h-[176px] w-full rounded-[26px]" />;

  const next = state.trips.filter((t) => tripEnd(t) >= now).sort((a, b) => tripStart(a) - tripStart(b))[0];

  if (!next) {
    const img = DESTINATIONS.find((d) => d.id === "cai")!.image;
    return (
      <Card href="/plan" image={img}>
        <div>
          <p className="text-[24px] font-medium leading-none tracking-tight text-white">
            Plan your <SerifAccent className="text-white/75">next escape</SerifAccent>
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-white/75">
            <Sparkles className="size-3.5" /> Six questions and we&apos;ll find the flights
          </p>
        </div>
      </Card>
    );
  }

  const country = next.kind === "flight" ? DESTINATIONS.find((d) => d.airport === next.flight.to)?.country : next.country;
  const visa = state.visaApps.find((a) => a.destination === country);
  const visaStage = visa ? stageOf(visa, now) : undefined;

  return (
    <Card href={`/wallet?pass=${next.id}`} image={next.kind === "flight" ? flightImage(next) : next.image}>
      <div>
        <p className="text-[24px] font-medium leading-none tracking-tight text-white">
          {next.kind === "flight" ? AIRPORTS[next.flight.to] ?? next.flight.to : next.city}{" "}
          <SerifAccent className="text-white/75">{next.kind === "flight" ? "by air" : "stay"}</SerifAccent>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-white/75">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" /> {next.kind === "flight" ? fmtDay(next.flight.departAt) : stayRange(next)}
          </span>
          {next.kind === "flight" ? (
            <span className="flex items-center gap-1">
              <Plane className="size-3.5" /> {next.flight.flightNumber} · {next.flight.from} → {next.flight.to}
            </span>
          ) : (
            <span>{next.hotelName}</span>
          )}
        </p>
      </div>
      {visaStage && (
        <span className={`glass-thin shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-medium ${visaStage === "Approved" ? "text-emerald-300" : "text-white/80"}`}>
          eVisa {visaStage.toLowerCase()}
        </span>
      )}
    </Card>
  );
}

function Card({ href, image, children }: { href: string; image: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="relative block h-[176px] overflow-hidden rounded-[26px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...photo(image, 400, 176)} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">{children}</div>
    </Link>
  );
}
