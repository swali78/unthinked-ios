import { describe, expect, it } from "vitest";
import { allHotels, cityHotels, getHotel, HOTEL_CITIES, hotelPhotos, hotelReviews, hotelRooms, ratingWord } from "@/lib/data/hotels";
import { canApplyOnline, stageOf, STAGE_AT, type VisaApplication, visaNumber, visaRuleFor, visaValidity } from "@/lib/data/visa";

describe("hotels", () => {
  it("has at least six stays in every city, with unique ids", () => {
    for (const city of HOTEL_CITIES) expect(cityHotels(city).length).toBeGreaterThanOrEqual(6);
    const ids = allHotels().map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("never names a stay 'Hotel … Hotel'", () => {
    for (const h of allHotels()) expect(h.name).not.toMatch(/^Hotel .* Hotel$/);
  });
  it("finds a hotel by id", () => {
    const h = allHotels()[0];
    expect(getHotel(h.id)).toBe(h);
    expect(getHotel("nope")).toBeUndefined();
  });
  it("gives every stay four rooms priced in whole $5 steps, cheapest non-refundable", () => {
    for (const h of allHotels()) {
      const rooms = hotelRooms(h);
      expect(rooms).toHaveLength(4);
      for (const r of rooms) expect(r.price).toBeGreaterThan(0);
      expect(rooms[0].price).toBeLessThan(rooms[1].price);
      expect(rooms[0].cancellation).toBe("nonrefundable");
    }
  });
  it("shows distinct photos, starting with the main one", () => {
    for (const h of allHotels()) {
      const photos = hotelPhotos(h);
      expect(photos[0]).toBe(h.image);
      expect(new Set(photos).size).toBe(photos.length);
    }
  });
  it("keeps review scores between 6 and 10", () => {
    for (const r of hotelReviews(allHotels()[0])) {
      expect(r.score).toBeGreaterThanOrEqual(6);
      expect(r.score).toBeLessThanOrEqual(10);
    }
  });
  it("describes ratings in words", () => {
    expect(ratingWord(9.3)).toBe("Exceptional");
    expect(ratingWord(8.6)).toBe("Excellent");
    expect(ratingWord(6.5)).toBe("Okay");
  });
});

describe("visa rules", () => {
  it("uses the seed rule for Indian passports", () => {
    expect(visaRuleFor("India", "Egypt")?.type).toBe("eVisa");
  });
  it("lets UK and US passports in visa-free where it applies", () => {
    expect(visaRuleFor("United Kingdom", "Japan")).toMatchObject({ type: "Visa-free", maxStayDays: 90, fee: 0 });
    expect(visaRuleFor("United States", "Egypt")?.type).toBe("eVisa");
  });
  it("needs no visa for your own country", () => {
    expect(visaRuleFor("United Kingdom", "United Kingdom")?.type).toBe("Visa-free");
  });
  it("only applies online for eVisas", () => {
    expect(canApplyOnline(visaRuleFor("India", "Egypt")!)).toBe(true);
    expect(canApplyOnline(visaRuleFor("India", "France")!)).toBe(false);
  });
  it("returns undefined for unknown destinations", () => {
    expect(visaRuleFor("India", "Atlantis")).toBeUndefined();
  });
});

describe("visa applications", () => {
  const app: VisaApplication = {
    id: "VABC123", destination: "Egypt", nationality: "India", type: "eVisa", fee: 2500, maxStayDays: 30, submittedAt: 1_000_000,
    applicant: { firstName: "K", lastName: "R", dob: "1994-03-18", passport: "Z1234567", passportExpiry: "2031-08-02", email: "k@example.com" },
    travel: { arrival: "2026-12-04", departure: "2026-12-10", purpose: "Tourism", address: "Cairo Marriott" },
  };

  it("moves through the stages over time", () => {
    expect(stageOf(app, app.submittedAt)).toBe("Submitted");
    expect(stageOf(app, app.submittedAt + STAGE_AT["In review"])).toBe("In review");
    expect(stageOf(app, app.submittedAt + STAGE_AT.Approved)).toBe("Approved");
  });
  it("gives a stable visa number", () => {
    expect(visaNumber(app)).toMatch(/^EG\d{8}$/);
    expect(visaNumber(app)).toBe(visaNumber({ ...app }));
  });
  it("is valid for 90 days from arrival", () => {
    const { from, until } = visaValidity(app);
    expect(from.getDate()).toBe(4);
    expect(Math.round((+until - +from) / 864e5)).toBe(90);
  });
});
