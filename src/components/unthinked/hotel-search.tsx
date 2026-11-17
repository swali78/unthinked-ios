"use client";

import { CalendarDays, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HOTEL_CITIES } from "@/lib/data/hotels";
import { defaultDepartDate, toISODate } from "@/lib/data/search";
import { useBooking } from "@/lib/booking-store";
import { checkOutDate, fmtShort, hotelQuery } from "./hotel-ui";
import { Chip, SerifAccent } from "./primitives";
import { PrimaryButton, Screen, SectionLabel, Stepper } from "./screen";

export function HotelSearch() {
  const router = useRouter();
  const { state, ready } = useBooking();
  const saved = ready ? state.stay : undefined;
  const [city, setCity] = useState<string>();
  const [checkIn, setCheckIn] = useState<string>();
  const [nights, setNights] = useState<number>();
  const [guests, setGuests] = useState<number>();

  const v = {
    city: city ?? saved?.city ?? "Bali",
    checkIn: checkIn ?? saved?.checkIn ?? defaultDepartDate(),
    nights: nights ?? saved?.nights ?? 3,
    guests: guests ?? saved?.guests ?? 2,
  };

  return (
    <Screen
      title={
        <>
          Hotel <SerifAccent className="text-[19px]">Stays</SerifAccent>
        </>
      }
      back="/"
      footer={
        <PrimaryButton className="w-full" onClick={() => router.push(`/hotels/results?${hotelQuery(v)}`)}>
          Search stays
        </PrimaryButton>
      }
    >
      <h2 className="mb-6 mt-3 px-1 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white">
        Where will you <SerifAccent className="text-white/60">rest your head?</SerifAccent>
      </h2>

      <label className="glass flex flex-col rounded-[26px] px-4 py-3.5">
        <span className="text-[12px] text-white/55">Destination</span>
        <span className="mt-0.5 flex items-center gap-2">
          <MapPin className="size-4 text-white/60" />
          <select
            value={v.city}
            onChange={(e) => setCity(e.target.value)}
            className="flex-1 appearance-none bg-transparent text-[22px] font-medium tracking-tight text-white [color-scheme:dark] focus:outline-none"
          >
            {HOTEL_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </span>
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="glass relative flex flex-col justify-center rounded-[22px] px-4 py-3">
          <span className="text-[12px] text-white/55">Check-in</span>
          <span className="mt-0.5 flex items-center gap-2 text-[16px] text-white">
            <CalendarDays className="size-4 text-white/60" />
            {fmtShort(v.checkIn)}
          </span>
          <input
            type="date"
            min={toISODate(new Date())}
            value={v.checkIn}
            onChange={(e) => e.target.value && setCheckIn(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]"
            aria-label="Check-in date"
          />
        </label>
        <div className="glass flex flex-col justify-center rounded-[22px] px-4 py-3">
          <span className="text-[12px] text-white/55">Check-out</span>
          <span className="mt-0.5 text-[16px] text-white">{fmtShort(checkOutDate(v))}</span>
        </div>
      </div>

      <div className="glass mt-3 divide-y divide-white/[0.07] rounded-[22px]">
        <Row label="Nights">
          <Stepper label="nights" value={v.nights} min={1} max={30} onChange={setNights} />
        </Row>
        <Row label="Guests">
          <Stepper label="guests" value={v.guests} min={1} max={8} onChange={setGuests} />
        </Row>
      </div>

      <SectionLabel className="mt-7">Popular right now</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {["Bali", "Santorini", "Maldives", "Tokyo", "Istanbul", "Cairo"].map((c) => (
          <Chip key={c} selected={v.city === c} onClick={() => setCity(c)}>
            {c}
          </Chip>
        ))}
      </div>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 pl-4 pr-2">
      <span className="text-[15px] text-white">{label}</span>
      {children}
    </div>
  );
}
