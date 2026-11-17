"use client";

import { SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type FlightSearch, useBooking } from "@/lib/booking-store";
import { usd } from "@/lib/data/booking";
import { defaultDepartDate, priceCalendar, searchFlights } from "@/lib/data/search";
import { AIRPORTS } from "@/lib/data/seed";
import type { Flight } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { FlightCard } from "./flight-ui";
import { Chip, IconButton, Skeleton, STAGGER } from "./primitives";
import { BottomSheet, PrimaryButton, Screen, SectionLabel, SecondaryButton } from "./screen";

type Sort = "cheapest" | "fastest" | "earliest";
type Filters = { nonstop: boolean; airlines: string[]; window: "any" | "morning" | "afternoon" | "evening" };
const NO_FILTERS: Filters = { nonstop: false, airlines: [], window: "any" };
const WINDOWS = { any: [0, 24], morning: [5, 12], afternoon: [12, 18], evening: [18, 24] } as const;

export function FlightResults() {
  const router = useRouter();
  const params = useSearchParams();
  const { update } = useBooking();

  const search: FlightSearch = {
    from: params.get("from") ?? "DXB",
    to: params.get("to") ?? "CAI",
    date: params.get("date") ?? defaultDepartDate(),
    pax: Math.max(1, Number(params.get("pax")) || 1),
    cabin: (params.get("cabin") as Flight["cabin"]) ?? "Economy",
  };
  const key = `${search.from}-${search.to}-${search.date}-${search.cabin}`;

  const [sort, setSort] = useState<Sort>("cheapest");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);

  // Brief simulated latency so the skeletons are part of the experience.
  const [loadedKey, setLoadedKey] = useState<string>();
  useEffect(() => {
    const t = setTimeout(() => setLoadedKey(key), 450);
    return () => clearTimeout(t);
  }, [key]);
  const loading = loadedKey !== key;

  const result = useMemo(() => searchFlights(search), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const calendar = useMemo(() => priceCalendar(search), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const airlines = useMemo(
    () => [...new Map(result.flights.map((f) => [f.airline.code, f.airline.name])).entries()],
    [result],
  );

  const shown = useMemo(() => {
    const [lo, hi] = WINDOWS[filters.window];
    const list = result.flights.filter((f) => {
      const h = new Date(f.departAt).getHours();
      return (
        (!filters.nonstop || f.stops === 0) &&
        (filters.airlines.length === 0 || filters.airlines.includes(f.airline.code)) &&
        h >= lo &&
        h < hi
      );
    });
    const by: Record<Sort, (a: Flight, b: Flight) => number> = {
      cheapest: (a, b) => a.price - b.price,
      fastest: (a, b) => a.durationMin - b.durationMin,
      earliest: (a, b) => +new Date(a.departAt) - +new Date(b.departAt),
    };
    return [...list].sort(by[sort]);
  }, [result, filters, sort]);

  const cheapestId = result.flights.reduce<Flight | undefined>((m, f) => (!m || f.price < m.price ? f : m), undefined)?.id;
  const fastestId = result.flights.reduce<Flight | undefined>((m, f) => (!m || f.durationMin < m.durationMin ? f : m), undefined)?.id;
  const activeFilters = Number(filters.nonstop) + filters.airlines.length + Number(filters.window !== "any");

  const setDate = (date: string) => {
    const q = new URLSearchParams({ ...search, date, pax: String(search.pax) });
    router.replace(`/flights/results?${q}`, { scroll: false });
  };

  const pick = (f: Flight) => {
    update({ search, flightId: f.id, fare: "classic", seats: [], passengers: [] });
    router.push("/flights/details");
  };

  // Keep the selected day centred in the strip.
  const stripRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    stripRef.current?.querySelector("[aria-current]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [search.date]);

  const minDay = Math.min(...calendar.map((c) => c.min ?? Infinity));

  return (
    <Screen
      title={
        <span className="tabular-nums">
          {search.from} <span className="text-white/40">→</span> {search.to}
        </span>
      }
      back="/flights"
      right={
        <IconButton label={`Filters${activeFilters ? `, ${activeFilters} active` : ""}`} onClick={() => { setDraft(filters); setSheet(true); }} className="relative">
          <SlidersHorizontal className="size-[18px]" />
          {activeFilters > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">
              {activeFilters}
            </span>
          )}
        </IconButton>
      }
      overlay={
        <BottomSheet
          open={sheet}
          onClose={() => setSheet(false)}
          title="Filters"
          footer={
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <SecondaryButton onClick={() => setDraft(NO_FILTERS)}>Clear</SecondaryButton>
              <PrimaryButton onClick={() => { setFilters(draft); setSheet(false); }}>Show flights</PrimaryButton>
            </div>
          }
        >
          <SectionLabel>Stops</SectionLabel>
          <div className="flex gap-2">
            <Chip selected={!draft.nonstop} onClick={() => setDraft({ ...draft, nonstop: false })}>Any</Chip>
            <Chip selected={draft.nonstop} onClick={() => setDraft({ ...draft, nonstop: true })}>Nonstop only</Chip>
          </div>
          <SectionLabel className="mt-6">Departure time</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(["any", "morning", "afternoon", "evening"] as const).map((w) => (
              <Chip key={w} selected={draft.window === w} onClick={() => setDraft({ ...draft, window: w })}>
                {w === "any" ? "Any time" : `${w[0].toUpperCase()}${w.slice(1)} ${WINDOWS[w][0]}–${WINDOWS[w][1]}h`}
              </Chip>
            ))}
          </div>
          <SectionLabel className="mt-6">Airlines</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {airlines.map(([code, name]) => (
              <Chip
                key={code}
                selected={draft.airlines.includes(code)}
                onClick={() =>
                  setDraft({
                    ...draft,
                    airlines: draft.airlines.includes(code) ? draft.airlines.filter((a) => a !== code) : [...draft.airlines, code],
                  })
                }
              >
                {name}
              </Chip>
            ))}
          </div>
        </BottomSheet>
      }
    >
      <p className="mb-3 px-1 text-[13px] text-white/55">
        {AIRPORTS[search.from]} to {AIRPORTS[search.to]} · {search.pax} traveler{search.pax > 1 ? "s" : ""} · {search.cabin}
      </p>

      {/* Price calendar strip */}
      <ul ref={stripRef} aria-label="Prices by date" className="-mx-4 flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none]">
        {calendar.map((c) => {
          const active = c.date === search.date;
          const d = new Date(`${c.date}T00:00:00`);
          return (
            <li key={c.date} className="snap-start">
              <button
                type="button"
                aria-current={active ? "date" : undefined}
                onClick={() => setDate(c.date)}
                className={cn(
                  "flex w-[64px] flex-col items-center rounded-[18px] py-2.5 transition-colors",
                  active ? "bg-white text-black" : "glass-thin text-white",
                )}
              >
                <span className={cn("text-[11px]", active ? "text-black/60" : "text-white/50")}>
                  {d.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span className="text-[17px] font-medium tabular-nums leading-tight">{d.getDate()}</span>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    active ? "text-black/70" : c.min === minDay ? "text-emerald-300" : "text-white/55",
                  )}
                >
                  {c.min ? usd(c.min) : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Sort */}
      <div className="mt-4 flex gap-2" role="radiogroup" aria-label="Sort flights">
        {(["cheapest", "fastest", "earliest"] as const).map((s) => (
          <Chip key={s} role="radio" aria-checked={sort === s} selected={sort === s} onClick={() => setSort(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </Chip>
        ))}
      </div>

      <div className="mt-4 space-y-2.5" aria-busy={loading}>
        {loading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[142px] w-full rounded-[22px]" />)
        ) : result.error ? (
          <Empty title="We couldn't search that route" body={result.error} action="Change search" onAction={() => router.push("/flights")} />
        ) : shown.length === 0 ? (
          <Empty
            title="No flights match these filters"
            body={`${result.flights.length} flights are hidden by your filters.`}
            action="Clear filters"
            onAction={() => setFilters(NO_FILTERS)}
          />
        ) : (
          shown.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: STAGGER[Math.min(i, STAGGER.length - 1)], ease: [0.23, 1, 0.32, 1] }}
            >
              <FlightCard
                flight={f}
                onClick={() => pick(f)}
                badge={f.id === cheapestId ? "Cheapest" : f.id === fastestId ? "Fastest" : undefined}
                priceLabel="from"
              />
            </motion.div>
          ))
        )}
      </div>
    </Screen>
  );
}

function Empty({ title, body, action, onAction }: { title: string; body: string; action: string; onAction: () => void }) {
  return (
    <div className="glass flex flex-col items-center rounded-[24px] px-6 py-10 text-center">
      <p className="text-[17px] font-medium text-white">{title}</p>
      <p className="mt-1.5 max-w-[30ch] text-[14px] text-white/60">{body}</p>
      <PrimaryButton className="mt-5 h-11 text-[15px]" onClick={onAction}>
        {action}
      </PrimaryButton>
    </div>
  );
}
