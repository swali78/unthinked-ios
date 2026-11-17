"use client";

import { Briefcase, Check, Luggage, Plane, RefreshCw, Armchair, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FARES, type FareId, farePrice, fmtDay, fmtDur, fmtTime, usd } from "@/lib/data/booking";
import { AIRPORTS } from "@/lib/data/seed";
import type { Flight } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { AirlineMark } from "./flight-ui";
import { SerifAccent } from "./primitives";
import { PrimaryButton, Screen, SectionLabel } from "./screen";
import { FlowLoading, NoFlightSelected, useSelectedFlight } from "./use-selected-flight";

export function FlightDetails() {
  const router = useRouter();
  const { flight, search, state, ready, update } = useSelectedFlight();
  if (!ready) return <FlowLoading />;
  if (!flight || !search) return <NoFlightSelected />;

  const total = farePrice(flight, state.fare) * search.pax;

  return (
    <Screen
      title={
        <>
          Flight <SerifAccent className="text-[19px]">details</SerifAccent>
        </>
      }
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-white/55">
              {search.pax} traveler{search.pax > 1 ? "s" : ""} · {FARES.find((f) => f.id === state.fare)?.name}
            </p>
            <p className="text-[22px] font-semibold tabular-nums tracking-tight text-white">{usd(total)}</p>
          </div>
          <PrimaryButton onClick={() => router.push("/flights/seats")}>Choose seats</PrimaryButton>
        </div>
      }
    >
      <Timeline flight={flight} />

      <SectionLabel className="mt-7">Choose a fare</SectionLabel>
      <div role="radiogroup" aria-label="Fare" className="space-y-2.5">
        {FARES.map((fare) => {
          const on = state.fare === fare.id;
          return (
            <button
              key={fare.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => update({ fare: fare.id as FareId, seats: [] })}
              className={cn(
                "glass w-full rounded-[22px] p-4 text-left transition-[box-shadow,transform] active:scale-[0.99]",
                on && "shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.85)]",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border",
                      on ? "border-white bg-white text-black" : "border-white/30",
                    )}
                  >
                    {on && <Check className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="text-[17px] font-medium text-white">{fare.name}</span>
                  {fare.id === "classic" && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/80">Popular</span>}
                </span>
                <span className="text-[17px] font-semibold tabular-nums text-white">{usd(farePrice(flight, fare.id))}</span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                <Perk icon={Briefcase} text={`Cabin ${fare.cabinBag}`} ok />
                <Perk icon={Luggage} text={fare.checkedBag} ok={fare.checkedBag !== "Not included"} />
                <Perk icon={Armchair} text={fare.seat} ok={fare.id !== "light"} />
                <Perk icon={RefreshCw} text={`Changes: ${fare.changes}`} ok={fare.changes !== "Not allowed"} />
              </ul>
              <p className="mt-2 text-[12px] text-white/45">{fare.refund}</p>
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

function Perk({ icon: Icon, text, ok }: { icon: typeof Plane; text: string; ok: boolean }) {
  return (
    <li className={cn("flex items-center gap-1.5", ok ? "text-white/85" : "text-white/40")}>
      {ok ? <Icon className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
      <span className={cn(!ok && "line-through decoration-white/30")}>{text}</span>
    </li>
  );
}

function Timeline({ flight: f }: { flight: Flight }) {
  // Split a 1-stop flight into two legs with a layover.
  const legs = f.stops
    ? (() => {
        const layover = 75 + (f.durationMin % 60);
        const first = Math.round((f.durationMin - layover) * 0.45);
        const second = f.durationMin - layover - first;
        const t0 = new Date(f.departAt).getTime();
        const a1 = new Date(t0 + first * 60000).toISOString();
        const d2 = new Date(t0 + (first + layover) * 60000).toISOString();
        return [
          { from: f.from, to: f.via!, dep: f.departAt, arr: a1, dur: first },
          { layover, at: f.via! },
          { from: f.via!, to: f.to, dep: d2, arr: f.arriveAt, dur: second },
        ];
      })()
    : [{ from: f.from, to: f.to, dep: f.departAt, arr: f.arriveAt, dur: f.durationMin }];

  return (
    <section className="glass mt-3 rounded-[26px] p-4" aria-label="Itinerary">
      <div className="flex items-center gap-3">
        <AirlineMark code={f.airline.code} size="lg" />
        <div>
          <p className="text-[16px] font-medium text-white">{f.airline.name}</p>
          <p className="text-[12.5px] text-white/55">
            {f.flightNumber} · {fmtDay(f.departAt)} · {fmtDur(f.durationMin)}
          </p>
        </div>
      </div>
      <ol className="mt-5 space-y-0">
        {legs.map((leg, i) =>
          "layover" in leg ? (
            <li key={i} className="my-3 ml-[7px] border-l border-dashed border-white/20 py-2 pl-5 text-[12.5px] text-amber-200/85">
              {fmtDur(leg.layover ?? 0)} layover in {AIRPORTS[leg.at ?? ""] ?? leg.at}
            </li>
          ) : (
            <li key={i} className="relative grid grid-cols-[16px_1fr] gap-x-4">
              <span className="mt-1.5 size-[15px] rounded-full border-2 border-white bg-[#0b0b0c]" />
              <div className="flex justify-between">
                <span className="text-[15px] text-white">
                  {AIRPORTS[leg.from!]} <span className="text-white/45">{leg.from}</span>
                </span>
                <span className="text-[15px] font-medium tabular-nums text-white">{fmtTime(leg.dep!)}</span>
              </div>
              <span className="mx-auto my-1 h-10 w-px bg-white/25" />
              <span className="flex items-center gap-1.5 text-[12px] text-white/50">
                <Plane className="size-3 rotate-[135deg]" /> {fmtDur(leg.dur!)} · {f.cabin}
              </span>
              <span className="mt-1.5 size-[15px] rounded-full bg-white" />
              <div className="flex justify-between">
                <span className="text-[15px] text-white">
                  {AIRPORTS[leg.to!] ?? leg.to} <span className="text-white/45">{leg.to}</span>
                </span>
                <span className="text-[15px] font-medium tabular-nums text-white">{fmtTime(leg.arr!)}</span>
              </div>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}
