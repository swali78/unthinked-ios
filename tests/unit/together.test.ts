import { describe, expect, it } from "vitest";
import {
  balances,
  compatibility,
  DEFAULT_PREFS,
  fitsPrefs,
  type GroupTrip,
  type MatchPrefs,
  overlapDays,
  rangeLabel,
  type Traveler,
  TRAVELERS,
  travelerById,
} from "@/lib/together";

const traveler = (over: Omit<Partial<Traveler>, "trip"> & { trip?: Partial<Traveler["trip"]> } = {}): Traveler => {
  const base = travelerById("t1")!;
  return { ...base, ...over, trip: { ...base.trip, ...over.trip } };
};
const prefs = (over: Partial<MatchPrefs> = {}): MatchPrefs => ({ ...DEFAULT_PREFS, ...over });

describe("overlapDays", () => {
  it("counts inclusive shared days", () => {
    expect(overlapDays("2026-11-27", "2026-12-03", "2026-11-28", "2026-12-04")).toBe(6);
    expect(overlapDays("2026-11-27", "2026-11-27", "2026-11-27", "2026-11-27")).toBe(1);
  });
  it("is zero for ranges that don't touch", () => {
    expect(overlapDays("2026-11-01", "2026-11-05", "2026-11-06", "2026-11-10")).toBe(0);
  });
  it("works across month and year boundaries", () => {
    expect(overlapDays("2026-12-30", "2027-01-02", "2026-12-31", "2027-01-10")).toBe(3);
  });
  it("is symmetric", () => {
    expect(overlapDays("2026-11-28", "2026-12-04", "2026-11-27", "2026-12-03")).toBe(6);
  });
});

