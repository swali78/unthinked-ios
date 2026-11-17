"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo } from "react";
import { EXIT_ROWS, type Seat, seatFee, seatMap, usd } from "@/lib/data/booking";
import { cn } from "@/lib/utils";
import { SerifAccent } from "./primitives";
import { PrimaryButton, Screen } from "./screen";
import { FlowLoading, NoFlightSelected, useSelectedFlight } from "./use-selected-flight";

export function SeatSelection() {
  const router = useRouter();
  const { flight, search, state, ready, update } = useSelectedFlight();
  const seats = useMemo(() => (flight ? seatMap(flight.id) : []), [flight]);
  if (!ready) return <FlowLoading />;
  if (!flight || !search) return <NoFlightSelected />;

  const chosen = state.seats;
  const byId = new Map(seats.map((s) => [s.id, s]));
  const fees = chosen.reduce((sum, id) => sum + (byId.get(id) ? seatFee(byId.get(id)!, state.fare) : 0), 0);
  const rows = [...new Set(seats.map((s) => s.row))];

  const toggle = (seat: Seat) => {
    if (seat.taken) return;
    if (chosen.includes(seat.id)) update({ seats: chosen.filter((s) => s !== seat.id) });
    // Full: replace the earliest pick, like most airline apps.
    else update({ seats: [...(chosen.length >= search.pax ? chosen.slice(1) : chosen), seat.id] });
  };

  return (
    <Screen
      title={
        <>
          Choose <SerifAccent className="text-[19px]">your seat</SerifAccent>
        </>
      }
      footer={
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-white/55">
              {chosen.length}/{search.pax} selected{chosen.length ? ` · ${chosen.join(", ")}` : ""}
            </p>
            <p className="text-[18px] font-semibold tabular-nums text-white">{fees ? `+${usd(fees)}` : "No seat fees"}</p>
          </div>
          {chosen.length === search.pax ? (
            <PrimaryButton onClick={() => router.push("/flights/passengers")}>Continue</PrimaryButton>
          ) : (
            <button
              type="button"
              onClick={() => {
                update({ seats: [] });
                router.push("/flights/passengers");
              }}
              className="glass-thin h-[52px] rounded-full px-5 text-[14px] text-white/85"
            >
              Assign at check-in
            </button>
          )}
        </div>
      }
    >
      <p className="mb-4 mt-1 px-1 text-[13px] text-white/55">
        {flight.flightNumber} · Pick {search.pax} seat{search.pax > 1 ? "s" : ""}. Your {state.fare} fare{" "}
        {state.fare === "flex" ? "includes every seat." : state.fare === "classic" ? "includes standard seats." : "charges for seat selection."}
      </p>

      <Legend fare={state.fare} />

      {/* Fuselage */}
      <div className="mx-auto mt-4 w-full max-w-[310px] rounded-t-[140px] rounded-b-[40px] bg-gradient-to-b from-[#1f1f22] to-[#151517] px-4 pb-6 pt-24 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
        <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_24px_repeat(3,minmax(0,1fr))] gap-x-1.5 gap-y-2 text-center">
          {["A", "B", "C", "", "D", "E", "F"].map((l, i) => (
            <span key={i} className="text-[11px] text-white/40">
              {l}
            </span>
          ))}
          {rows.map((row) => (
            <Fragment key={row}>
              {EXIT_ROWS[0] === row && (
                <div className="col-span-7 my-1 flex items-center justify-between text-[10px] text-emerald-300/70">
                  <span>◀ Exit</span>
                  <span>Exit ▶</span>
                </div>
              )}
              {seats
                .filter((s) => s.row === row)
                .map((s, i) => (
                  <Fragment key={s.id}>
                    {i === 3 && <span className="flex items-center justify-center text-[10.5px] tabular-nums text-white/35">{row}</span>}
                    <SeatButton seat={s} selected={chosen.includes(s.id)} fee={seatFee(s, state.fare)} onClick={() => toggle(s)} />
                  </Fragment>
                ))}
            </Fragment>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function SeatButton({ seat, selected, fee, onClick }: { seat: Seat; selected: boolean; fee: number; onClick: () => void }) {
  const label = `Seat ${seat.id}, ${seat.taken ? "taken" : `${seat.kind === "legroom" ? "extra legroom, " : ""}${fee ? usd(fee) : "free"}`}`;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={seat.taken}
      aria-pressed={selected}
      aria-label={label}
      className={cn(
        "aspect-[1/1.08] rounded-t-[10px] rounded-b-[6px] text-[10px] font-medium transition-[transform,background] active:scale-[0.96]",
        seat.taken && "bg-white/[0.04] text-[13px] text-white/20",
        !seat.taken && !selected && seat.kind === "legroom" && "bg-emerald-400/20 text-emerald-200 shadow-[inset_0_0_0_1px_rgb(110_231_183/0.35)]",
        !seat.taken && !selected && seat.kind === "front" && "bg-sky-400/15 text-sky-200 shadow-[inset_0_0_0_1px_rgb(125_211_252/0.3)]",
        !seat.taken && !selected && seat.kind === "standard" && "bg-white/[0.14] text-white/70 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
        selected && "bg-white text-black",
      )}
    >
      {selected ? seat.id : seat.taken ? "×" : fee ? `$${fee / 100}` : ""}
    </button>
  );
}

function Legend({ fare }: { fare: string }) {
  const item = (cls: string, text: string) => (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-3.5 rounded-[4px]", cls)} /> {text}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 px-1 text-[12px] text-white/60">
      {item("bg-white/[0.14]", fare === "light" ? "Standard" : "Standard (free)")}
      {item("bg-sky-400/30", "Front rows")}
      {item("bg-emerald-400/30", "Extra legroom")}
      {item("bg-white/[0.05]", "Taken")}
      {item("bg-white", "Yours")}
    </div>
  );
}
