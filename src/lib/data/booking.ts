import type { Flight } from "./types";

/* ---------------- Fare tiers ---------------- */

export type FareId = "light" | "classic" | "flex";

export type Fare = {
  id: FareId;
  name: string;
  /** Multiplier on the base (Light) price. */
  mult: number;
  cabinBag: string;
  checkedBag: string;
  seat: string;
  changes: string;
  refund: string;
};

export const FARES: Fare[] = [
  { id: "light", name: "Light", mult: 1, cabinBag: "7 kg", checkedBag: "Not included", seat: "Paid selection", changes: "Not allowed", refund: "Not refundable" },
  { id: "classic", name: "Classic", mult: 1.18, cabinBag: "7 kg", checkedBag: "1 × 23 kg", seat: "Standard seats free", changes: "$50 fee", refund: "Refund for a $120 fee" },
  { id: "flex", name: "Flex", mult: 1.45, cabinBag: "2 × 7 kg", checkedBag: "2 × 23 kg", seat: "All seats free", changes: "Free", refund: "Fully refundable" },
];

export const fareById = (id: FareId) => FARES.find((f) => f.id === id) ?? FARES[0];
export const farePrice = (flight: Flight, fare: FareId) => Math.round((flight.price * fareById(fare).mult) / 100) * 100;

/* ---------------- Seat map ---------------- */

export type SeatKind = "standard" | "legroom" | "front";
export type Seat = { id: string; row: number; letter: string; taken: boolean; kind: SeatKind; price: number };

export const SEAT_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
export const EXIT_ROWS = [12, 13];

/** Narrow-body 3-3 layout. Occupancy is deterministic per flight. */
export function seatMap(flightId: string, rows = 30): Seat[] {
  let h = 0;
  for (const c of flightId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rand = () => {
    h = (h * 1103515245 + 12345) >>> 0;
    return h / 4294967296;
  };
  const seats: Seat[] = [];
  for (let row = 1; row <= rows; row++) {
    for (const letter of SEAT_LETTERS) {
      const kind: SeatKind = EXIT_ROWS.includes(row) ? "legroom" : row <= 4 ? "front" : "standard";
      const price = kind === "legroom" ? 3500 : kind === "front" ? 2000 : letter === "A" || letter === "F" ? 1200 : 900;
      seats.push({ id: `${row}${letter}`, row, letter, kind, price, taken: rand() < (row <= 4 ? 0.55 : 0.38) });
    }
  }
  return seats;
}

/** Seat fee after the fare's allowance. */
export function seatFee(seat: Seat, fare: FareId) {
  if (fare === "flex") return 0;
  if (fare === "classic" && seat.kind === "standard") return 0;
  return seat.price;
}

/* ---------------- Passengers ---------------- */

export type Passenger = {
  firstName: string;
  lastName: string;
  dob: string;
  nationality: string;
  passport: string;
  passportExpiry: string;
};

export const emptyPassenger = (): Passenger => ({
  firstName: "",
  lastName: "",
  dob: "",
  nationality: "",
  passport: "",
  passportExpiry: "",
});

/** Saved traveler profile used to prefill the first passenger (demo data). */
export const SAVED_TRAVELER: Passenger = {
  firstName: "Khalid",
  lastName: "Rahman",
  dob: "1994-03-18",
  nationality: "India",
  passport: "Z1234567",
  passportExpiry: "2031-08-02",
};

export function validatePassenger(p: Passenger, travelDate: string) {
  const errors: Partial<Record<keyof Passenger, string>> = {};
  if (!p.firstName.trim()) errors.firstName = "Enter the first name.";
  if (!p.lastName.trim()) errors.lastName = "Enter the last name.";
  if (!p.dob) errors.dob = "Enter a date of birth.";
  else if (new Date(p.dob) > new Date()) errors.dob = "Can't be in the future.";
  if (!p.nationality.trim()) errors.nationality = "Enter a nationality.";
  if (!/^[A-Z0-9]{6,9}$/i.test(p.passport.trim())) errors.passport = "Use 6–9 letters or digits.";
  if (!p.passportExpiry) errors.passportExpiry = "Enter the expiry date.";
  else {
    const minExpiry = new Date(`${travelDate}T00:00:00`);
    minExpiry.setMonth(minExpiry.getMonth() + 6);
    if (new Date(p.passportExpiry) < minExpiry)
      errors.passportExpiry = "Must be valid 6 months after travel.";
  }
  return errors;
}

/* ---------------- Formatting ---------------- */

export const usd = (cents: number, digits = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits }).format(cents / 100);
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
export const fmtDay = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
export const fmtDur = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
