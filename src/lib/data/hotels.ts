import { HOTELS } from "./seed";
import type { Hotel } from "./types";

/* Deterministic helpers ------------------------------------------------- */

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, list: readonly T[]) => list[Math.floor(r() * list.length)];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/* Extra stays, so every city has a real choice ---------------------------- */

const NAME_A = ["The", "Casa", "Villa", "Hotel", "House of", "Maison", "Palm", "Blue"] as const;
const NAME_B = ["Tides", "Lantern", "Olive", "Courtyard", "Harbour", "Saffron", "Cedar", "Atelier", "Horizon", "Coral", "Linen", "Juniper"] as const;
const NAME_C = ["Hotel", "Suites", "Residence", "Retreat", "Lodge", "House"] as const;
const EXTRA_AMENITIES = ["Free Wi-Fi", "Pool", "Spa", "Breakfast", "Gym", "Airport pickup", "Rooftop bar", "Beach access", "Kitchenette", "Parking"] as const;
/** Photos that read as "a hotel" anywhere: pools, rooms, lobbies. */
const GENERIC_IMAGES = HOTELS.filter((h) => ["h8", "h9", "h11", "h13", "h14"].includes(h.id)).map((h) => h.image);
/** A city's own photos plus the generic ones, so Bali never shows Tokyo. */
const poolFor = (city: string) => [...new Set([...HOTELS.filter((h) => h.city === city).map((h) => h.image), ...GENERIC_IMAGES])];

/** "House of Tides", "Casa Olive Suites"; never "Hotel Cedar Hotel". */
function hotelName(a: string, b: string, c: string) {
  return a.startsWith("House") || a === "Hotel" || a.includes(c) ? `${a} ${b}` : `${a} ${b} ${c}`;
}

let cache: Hotel[] | undefined;

/** Seed hotels plus generated ones (at least 6 per city). Stable across calls. */
export function allHotels(): Hotel[] {
  if (cache) return cache;
  const byCity = new Map<string, Hotel[]>();
  for (const h of HOTELS) byCity.set(h.city, [...(byCity.get(h.city) ?? []), h]);

  const out = [...HOTELS];
  for (const [city, list] of byCity) {
    const lat = list.reduce((s, h) => s + h.lat, 0) / list.length;
    const lng = list.reduce((s, h) => s + h.lng, 0) / list.length;
    const r = rng(`extra-${city}`);
    for (let i = list.length; i < 7; i++) {
      const stars = pick(r, [3, 4, 4, 5] as const);
      const base = list[i % list.length];
      out.push({
        id: `${slug(city)}-x${i}`,
        name: hotelName(pick(r, NAME_A), pick(r, NAME_B), pick(r, NAME_C)),
        city,
        country: base.country,
        area: base.area,
        stars,
        rating: Math.round((7.6 + r() * 2) * 10) / 10,
        reviews: 120 + Math.floor(r() * 2400),
        pricePerNight: Math.round((base.pricePerNight * (0.45 + r() * 0.9) * (stars / base.stars)) / 500) * 500,
        image: pick(r, poolFor(city)),
        amenities: [...new Set([pick(r, EXTRA_AMENITIES), pick(r, EXTRA_AMENITIES), "Free Wi-Fi", pick(r, EXTRA_AMENITIES)])],
        lat: lat + (r() - 0.5) * 0.08,
        lng: lng + (r() - 0.5) * 0.08,
      });
    }
  }
  cache = out;
  return out;
}

export const HOTEL_CITIES = [...new Set(HOTELS.map((h) => h.city))];

export function cityHotels(city: string) {
  const q = city.trim().toLowerCase();
  return allHotels().filter((h) => h.city.toLowerCase() === q || h.country.toLowerCase() === q);
}

export function getHotel(id: string) {
  return allHotels().find((h) => h.id === id);
}

/* Photos ---------------------------------------------------------------- */

export function hotelPhotos(h: Hotel): string[] {
  const r = rng(`photos-${h.id}`);
  const rest = poolFor(h.city).filter((i) => i !== h.image);
  const extra: string[] = [];
  while (extra.length < Math.min(4, rest.length)) {
    const p = pick(r, rest);
    if (!extra.includes(p)) extra.push(p);
  }
  return [h.image, ...extra];
}