describe("compatibility", () => {
  it("gives a perfect score for a traveler who matches on everything", () => {
    const p = prefs({ interests: ["Hiking", "Food", "Photos"], styles: ["Duo"], budget: "Mid-range" });
    const c = compatibility(p, traveler());
    expect(c.score).toBe(100);
    expect(c.overlapDays).toBe(7);
    expect(c.shared).toEqual(["Hiking", "Food", "Photos"]);
    expect(c.factors.map((f) => f.value)).toEqual([100, 100, 100, 100, 100]);
  });

  it("keeps the score between 0 and 100 for every seed traveler", () => {
    for (const t of TRAVELERS) {
      const { score } = compatibility(DEFAULT_PREFS, t);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("matches the destination case-insensitively and ignores spaces", () => {
    const c = compatibility(prefs({ destination: "  bali " }), traveler());
    expect(c.factors[0]).toMatchObject({ key: "place", value: 100, note: "Both going to Bali" });
  });

  it("drops 30 points for a different destination", () => {
    const same = compatibility(prefs(), traveler()).score;
    const other = compatibility(prefs({ destination: "Tokyo" }), traveler()).score;
    expect(same - other).toBe(30);
  });

  it("gives partial date credit to flexible travelers arriving within 3 days", () => {
    const t = traveler({ trip: { start: "2026-12-05", end: "2026-12-08" } });
    const flex = compatibility(prefs({ flexible: true }), t);
    const strict = compatibility(prefs({ flexible: false }), t);
    expect(flex.factors[1]).toMatchObject({ value: 30, note: "2 days apart" });
    expect(strict.factors[1].value).toBe(0);
    expect(flex.score).toBeGreaterThan(strict.score);
  });

  it("gives no date credit when trips are far apart", () => {
    const t = traveler({ trip: { start: "2027-02-01", end: "2027-02-05" } });
    const c = compatibility(prefs(), t);
    expect(c.overlapDays).toBe(0);
    expect(c.factors[1]).toMatchObject({ value: 0, note: "Different dates" });
  });

  it("treats four shared days as a full date match, even on a long trip", () => {
    const c = compatibility(prefs({ start: "2026-11-01", end: "2026-11-30" }), traveler({ trip: { start: "2026-11-27", end: "2026-12-10" } }));
    expect(c.overlapDays).toBe(4);
    expect(c.factors[1].value).toBe(100);
  });

  it("scales date credit for short overlaps", () => {
    const c = compatibility(prefs(), traveler({ trip: { start: "2026-12-02", end: "2026-12-09" } }));
    expect(c.overlapDays).toBe(2);
    expect(c.factors[1]).toMatchObject({ value: 50, note: "2 days together" });
  });

  it("uses singular wording for one day", () => {
    const c = compatibility(prefs(), traveler({ trip: { start: "2026-12-03", end: "2026-12-09" } }));
    expect(c.factors[1].note).toBe("1 day together");
  });

  it("counts shared interests, capping at three", () => {
    const none = compatibility(prefs({ interests: [] }), traveler());
    expect(none.factors[2]).toMatchObject({ value: 0, note: "Nothing in common yet" });
    const two = compatibility(prefs({ interests: ["Food", "Hiking"] }), traveler());
    expect(two.factors[2].value).toBe(67);
    // A traveler with a single interest is a full match if you share it.
    const one = compatibility(prefs({ interests: ["Yoga"] }), traveler({ interests: ["Yoga"] }));
    expect(one.factors[2].value).toBe(100);
  });

  it("treats no style preference as any style", () => {
    expect(compatibility(prefs({ styles: [] }), traveler({ style: "Solo" })).factors[3].value).toBe(100);
    expect(compatibility(prefs({ styles: ["Group"] }), traveler({ style: "Solo" })).factors[3].value).toBe(35);
  });

  it("scores budget by distance between tiers", () => {
    expect(compatibility(prefs({ budget: "Mid-range" }), traveler({ budget: "Mid-range" })).factors[4]).toMatchObject({ value: 100, note: "Both mid-range" });
    expect(compatibility(prefs({ budget: "Budget" }), traveler({ budget: "Mid-range" })).factors[4].value).toBe(50);
    expect(compatibility(prefs({ budget: "Budget" }), traveler({ budget: "Premium" })).factors[4].value).toBe(0);
  });

  it("ranks the seed travelers sensibly for the default preferences", () => {
    const ranked = [...TRAVELERS].sort((a, b) => compatibility(DEFAULT_PREFS, b).score - compatibility(DEFAULT_PREFS, a).score);
    // Bali travelers come before Istanbul and Tokyo ones.
    expect(ranked.slice(0, 3).every((t) => t.trip.to === "Bali")).toBe(true);
    expect(ranked[0].id).toBe("t1");
  });
});

describe("fitsPrefs", () => {
  it("filters by verification, gender and age", () => {
    expect(fitsPrefs(prefs(), traveler())).toBe(true);
    expect(fitsPrefs(prefs({ verifiedOnly: true }), traveler({ verified: false }))).toBe(false);
    expect(fitsPrefs(prefs({ verifiedOnly: false }), traveler({ verified: false }))).toBe(true);
    expect(fitsPrefs(prefs({ showMe: "men" }), traveler({ gender: "woman" }))).toBe(false);
    expect(fitsPrefs(prefs({ showMe: "women" }), traveler({ gender: "woman" }))).toBe(true);
    expect(fitsPrefs(prefs({ ageMin: 28 }), traveler({ age: 27 }))).toBe(false);
    expect(fitsPrefs(prefs({ ageMin: 27, ageMax: 27 }), traveler({ age: 27 }))).toBe(true);
  });
});

describe("rangeLabel", () => {
  it("formats ranges within and across months", () => {
    expect(rangeLabel("2026-12-05", "2026-12-10")).toBe("5 – 10 Dec");
    expect(rangeLabel("2026-11-27", "2026-12-03")).toBe("27 Nov – 3 Dec");
    expect(rangeLabel("2026-11-27", "2026-11-27")).toBe("27 Nov");
  });
});

describe("balances", () => {
  const group = (over: Partial<GroupTrip> = {}): GroupTrip => ({
    id: "g", title: "", destination: "", dates: "", image: "", members: ["me", "t1", "t2"], plan: [], expenses: [], settled: [], ...over,
  });

  it("is empty when nobody has paid", () => {
    expect(balances(group())).toEqual([]);
  });

  it("splits an expense evenly", () => {
    const out = balances(group({ expenses: [{ id: "e", title: "Villa", amount: 900, paidBy: "me", splitWith: ["me", "t1", "t2"] }] }));
    expect(out).toEqual([
      { from: "t1", to: "me", amount: 300 },
      { from: "t2", to: "me", amount: 300 },
    ]);
  });

  it("nets out expenses paid by different people", () => {
    const out = balances(group({
      expenses: [
        { id: "a", title: "Villa", amount: 900, paidBy: "me", splitWith: ["me", "t1", "t2"] },
        { id: "b", title: "Taxi", amount: 45, paidBy: "t1", splitWith: ["me", "t1", "t2"] },
      ],
    }));
    expect(out).toEqual([
      { from: "t1", to: "me", amount: 270 },
      { from: "t2", to: "me", amount: 315 },
    ]);
    // Whatever the order, the money adds up: everyone ends at zero.
    const net: Record<string, number> = { me: 900 - 315, t1: 45 - 315, t2: -315 };
    for (const t of out) {
      net[t.from] += t.amount;
      net[t.to] -= t.amount;
    }
    for (const v of Object.values(net)) expect(Math.abs(v)).toBeLessThan(0.02);
  });

  it("only splits with the people on the expense", () => {
    const out = balances(group({ expenses: [{ id: "e", title: "Dinner", amount: 100, paidBy: "t1", splitWith: ["t1", "t2"] }] }));
    expect(out).toEqual([{ from: "t2", to: "t1", amount: 50 }]);
  });

  it("clears debts once they are settled", () => {
    const expenses = [{ id: "e", title: "Villa", amount: 900, paidBy: "me", splitWith: ["me", "t1", "t2"] }];
    const partly = balances(group({ expenses, settled: [{ id: "s", from: "t1", to: "me", amount: 300 }] }));
    expect(partly).toEqual([{ from: "t2", to: "me", amount: 300 }]);
    const fully = balances(group({ expenses, settled: [{ id: "s1", from: "t1", to: "me", amount: 300 }, { id: "s2", from: "t2", to: "me", amount: 300 }] }));
    expect(fully).toEqual([]);
  });

  it("rounds uneven splits to cents", () => {
    const out = balances(group({ expenses: [{ id: "e", title: "Snacks", amount: 10, paidBy: "me", splitWith: ["me", "t1", "t2"] }] }));
    expect(out).toEqual([
      { from: "t1", to: "me", amount: 3.33 },
      { from: "t2", to: "me", amount: 3.33 },
    ]);
  });
});
