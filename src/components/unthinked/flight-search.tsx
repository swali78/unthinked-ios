"use client";

import { ArrowUpDown, CalendarDays } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBooking } from "@/lib/booking-store";
import { defaultDepartDate, resolveAirport, toISODate } from "@/lib/data/search";
import { AIRPORTS } from "@/lib/data/seed";
import type { Flight } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { AirportPicker } from "./flight-ui";
import { Chip, SerifAccent } from "./primitives";
import { PrimaryButton, Screen, SectionLabel, Stepper } from "./screen";

const CABINS: Flight["cabin"][] = ["Economy", "Premium", "Business", "First"];

export function FlightSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, ready } = useBooking();
  const saved = ready ? state.search : undefined;
  const [from, setFrom] = useState<string>();
  // ?to=Bali (e.g. from a hotel confirmation) preselects the destination.
  const [to, setTo] = useState<string | undefined>(() => {
    const q = params.get("to");
    return q ? resolveAirport(q) : undefined;
  });
  const [date, setDate] = useState<string | undefined>(() => {
    const d = params.get("date");
    return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined;
  });
  const [pax, setPax] = useState<number>();
  const [cabin, setCabin] = useState<Flight["cabin"]>();
  const [picker, setPicker] = useState<"from" | "to" | null>(null);

  // Prefill from the last search once the session is restored.
  const v = {
    from: from ?? saved?.from ?? state.prefs.homeAirport,
    to: to ?? saved?.to ?? "CAI",
    date: date ?? saved?.date ?? defaultDepartDate(),
    pax: pax ?? saved?.pax ?? 1,
    cabin: cabin ?? saved?.cabin ?? state.prefs.cabin,
  };
  const today = toISODate(new Date());

  const swap = () => {
    setFrom(v.to);
    setTo(v.from);
  };

  const submit = () => {
    const q = new URLSearchParams({ ...v, pax: String(v.pax) });
    router.push(`/flights/results?${q}`);
  };

  return (
    <Screen
      title={
        <>
          Flight <SerifAccent className="text-[19px]">Booking</SerifAccent>
        </>
      }
      back="/"
      footer={
        <PrimaryButton className="w-full" onClick={submit} disabled={v.from === v.to}>
          Search flights
        </PrimaryButton>
      }
      overlay={
        <AirportPicker
          open={picker !== null}
          title={picker === "from" ? "Flying from" : "Flying to"}
          exclude={picker === "from" ? v.to : v.from}
          onClose={() => setPicker(null)}
          onPick={(code) => {
            if (picker === "from") setFrom(code);
            else setTo(code);
            setPicker(null);
          }}
        />
      }
    >
      <h2 className="mb-6 mt-3 px-1 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white">
        Where are you <SerifAccent className="text-white/60">flying to?</SerifAccent>
      </h2>

      {/* Route */}
      <div className="glass relative rounded-[26px]">
        <RouteField label="From" code={v.from} onClick={() => setPicker("from")} />
        <div className="mx-4 h-px bg-white/[0.07]" />
        <RouteField label="To" code={v.to} onClick={() => setPicker("to")} />
        <button
          type="button"
          onClick={swap}
          aria-label="Swap origin and destination"
          className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform active:rotate-180"
        >
          <ArrowUpDown className="size-[18px]" />
        </button>
      </div>
      {v.from === v.to && <p className="mt-2 px-1 text-[13px] text-amber-300/90">Pick a destination different from where you start.</p>}

      {/* Date + travelers */}
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
        <label className="glass relative flex flex-col justify-center rounded-[22px] px-4 py-3">
          <span className="text-[12px] text-white/55">Depart</span>
          <span className="mt-0.5 flex items-center gap-2 text-[16px] text-white">
            <CalendarDays className="size-4 text-white/60" />
            {new Date(`${v.date}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          <input
            type="date"
            min={today}
            value={v.date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]"
            aria-label="Departure date"
          />
        </label>
        <div className="glass flex flex-col justify-center gap-1 rounded-[22px] px-3 py-2">
          <span className="pl-1 text-[12px] text-white/55">Travelers</span>
          <Stepper label="travelers" value={v.pax} min={1} max={9} onChange={setPax} />
        </div>
      </div>

      <SectionLabel className="mt-7">Cabin</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {CABINS.map((c) => (
          <Chip key={c} selected={v.cabin === c} onClick={() => setCabin(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <SectionLabel className="mt-7">Popular from {AIRPORTS[v.from]}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {["CAI", "DPS", "IST", "MLE", "NRT", "LHR"]
          .filter((c) => c !== v.from)
          .map((c) => (
            <Chip key={c} selected={v.to === c} onClick={() => setTo(c)}>
              {AIRPORTS[c]}
            </Chip>
          ))}
      </div>
    </Screen>
  );
}

function RouteField({ label, code, onClick }: { label: string; code: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex w-full flex-col px-4 py-3.5 text-left")}>
      <span className="text-[12px] text-white/55">{label}</span>
      <span className="mt-0.5 flex items-baseline gap-2">
        <span className="text-[24px] font-medium tracking-tight text-white">{AIRPORTS[code]}</span>
        <span className="text-[13px] tabular-nums text-white/50">{code}</span>
      </span>
    </button>
  );
}
