import { describe, expect, it } from "vitest";
import { checkVisa, findFlight, priceCalendar, resolveAirport, searchFlights, searchHotels, suggestDestinations, toISODate } from "@/lib/data/search";

describe("resolveAirport", () => {
  it.each([
    ["DXB", "DXB"],
    ["dubai", "DXB"],
    ["Dubai (DXB)", "DXB"],
    ["Abu Dhabi", "AUH"],
    ["Bali", "DPS"],
    ["  santorini ", "JTR"],
  ])("reads %j as %s", (input, code) => {
    expect(resolveAirport(input)).toBe(code);
  });
  it("returns undefined for places it doesn't know", () => {
    expect(resolveAirport("Atlantis")).toBeUndefined();
  });
});

describe("searchFlights", () => {
  const args = { from: "DXB", to: "DPS", date: "2026-12-04" };

  it("returns flights sorted by price for a known route", () => {
    const { flights, error } = searchFlights(args);
    expect(error).toBeUndefined();
    expect(flights).toHaveLength(10);
    for (let i = 1; i < flights.length; i++) expect(flights[i].price).toBeGreaterThanOrEqual(flights[i - 1].price);
    for (const f of flights) {
      expect(f.from).toBe("DXB");
      expect(f.to).toBe("DPS");
      expect(f.price).toBeGreaterThanOrEqual(9900);
      expect(f.seatsLeft).toBeGreaterThan(0);
      expect(+new Date(f.arriveAt) - +new Date(f.departAt)).toBe(f.durationMin * 60_000);
      expect(f.stops === 0 ? f.via : f.via).toEqual(f.stops ? expect.any(String) : undefined);
    }
  });

  it("departs on the requested local date", () => {
    for (const f of searchFlights(args).flights) expect(toISODate(new Date(f.departAt))).toBe("2026-12-04");
  });

  it("is deterministic, so a flight can be found again by id", () => {
    const a = searchFlights(args).flights;
    expect(searchFlights(args).flights).toEqual(a);
    expect(findFlight(args, a[3].id)).toEqual(a[3]);
  });

  it("keeps ids stable whatever the result count", () => {
    const ten = searchFlights(args).flights.map((f) => f.id);
    const five = searchFlights({ ...args, count: 5 }).flights.map((f) => f.id);
    for (const id of five) expect(ten).toContain(id);
  });

  it("charges more for higher cabins", () => {
    const min = (cabin: "Economy" | "Business") => Math.min(...searchFlights({ ...args, cabin }).flights.map((f) => f.price));
    expect(min("Business")).toBeGreaterThan(min("Economy"));
  });

  it("explains an unknown airport", () => {
    const r = searchFlights({ from: "DXB", to: "Atlantis" });
    expect(r.flights).toEqual([]);
    expect(r.error).toContain('"Atlantis"');
  });
});

describe("priceCalendar", () => {
  it("is centred on the requested date in every time zone", () => {
    const days = priceCalendar({ from: "DXB", to: "DPS", date: "2026-12-04" }, 5);
    expect(days.map((d) => d.date)).toEqual(["2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06"]);
  });
  it("shows the same cheapest price as the search for that day", () => {
    const days = priceCalendar({ from: "DXB", to: "DPS", date: "2026-12-04" }, 3);
    const cheapest = Math.min(...searchFlights({ from: "DXB", to: "DPS", date: "2026-12-04" }).flights.map((f) => f.price));
    expect(days[1].min).toBe(cheapest);
  });
});

describe("searchHotels", () => {
  it("finds stays by city, best rated first", () => {
    const { hotels } = searchHotels({ city: "Bali" });
    expect(hotels.length).toBeGreaterThanOrEqual(6);
    expect(hotels.every((h) => h.city === "Bali")).toBe(true);
    for (let i = 1; i < hotels.length; i++) expect(hotels[i].rating).toBeLessThanOrEqual(hotels[i - 1].rating);
  });
  it("respects a nightly price cap", () => {
    const { hotels } = searchHotels({ city: "Bali", maxPricePerNight: 20000 });
    expect(hotels.every((h) => h.pricePerNight <= 20000)).toBe(true);
  });
  it("explains when there are no stays", () => {
    expect(searchHotels({ city: "Atlantis" }).error).toMatch(/No stays found in Atlantis/);
  });
});

describe("checkVisa", () => {
  it.each([
    ["Bali", "Indonesia"],
    ["Istanbul", "Türkiye"],
    ["phuket", "Thailand"],
    ["New York", "United States"],
    ["UK", "United Kingdom"],
    ["Japan", "Japan"],
  ])("maps %j to %s", (q, country) => {
    expect(checkVisa({ destination: q }).rule?.destination).toBe(country);
  });

  it("matches whole words, not parts of other place names", () => {
    expect(checkVisa({ destination: "Nusa Penida" }).rule?.destination).not.toBe("United States");
    expect(checkVisa({ destination: "Fukuoka" }).rule?.destination).not.toBe("United Kingdom");
  });

  it("says when a destination isn't covered", () => {
    const r = checkVisa({ destination: "Atlantis" });
    expect(r.rule).toBeUndefined();
    expect(r.error).toMatch(/Atlantis/);
  });
});

describe("suggestDestinations", () => {
  it("filters by theme and caps at five", () => {
    const { destinations } = suggestDestinations({ theme: "beach holiday" });
    expect(destinations.length).toBeGreaterThan(0);
    expect(destinations.length).toBeLessThanOrEqual(5);
    expect(destinations.every((d) => d.themes.includes("sea"))).toBe(true);
  });
  it("falls back to everything without a theme", () => {
    expect(suggestDestinations({}).destinations).toHaveLength(5);
  });
});
