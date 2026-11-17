"use client";

import { useMemo } from "react";
import { useBooking } from "@/lib/booking-store";
import { findFlight } from "@/lib/data/search";
import { Skeleton } from "./primitives";
import { PrimaryLink } from "./screen";

/** The flight chosen on the results screen, rebuilt from the saved search. */
export function useSelectedFlight() {
  const booking = useBooking();
  const { search, flightId } = booking.state;
  const flight = useMemo(
    () => (search && flightId ? findFlight(search, flightId) : undefined),
    [search, flightId],
  );
  return { ...booking, flight, search };
}

export function FlowLoading() {
  return (
    <div className="space-y-3 px-4 pt-[70px] md:pt-[110px]" aria-busy>
      <Skeleton className="h-[180px] w-full rounded-[24px]" />
      <Skeleton className="h-[120px] w-full rounded-[24px]" />
      <Skeleton className="h-[120px] w-full rounded-[24px]" />
    </div>
  );
}

export function NoFlightSelected() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <p className="text-[20px] font-medium text-white">No flight selected</p>
      <p className="max-w-[28ch] text-[14.5px] text-white/60">Search for a route and pick a flight to continue booking.</p>
      <PrimaryLink href="/flights" className="mt-3 h-11 text-[15px]">
        Search flights
      </PrimaryLink>
    </div>
  );
}
