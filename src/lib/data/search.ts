import { allHotels } from "./hotels";
import { AIRLINES, AIRPORTS, DESTINATIONS, VISA_RULES } from "./seed";
import type { Destination, Flight, Hotel, VisaRule } from "./types";

/** Small deterministic PRNG so the same search gives the same results. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Accepts "DXB", "dubai", "Dubai (DXB)" and returns an IATA code. */
export function resolveAirport(input: string): string | undefined {
  const q = input.trim().toLowerCase();
  const code = q.match(/\b([a-z]{3})\b/)?.[1]?.toUpperCase();
  if (code && AIRPORTS[code]) return code;
  const hit = Object.entries(AIRPORTS).find(([, city]) => q.includes(city.toLowerCase()));
  if (hit) return hit[0];
  const dest = DESTINATIONS.find(
    (d) => q.includes(d.city.toLowerCase()) || q.includes(d.country.toLowerCase()),
  );
  return dest?.airport;
}

export function searchFlights({
  from,
  to,
  date,
  cabin = "Economy",
  count = 10,
}: {
  from: string;
  to: string;
  date?: string;
  cabin?: Flight["cabin"];
  /** How many results. Ids are stable for a given search regardless of count. */
  count?: number;
}): { flights: Flight[]; error?: string } {
  const fromCode = resolveAirport(from);
  const toCode = resolveAirport(to);
  if (!fromCode || !toCode) {
    return { flights: [], error: `No airport found for "${!fromCode ? from : to}". Try a city name or a 3-letter code.` };
  }
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : nextFriday();
  const r = rng(`${fromCode}-${toCode}-${day.toDateString()}-${cabin}`);
  const base = 18000 + Math.floor(r() * 50000);
  const cabinMult = { Economy: 1, Premium: 1.7, Business: 3.6, First: 6 }[cabin];

  const flights = Array.from({ length: count }, (_, i) => {
    const airline = AIRLINES[Math.floor(r() * AIRLINES.length)];
    const stops = r() < 0.55 ? 0 : 1;
    const durationMin = 120 + Math.floor(r() * 360) + stops * (90 + Math.floor(r() * 120));
    const depart = new Date(day);
    depart.setHours(5 + Math.floor(r() * 17), [0, 15, 30, 45][Math.floor(r() * 4)], 0, 0);
    const arrive = new Date(depart.getTime() + durationMin * 60000);
    const price = Math.round(((base + r() * 22000 - stops * 6000) * cabinMult) / 100) * 100;
    const num = 100 + Math.floor(r() * 899);
    return {
      id: `${airline.code}${num}-${toISODate(day)}-${i}`,
      airline,
      flightNumber: `${airline.code} ${num}`,
      from: fromCode,
      to: toCode,
      fromCity: AIRPORTS[fromCode],
      toCity: AIRPORTS[toCode],
      departAt: depart.toISOString(),
      arriveAt: arrive.toISOString(),
      durationMin,
      stops,
      via: stops ? ["DOH", "IST", "AUH", "BOM"][Math.floor(r() * 4)] : undefined,
      cabin,
      price: Math.max(price, 9900),
      currency: "USD" as const,
      seatsLeft: 1 + Math.floor(r() * 9),
    } satisfies Flight;
  });
  return { flights: flights.sort((a, b) => a.price - b.price) };
}

export function searchHotels({
  city,
  maxPricePerNight,
}: {
  city: string;
  maxPricePerNight?: number;
}): { hotels: Hotel[]; error?: string } {
  const q = city.trim().toLowerCase();
  const hotels = allHotels().filter(
    (h) =>
      (h.city.toLowerCase().includes(q) ||
        q.includes(h.city.toLowerCase()) ||
        h.country.toLowerCase() === q) &&
      (!maxPricePerNight || h.pricePerNight <= maxPricePerNight),
  ).sort((a, b) => b.rating - a.rating);
  return hotels.length
    ? { hotels }
    : { hotels: [], error: `No stays found in ${city} yet. Try Bali, Santorini, Cairo or Tokyo.` };
}

export function checkVisa({
  destination,
  nationality = "India",
}: {
  destination: string;
  nationality?: string;
}): { rule?: VisaRule; nationality: string; error?: string } {
  const q = destination.trim().toLowerCase();
  const alias: Record<string, string> = {
    bali: "Indonesia", santorini: "Greece", athens: "Greece", cairo: "Egypt", sharm: "Egypt",
    istanbul: "Türkiye", turkey: "Türkiye", tokyo: "Japan", phuket: "Thailand", bangkok: "Thailand",
    dubai: "UAE", london: "United Kingdom", uk: "United Kingdom", paris: "France", rome: "Italy",
    usa: "United States", "new york": "United States", doha: "Qatar", maldives: "Maldives",
  };
  const name = Object.entries(alias).find(([k]) => q.includes(k))?.[1] ?? destination;
  const rule = VISA_RULES.find((v) => v.destination.toLowerCase() === name.toLowerCase());
  return rule
    ? { rule, nationality }
    : { nationality, error: `Visa rules for ${destination} aren't in Unthinked yet.` };
}

export function suggestDestinations({ theme }: { theme?: string }): { destinations: Destination[] } {
  const t = (theme ?? "").toLowerCase();
  const key = (
    /sea|beach|island|ocean|dive|snorkel/.test(t) ? "sea"
    : /city|shop|night/.test(t) ? "city"
    : /desert|pyramid/.test(t) ? "desert"
    : /food|eat/.test(t) ? "food"
    : /culture|history|museum|temple/.test(t) ? "culture"
    : undefined
  ) as Destination["themes"][number] | undefined;
  const list = key ? DESTINATIONS.filter((d) => d.themes.includes(key)) : DESTINATIONS;
  return { destinations: list.slice(0, 5) };
}

/** Cheapest fare for each of `days` dates centred on `date`, for the price strip. */
export function priceCalendar(args: { from: string; to: string; date: string; cabin?: Flight["cabin"] }, days = 15) {
  const centre = new Date(args.date);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(centre);
    d.setDate(centre.getDate() + i - Math.floor(days / 2));
    const iso = toISODate(d);
    const { flights } = searchFlights({ ...args, date: iso });
    return { date: iso, min: flights.length ? Math.min(...flights.map((f) => f.price)) : undefined };
  });
}

export function findFlight(args: { from: string; to: string; date: string; cabin?: Flight["cabin"] }, id: string) {
  return searchFlights(args).flights.find((f) => f.id === id);
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function defaultDepartDate() {
  return toISODate(nextFriday());
}

function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7) + 7);
  return d;
}
