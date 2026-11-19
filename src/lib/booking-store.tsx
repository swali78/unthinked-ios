"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { findOffensive } from "@/lib/moderation";
import { onSessionChange } from "@/lib/session";
import type { FareId, Passenger } from "@/lib/data/booking";
import type { Flight } from "@/lib/data/types";
import type { VisaApplication } from "@/lib/data/visa";

export type FlightSearch = {
  from: string;
  to: string;
  date: string; // YYYY-MM-DD
  pax: number;
  cabin: Flight["cabin"];
};

export type BookingState = {
  search?: FlightSearch;
  flightId?: string;
  fare: FareId;
  seats: string[];
  passengers: Passenger[];
  /** In-progress hotel booking. */
  stay?: HotelStay;
  /** Submitted visa applications, newest first. */
  visaApps: VisaApplication[];
  /** Completed flight and hotel bookings. */
  trips: Trip[];
  prefs: Prefs;
  /** Set once the welcome screens have been seen. */
  onboarded: boolean;
};

export type FlightTrip = {
  kind: "flight";
  id: string; // booking reference
  bookedAt: number;
  flight: Flight;
  fare: FareId;
  seats: string[];
  passengers: string[];
  total: number; // cents
};

export type StayTrip = {
  kind: "stay";
  id: string;
  bookedAt: number;
  hotelId: string;
  hotelName: string;
  image: string;
  city: string;
  country: string;
  roomName: string;
  checkIn: string;
  nights: number;
  guests: number;
  guestName: string;
  total: number;
};

export type Trip = FlightTrip | StayTrip;

export type Prefs = {
  name: string;
  homeAirport: string;
  seat: "Window" | "Aisle" | "No preference";
  cabin: Flight["cabin"];
  meal: "Standard" | "Vegetarian" | "Halal" | "Vegan";
  notifications: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  name: "Khalid",
  homeAirport: "DXB",
  seat: "Window",
  cabin: "Economy",
  meal: "Standard",
  notifications: true,
};

/** When a trip starts, as a timestamp, for sorting into upcoming and past. */
export const tripStart = (t: Trip) =>
  t.kind === "flight" ? new Date(t.flight.departAt).getTime() : new Date(`${t.checkIn}T15:00:00`).getTime();
export const tripEnd = (t: Trip) => {
  if (t.kind === "flight") return new Date(t.flight.arriveAt).getTime();
  const d = new Date(`${t.checkIn}T11:00:00`);
  d.setDate(d.getDate() + t.nights);
  return d.getTime();
};

export type HotelSearch = {
  city: string;
  checkIn: string; // YYYY-MM-DD
  nights: number;
  guests: number;
};

export type HotelStay = HotelSearch & { hotelId: string; roomId: string };

const INITIAL: BookingState = { fare: "classic", seats: [], passengers: [], visaApps: [], trips: [], prefs: DEFAULT_PREFS, onboarded: false };
const KEY = "unthinked.state.v2";
/** Data saved before the rename to Unthinked; read once and carried over. */
const LEGACY_KEY = "voyara.state.v2";

type Ctx = {
  state: BookingState;
  /** False until the saved session has been restored on the client. */
  ready: boolean;
  update: (patch: Partial<BookingState>) => void;
  reset: () => void;
};

const BookingContext = createContext<Ctx | null>(null);

/** Bookings in progress and visa applications, kept in localStorage so they survive reloads and new tabs. */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingState>(INITIAL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let saved: BookingState | undefined;
    try {
      // One-time migration: data saved before the rename wins, then the old
      // key is removed so it is never read again.
      const legacy = localStorage.getItem(LEGACY_KEY);
      const raw = legacy ?? localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        saved = { ...INITIAL, ...parsed, prefs: { ...DEFAULT_PREFS, ...parsed.prefs } };
      }
      if (legacy) {
        localStorage.setItem(KEY, legacy);
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch {
      /* storage blocked or corrupt: start fresh */
    }
    // Restoring from storage is a one-time sync with an external system.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const update = useCallback((patch: Partial<BookingState>) => setState((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setState(INITIAL), []);
  const value = useMemo(() => ({ state, ready, update, reset }), [state, ready, update, reset]);

  useAccountSync(state, ready, setState);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

/**
 * Signed in, bookings, visa applications and preferences are saved to your
 * account. On sign-in, anything booked on this device first is uploaded, and
 * what's in the account comes down. localStorage stays as the offline copy.
 */
function useAccountSync(state: BookingState, ready: boolean, setState: (fn: (s: BookingState) => BookingState) => void) {
  const [signedIn, setSignedIn] = useState(false);
  const synced = useRef(new Set<string>());
  const lastPrefs = useRef<string | null>(null);

  // Pull from the account when someone signs in.
  useEffect(() => {
    if (!ready) return;
    return onSessionChange((user) => {
      synced.current = new Set();
      lastPrefs.current = null;
      setSignedIn(false);
      if (!user) return;
      Promise.all([
        api<{ prefs: Prefs }>("/me"),
        api<{ bookings: Trip[] }>("/bookings"),
        api<{ applications: VisaApplication[] }>("/visa-applications"),
      ])
        .then(([me, b, v]) => {
          b.bookings.forEach((t) => synced.current.add(t.id));
          v.applications.forEach((a) => synced.current.add(a.id));
          lastPrefs.current = JSON.stringify(me.prefs);
          setState((s) => ({
            ...s,
            prefs: { ...s.prefs, ...me.prefs },
            trips: [...b.bookings, ...s.trips.filter((t) => !synced.current.has(t.id))],
            visaApps: [...v.applications, ...s.visaApps.filter((a) => !synced.current.has(a.id))].sort((x, y) => y.submittedAt - x.submittedAt),
          }));
          setSignedIn(true);
        })
        .catch((err) => console.warn("[account] couldn't load your account", err));
    });
  }, [ready, setState]);

  // Push new bookings and visa applications.
  useEffect(() => {
    if (!signedIn) return;
    for (const t of state.trips) {
      if (synced.current.has(t.id)) continue;
      synced.current.add(t.id);
      api("/bookings", { method: "POST", body: t }).catch((err) => {
        synced.current.delete(t.id);
        console.warn("[account] booking not saved", t.id, err);
      });
    }
    for (const a of state.visaApps) {
      if (synced.current.has(a.id)) continue;
      synced.current.add(a.id);
      api("/visa-applications", { method: "POST", body: a }).catch((err) => {
        synced.current.delete(a.id);
        console.warn("[account] visa application not saved", a.id, err);
      });
    }
  }, [signedIn, state.trips, state.visaApps]);

  // Save preference changes, a moment after the last edit.
  useEffect(() => {
    if (!signedIn) return;
    const next = JSON.stringify(state.prefs);
    // An offensive name is shown as an error in Profile and never saved.
    if (next === lastPrefs.current || !state.prefs.name.trim() || findOffensive(state.prefs.name)) return;
    const timer = setTimeout(() => {
      lastPrefs.current = next;
      api("/me", { method: "PATCH", body: { ...state.prefs, name: state.prefs.name.trim() } }).catch((err) => console.warn("[account] preferences not saved", err));
    }, 600);
    return () => clearTimeout(timer);
  }, [signedIn, state.prefs]);
}