/* Rooms ----------------------------------------------------------------- */

export type Room = {
  id: string;
  name: string;
  bed: string;
  size: number; // m²
  sleeps: number;
  perks: string[];
  cancellation: "free" | "nonrefundable";
  /** Cents per night. */
  price: number;
  left?: number;
};

export function hotelRooms(h: Hotel): Room[] {
  const r = rng(`rooms-${h.id}`);
  const p = h.pricePerNight;
  const round = (n: number) => Math.round(n / 500) * 500;
  return [
    { id: "std-nr", name: "Classic room", bed: "1 queen bed", size: 24 + Math.floor(r() * 6), sleeps: 2, perks: ["Free Wi-Fi"], cancellation: "nonrefundable", price: round(p * 0.88), left: r() < 0.5 ? 2 : undefined },
    { id: "std", name: "Classic room", bed: "1 queen bed", size: 24 + Math.floor(r() * 6), sleeps: 2, perks: ["Free Wi-Fi", "Breakfast included"], cancellation: "free", price: p },
    { id: "dlx", name: h.stars === 5 ? "Deluxe view room" : "Superior room", bed: "1 king or 2 twins", size: 32 + Math.floor(r() * 10), sleeps: 3, perks: ["Breakfast included", h.amenities[0]], cancellation: "free", price: round(p * 1.32) },
    { id: "ste", name: h.stars === 5 ? "Signature suite" : "Junior suite", bed: "1 king bed + sofa bed", size: 48 + Math.floor(r() * 20), sleeps: 4, perks: ["Breakfast included", "Lounge access", "Late checkout"], cancellation: "free", price: round(p * 1.9), left: 1 },
  ];
}

/* Reviews --------------------------------------------------------------- */

export type Review = { id: string; name: string; from: string; score: number; date: string; text: string; trip: string };

const NAMES = ["Aisha", "Marco", "Priya", "Tom", "Yuki", "Fatima", "Lucas", "Noor", "Elena", "Omar", "Hannah", "Ravi"] as const;
const FROM = ["UAE", "Italy", "India", "UK", "Japan", "Saudi Arabia", "Brazil", "Qatar", "Spain", "Egypt", "Germany", "Singapore"] as const;
const TRIPS = ["Couple", "Family", "Solo", "Friends", "Business"] as const;
const GOOD = [
  "Spotless room and the staff remembered our names by day two.",
  "Breakfast was the highlight. Fresh, local and served until 11.",
  "Quiet at night even though it's close to everything.",
  "The view from our balcony was exactly like the photos.",
  "Check-in took two minutes and they upgraded us without asking.",
  "Beds are very comfortable. Best sleep of the whole trip.",
] as const;
const MEH = [
  "Wi-Fi was slow in the evenings.",
  "The pool gets busy after lunch.",
  "Bathroom is on the small side.",
  "Street noise early in the morning on lower floors.",
] as const;

export function hotelReviews(h: Hotel, count = 8): Review[] {
  const r = rng(`reviews-${h.id}`);
  return Array.from({ length: count }, (_, i) => {
    const score = Math.min(10, Math.max(6, Math.round((h.rating + (r() - 0.5) * 2.4) * 10) / 10));
    const months = 1 + Math.floor(r() * 10);
    const d = new Date(2026, 10 - months, 1);
    return {
      id: `${h.id}-r${i}`,
      name: pick(r, NAMES),
      from: pick(r, FROM),
      score,
      trip: pick(r, TRIPS),
      date: d.toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      text: score >= 8.5 ? `${pick(r, GOOD)} ${pick(r, GOOD)}` : `${pick(r, GOOD)} ${pick(r, MEH)}`,
    };
  });
}

/** Category scores shown as bars. */
export function reviewBreakdown(h: Hotel) {
  const r = rng(`breakdown-${h.id}`);
  return ["Cleanliness", "Location", "Staff", "Comfort", "Value"].map((label) => ({
    label,
    score: Math.min(10, Math.round((h.rating + (r() - 0.55) * 1.2) * 10) / 10),
  }));
}

export const ratingWord = (s: number) => (s >= 9 ? "Exceptional" : s >= 8.5 ? "Excellent" : s >= 8 ? "Very good" : s >= 7 ? "Good" : "Okay");
