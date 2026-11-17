"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { tripEnd, tripStart, useBooking } from "@/lib/booking-store";
import { stageOf } from "@/lib/data/visa";
import { cn } from "@/lib/utils";
import { SerifAccent, Skeleton } from "./primitives";
import { PrimaryLink, SectionLabel } from "./screen";
import { TabScreen } from "./tab-screen";
import { TripCard } from "./trip-ui";

export function TripsScreen() {
  const { state, ready } = useBooking();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const upcoming = state.trips.filter((t) => tripEnd(t) >= now).sort((a, b) => tripStart(a) - tripStart(b));
  const past = state.trips.filter((t) => tripEnd(t) < now).sort((a, b) => tripStart(b) - tripStart(a));
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <TabScreen
      title={
        <>
          Your <SerifAccent>trips</SerifAccent>
        </>
      }
    >
      <div className="glass-thin mb-5 grid grid-cols-2 rounded-full p-1" role="tablist" aria-label="Trips">
        {(["upcoming", "past"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("h-10 rounded-full text-[14px] font-medium transition-colors", tab === t ? "bg-white text-black" : "text-white/70")}
          >
            {t === "upcoming" ? `Upcoming${ready && upcoming.length ? ` · ${upcoming.length}` : ""}` : "Past"}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="space-y-3">
          <Skeleton className="h-[140px] w-full rounded-[24px]" />
          <Skeleton className="h-[104px] w-full rounded-[24px]" />
        </div>
      ) : list.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-[26px] px-6 py-10 text-center">
          <p className="text-[18px] font-medium text-white">{tab === "upcoming" ? "Nothing booked yet" : "No past trips"}</p>
          <p className="mt-1.5 max-w-[30ch] text-[14px] text-white/60">
            {tab === "upcoming"
              ? "Flights and stays you book appear here, with passes in your wallet."
              : "Trips move here once you're home."}
          </p>
          {tab === "upcoming" && (
            <div className="mt-5 flex gap-2">
              <PrimaryLink href="/plan" className="h-11 text-[15px]">
                Plan a trip
              </PrimaryLink>
              <PrimaryLink href="/flights" className="glass-thin h-11 bg-transparent text-[15px] text-white">
                Flights
              </PrimaryLink>
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((t) => (
            <li key={t.id}>
              <TripCard trip={t} past={tab === "past"} />
            </li>
          ))}
        </ul>
      )}

      {ready && state.visaApps.length > 0 && (
        <>
          <SectionLabel className="mt-8">Visas</SectionLabel>
          <ul className="space-y-2">
            {state.visaApps.map((a) => {
              const stage = stageOf(a, now);
              return (
                <li key={a.id}>
                  <Link href={`/visa/status?id=${a.id}`} className="glass flex items-center gap-3 rounded-[20px] px-4 py-3.5">
                    <span className="text-[22px]" aria-hidden>
                      🛂
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-white">
                        {a.destination} {a.type}
                      </span>
                      <span className="block text-[12px] text-white/50">Ref {a.id}</span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11.5px] font-medium",
                        stage === "Approved" ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/75",
                      )}
                    >
                      {stage}
                    </span>
                    <ChevronRight className="size-4 text-white/40" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </TabScreen>
  );
}
