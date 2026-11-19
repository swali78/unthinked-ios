/**
 * Demo content so the prototype feels alive before real travelers join.
 * Turn it off with UNTHINKED_DEMO=0.
 */
import { img, TRAVELERS } from "@/lib/matching";
import type { Db } from "./db";
import { expenseSplits, expenses, groupMembers, groupTrips, planItems, planVotes, profiles, travelPlans, users } from "./db/schema";
import { newId } from "./ids";

/** The five demo travelers, with fixed ids t1–t5 so links in the app keep working. */
export async function seedDemoTravelers(db: Db) {
  await db
    .insert(users)
    .values(TRAVELERS.map((t) => ({ id: t.id, name: t.name, isDemo: true, demoLikesBack: t.likesYou })))
    .onConflictDoNothing();
  await db
    .insert(profiles)
    .values(
      TRAVELERS.map((t) => ({
        userId: t.id, age: t.age, gender: t.gender, fromCity: t.from, bio: t.bio, interests: t.interests,
        tint: t.tint, image: t.image, verified: t.verified, style: t.style, budget: t.budget,
      })),
    )
    .onConflictDoNothing();
  await db
    .insert(travelPlans)
    .values(TRAVELERS.map((t) => ({ userId: t.id, destination: t.trip.to, startDate: t.trip.start, endDate: t.trip.end, flight: t.trip.flight })))
    .onConflictDoNothing();
}

/** A sample group trip with Aisha and Rahul, so the Trips tab isn't empty on day one. */
export async function seedStarterGroup(db: Db, userId: string) {
  if (process.env.UNTHINKED_DEMO === "0") return;
  const gid = newId("grp");
  await db.insert(groupTrips).values({ id: gid, title: "Bali villa crew", destination: "Bali", dates: "27 Nov – 3 Dec", image: img("photo-1559628233-100c798642d4"), createdBy: userId });
  const members = [userId, "t1", "t2"];
  await db.insert(groupMembers).values(members.map((m) => ({ groupId: gid, userId: m })));
  const plan = [
    { day: "Day 1", title: "Land at DPS, check in to the Ubud villa", voters: members },
    { day: "Day 2", title: "Sunrise trek on Mount Batur", voters: ["t1", "t2"] },
    { day: "Day 3", title: "Uluwatu temple and beach clubs", voters: members },
  ];
  for (const [i, p] of plan.entries()) {
    const id = newId("pln");
    await db.insert(planItems).values({ id, groupId: gid, day: p.day, title: p.title, createdBy: members[i % members.length], createdAt: new Date(Date.now() + i) });
    await db.insert(planVotes).values(p.voters.map((v) => ({ itemId: id, userId: v })));
  }
  const costs = [
    { title: "Villa, 6 nights", amountCents: 90000, paidBy: userId },
    { title: "Airport transfer", amountCents: 4500, paidBy: "t1" },
  ];
  for (const [i, c] of costs.entries()) {
    const id = newId("exp");
    await db.insert(expenses).values({ id, groupId: gid, ...c, createdAt: new Date(Date.now() + i) });
    await db.insert(expenseSplits).values(members.map((m) => ({ expenseId: id, userId: m })));
  }
}
