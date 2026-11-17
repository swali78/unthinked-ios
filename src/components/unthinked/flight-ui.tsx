"use client";

import { Plane, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { fmtDay, fmtDur, fmtTime, usd } from "@/lib/data/booking";
import { AIRPORTS } from "@/lib/data/seed";
import type { Flight } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./screen";

/** One flight as a tappable glass card. Used in results and in chat. */
export function FlightCard({
  flight: f,
  badge,
  selected,
  onClick,
  priceLabel,
}: {
  flight: Flight;
  badge?: string;
  selected?: boolean;
  onClick?: () => void;
  priceLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "glass w-full rounded-[22px] p-4 text-left transition-[transform,box-shadow] duration-200 active:scale-[0.985]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
        selected && "shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.85)]",
      )}
    >
      <div className="flex items-center justify-between text-[12px] text-white/55">
        <span className="flex items-center gap-2">
          <AirlineMark code={f.airline.code} />
          {f.airline.name}
        </span>
        {badge ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/85">{badge}</span>
        ) : f.seatsLeft <= 3 ? (
          <span className="text-amber-300/90">{f.seatsLeft === 1 ? "Last seat" : `${f.seatsLeft} seats left`}</span>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div>
          <p className="text-[22px] font-medium tabular-nums leading-none tracking-tight text-white">{fmtTime(f.departAt)}</p>
          <p className="mt-1 text-[12px] text-white/55">{f.from}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 text-[11px] text-white/50">
          <span>{fmtDur(f.durationMin)}</span>
          <span className="relative flex w-full items-center">
            <span className="h-px flex-1 bg-white/20" />
            <Plane className="mx-1 size-3.5 rotate-45 text-white/70" />
            <span className="h-px flex-1 bg-white/20" />
          </span>
          <span>{f.stops ? `1 stop · ${f.via}` : "Nonstop"}</span>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-medium tabular-nums leading-none tracking-tight text-white">
            {fmtTime(f.arriveAt)}
            {new Date(f.arriveAt).getDate() !== new Date(f.departAt).getDate() && (
              <sup className="ml-0.5 text-[11px] font-normal text-white/55" aria-label="arrives next day">+1</sup>
            )}
          </p>
          <p className="mt-1 text-[12px] text-white/55">{f.to}</p>
        </div>
      </div>
      <div className="mt-3 flex items-baseline justify-between border-t border-white/[0.07] pt-3">
        <span className="text-[12px] text-white/50">
          {fmtDay(f.departAt)} · {f.cabin}
        </span>
        <span className="text-[17px] font-semibold tabular-nums text-white">
          {priceLabel && <span className="mr-1 text-[11.5px] font-normal text-white/50">{priceLabel}</span>}
          {usd(f.price)}
        </span>
      </div>
    </button>
  );
}

export function AirlineMark({ code, size = "sm" }: { code: string; size?: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-white/10 font-semibold text-white",
        size === "sm" ? "size-6 text-[9.5px]" : "size-11 text-[13px]",
      )}
    >
      {code}
    </span>
  );
}

/** Searchable airport list in a bottom sheet. */
export function AirportPicker({
  open,
  title,
  onClose,
  onPick,
  exclude,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onPick: (code: string) => void;
  exclude?: string;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return Object.entries(AIRPORTS)
      .filter(([code]) => code !== exclude)
      .filter(([code, city]) => !s || code.toLowerCase().includes(s) || city.toLowerCase().includes(s))
      .sort((a, b) => a[1].localeCompare(b[1]));
  }, [q, exclude]);

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <label className="glass-thin mb-3 flex h-11 items-center gap-2 rounded-full px-4">
        <Search className="size-4 text-white/50" />
        <span className="sr-only">Search airports</span>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="City or airport code"
          className="h-full flex-1 bg-transparent text-[15px] text-white placeholder:text-white/40 focus:outline-none"
        />
      </label>
      {list.length === 0 ? (
        <p className="py-8 text-center text-[14px] text-white/55">No airports match “{q}”. Try a city name.</p>
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {list.map(([code, city]) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => {
                  onPick(code);
                  setQ("");
                }}
                className="flex w-full items-center justify-between py-3.5 text-left"
              >
                <span className="text-[15.5px] text-white">{city}</span>
                <span className="text-[13px] tabular-nums text-white/50">{code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
