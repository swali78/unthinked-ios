"use client";

import { List, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { usd } from "@/lib/data/booking";
import { cityHotels } from "@/lib/data/hotels";
import type { Hotel } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { checkOutDate, fmtShort, HotelCard, hotelQuery, parseHotelSearch, RatingPill, Stars } from "./hotel-ui";
import { Chip, IconButton, Skeleton, STAGGER } from "./primitives";
import { BottomSheet, PrimaryButton, Screen, SectionLabel, SecondaryButton } from "./screen";
import { StayMap } from "./stay-map";
import { photo } from "@/lib/photo";

type Sort = "recommended" | "price" | "rating";
type Filters = { stars: number[]; maxPrice?: number };
const NO_FILTERS: Filters = { stars: [] };
const PRICE_CAPS = [10000, 20000, 40000] as const;

export function HotelResults() {
  const router = useRouter();
  const params = useSearchParams();
  const search = parseHotelSearch(params);
  const key = hotelQuery(search);

  const [view, setView] = useState<"list" | "map">(params.get("view") === "map" ? "map" : "list");
  const [sort, setSort] = useState<Sort>("recommended");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [draft, setDraft] = useState<Filters>(NO_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [selected, setSelected] = useState<string>();

  const [loadedKey, setLoadedKey] = useState<string>();
  useEffect(() => {
    const t = setTimeout(() => setLoadedKey(key), 450);
    return () => clearTimeout(t);
  }, [key]);
  const loading = loadedKey !== key;

  const all = useMemo(() => cityHotels(search.city), [search.city]);
  const shown = useMemo(() => {
    const list = all.filter(
      (h) => (filters.stars.length === 0 || filters.stars.includes(h.stars)) && (!filters.maxPrice || h.pricePerNight <= filters.maxPrice),
    );
    const by: Record<Sort, (a: Hotel, b: Hotel) => number> = {
      recommended: (a, b) => b.rating * 1000 - b.pricePerNight / 100 - (a.rating * 1000 - a.pricePerNight / 100),
      price: (a, b) => a.pricePerNight - b.pricePerNight,
      rating: (a, b) => b.rating - a.rating,
    };
    return [...list].sort(by[sort]);
  }, [all, filters, sort]);

  const active = filters.stars.length + Number(Boolean(filters.maxPrice));
  const open = (h: Hotel) => router.push(`/hotels/detail?${hotelQuery(search, { id: h.id })}`);
  const pinned = shown.find((h) => h.id === selected) ?? shown[0];

  return (
    <Screen
      title={
        <span className="flex flex-col leading-tight">
          <span>{search.city}</span>
          <span className="text-[12px] text-white/50">
            {fmtShort(search.checkIn)} – {fmtShort(checkOutDate(search))} · {search.guests} guest{search.guests > 1 ? "s" : ""}
          </span>
        </span>
      }
      back="/hotels"
      right={
        <IconButton
          label={`Filters${active ? `, ${active} active` : ""}`}
          onClick={() => {
            setDraft(filters);
            setSheet(true);
          }}
          className="relative"
        >
          <SlidersHorizontal className="size-[18px]" />
          {active > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-black">
              {active}
            </span>
          )}
        </IconButton>
      }
      bodyClassName={view === "map" ? "px-0 pb-0 overflow-hidden" : undefined}
      overlay={
        <BottomSheet
          open={sheet}
          onClose={() => setSheet(false)}
          title="Filters"
          footer={
            <div className="grid grid-cols-[auto_1fr] gap-2">
              <SecondaryButton onClick={() => setDraft(NO_FILTERS)}>Clear</SecondaryButton>
              <PrimaryButton
                onClick={() => {
                  setFilters(draft);
                  setSheet(false);
                }}
              >
                Show stays
              </PrimaryButton>
            </div>
          }
        >
          <SectionLabel>Hotel class</SectionLabel>
          <div className="flex gap-2">
            {[3, 4, 5].map((s) => (
              <Chip
                key={s}
                selected={draft.stars.includes(s)}
                onClick={() =>
                  setDraft({ ...draft, stars: draft.stars.includes(s) ? draft.stars.filter((x) => x !== s) : [...draft.stars, s] })
                }
              >
                {s} stars
              </Chip>
            ))}
          </div>
          <SectionLabel className="mt-6">Price per night</SectionLabel>
          <div className="flex flex-wrap gap-2">
            <Chip selected={!draft.maxPrice} onClick={() => setDraft({ ...draft, maxPrice: undefined })}>
              Any price
            </Chip>
            {PRICE_CAPS.map((c) => (
              <Chip key={c} selected={draft.maxPrice === c} onClick={() => setDraft({ ...draft, maxPrice: c })}>
                Up to {usd(c)}
              </Chip>
            ))}
          </div>
        </BottomSheet>
      }
    >
      {/* List / Map + sort */}
      <div className={cn("flex items-center justify-between gap-2", view === "map" && "absolute inset-x-4 top-2 z-10")}>
        <div className="glass-thin flex rounded-full p-1" role="tablist" aria-label="View">
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                view === v ? "bg-white text-black" : "text-white/75",
              )}
            >
              {v === "list" ? <List className="size-4" /> : <MapIcon className="size-4" />}
              {v === "list" ? "List" : "Map"}
            </button>
          ))}
        </div>
        {view === "list" && (
          <select
            aria-label="Sort stays"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="glass-thin h-11 appearance-none rounded-full bg-transparent px-4 text-[13px] text-white [color-scheme:dark] focus:outline-none"
          >
            <option value="recommended">Recommended</option>
            <option value="price">Lowest price</option>
            <option value="rating">Top rated</option>
          </select>
        )}
      </div>

      {view === "list" ? (
        <div className="mt-4 space-y-3" aria-busy={loading}>
          <p className="px-1 text-[13px] text-white/55">
            {loading ? "Finding stays…" : `${shown.length} stay${shown.length === 1 ? "" : "s"} in ${search.city}`}
          </p>
          {loading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-[300px] w-full rounded-[26px]" />)
          ) : shown.length === 0 ? (
            <Empty
              title={all.length ? "No stays match these filters" : `No stays in ${search.city} yet`}
              body={all.length ? `${all.length} stays are hidden by your filters.` : "Try Bali, Santorini, Tokyo or Istanbul."}
              action={all.length ? "Clear filters" : "Change destination"}
              onAction={() => (all.length ? setFilters(NO_FILTERS) : router.push("/hotels"))}
            />
          ) : (
            shown.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: STAGGER[Math.min(i, STAGGER.length - 1)], ease: [0.23, 1, 0.32, 1] }}
              >
                <HotelCard hotel={h} nights={search.nights} onOpen={() => open(h)} />
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="absolute inset-0">
          <StayMap hotels={shown} selected={pinned?.id} onSelect={setSelected} className="size-full" />
          <AnimatePresence mode="wait">
            {pinned && (
              <motion.button
                key={pinned.id}
                type="button"
                onClick={() => open(pinned)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16, transition: { duration: 0.16 } }}
                transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                className="glass absolute inset-x-4 bottom-4 flex gap-3 rounded-[24px] p-2.5 text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img {...photo(pinned.image, 88, 88)} alt="" className="size-[88px] shrink-0 rounded-[18px] object-cover" />
                <span className="flex min-w-0 flex-1 flex-col justify-between py-1 pr-1">
                  <span>
                    <span className="flex items-center gap-2">
                      <Stars n={pinned.stars} />
                      <RatingPill rating={pinned.rating} className="px-1.5 py-0.5" />
                    </span>
                    <span className="mt-1 block truncate text-[16px] font-medium text-white">{pinned.name}</span>
                    <span className="block truncate text-[12px] text-white/55">{pinned.area}</span>
                  </span>
                  <span className="text-[12px] text-white/55">
                    <span className="text-[16px] font-semibold tabular-nums text-white">{usd(pinned.pricePerNight)}</span> / night
                  </span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
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
