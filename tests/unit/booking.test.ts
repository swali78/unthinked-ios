import { describe, expect, it } from "vitest";
import { emptyPassenger, farePrice, fmtDur, SAVED_TRAVELER, seatFee, seatMap, usd, validatePassenger } from "@/lib/data/booking";
import { searchFlights } from "@/lib/data/search";

const flight = searchFlights({ from: "DXB", to: "DPS", date: "2026-12-04" }).flights[0];

describe("fares", () => {
  it("prices fares as rounded multiples of the base", () => {
    expect(farePrice(flight, "light")).toBe(Math.round(flight.price / 100) * 100);
    expect(farePrice(flight, "classic")).toBeGreaterThan(farePrice(flight, "light"));
    expect(farePrice(flight, "flex")).toBeGreaterThan(farePrice(flight, "classic"));
    for (const f of ["light", "classic", "flex"] as const) expect(farePrice(flight, f) % 100).toBe(0);
  });
});

describe("seatMap", () => {
  const seats = seatMap(flight.id);

  it("lays out 30 rows of six seats with unique ids", () => {
    expect(seats).toHaveLength(180);
    expect(new Set(seats.map((s) => s.id)).size).toBe(180);
  });
  it("is the same every time for a flight", () => {
    expect(seatMap(flight.id)).toEqual(seats);
  });
  it("leaves some seats free", () => {
    expect(seats.some((s) => !s.taken)).toBe(true);
  });
  it("marks exit rows as extra legroom", () => {
    expect(seats.filter((s) => s.row === 12).every((s) => s.kind === "legroom")).toBe(true);
  });
});

describe("seatFee", () => {
  const seats = seatMap(flight.id);
  const standard = seats.find((s) => s.kind === "standard")!;
  const legroom = seats.find((s) => s.kind === "legroom")!;

  it("charges Light fares for any seat", () => {
    expect(seatFee(standard, "light")).toBe(standard.price);
  });
  it("includes standard seats in Classic", () => {
    expect(seatFee(standard, "classic")).toBe(0);
    expect(seatFee(legroom, "classic")).toBe(legroom.price);
  });
  it("includes every seat in Flex", () => {
    expect(seatFee(legroom, "flex")).toBe(0);
  });
});

describe("validatePassenger", () => {
  it("accepts the saved traveler", () => {
    expect(validatePassenger(SAVED_TRAVELER, "2026-12-04")).toEqual({});
  });
  it("flags every missing field on an empty form", () => {
    expect(Object.keys(validatePassenger(emptyPassenger(), "2026-12-04")).sort()).toEqual(
      ["dob", "firstName", "lastName", "nationality", "passport", "passportExpiry"].sort(),
    );
  });
  it("rejects malformed passport numbers", () => {
    expect(validatePassenger({ ...SAVED_TRAVELER, passport: "AB12" }, "2026-12-04").passport).toBeDefined();
    expect(validatePassenger({ ...SAVED_TRAVELER, passport: "AB-123456" }, "2026-12-04").passport).toBeDefined();
  });
  it("rejects a birth date in the future", () => {
    expect(validatePassenger({ ...SAVED_TRAVELER, dob: "2999-01-01" }, "2026-12-04").dob).toBeDefined();
  });
  it("needs the passport valid for six months after travel, counting the last day", () => {
    expect(validatePassenger({ ...SAVED_TRAVELER, passportExpiry: "2027-06-04" }, "2026-12-04").passportExpiry).toBeUndefined();
    expect(validatePassenger({ ...SAVED_TRAVELER, passportExpiry: "2027-06-03" }, "2026-12-04").passportExpiry).toBeDefined();
  });
});

describe("formatting", () => {
  it("formats cents as dollars", () => {
    expect(usd(123456)).toBe("$1,235");
    expect(usd(123456, 2)).toBe("$1,234.56");
  });
  it("formats durations", () => {
    expect(fmtDur(125)).toBe("2h 05m");
  });
});
