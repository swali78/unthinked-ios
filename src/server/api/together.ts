/**
 * Travel together: matchmaking, chat and group trips.
 *
 * Ids in requests and responses are user ids, except that the signed-in
 * traveler is always "me", which is how the app already refers to them.
 * Group trip amounts are in dollars (two decimals), as the app shows them;
 * they're stored as integer cents.
 */
import { and, asc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { compatibility, fitsPrefs, type MatchPrefs, rangeLabel, type Traveler } from "@/lib/matching";
import type { Db } from "../db";
import {
  expenseSplits, expenses, groupMembers, groupTrips, matchPrefs, matches, messages, planItems, planVotes, profiles, settlements, swipes, travelPlans, users,
} from "../db/schema";
import { type AuthedCtx, forbidden, HttpError, json, notFound, route } from "../http";
import { newId } from "../ids";
import { assertClean } from "../moderation";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use yyyy-mm-dd.");
export const MatchPrefsSchema = z
  .object({
    destination: z.string().trim().min(1).max(60),
    start: isoDate,
    end: isoDate,
    flexible: z.boolean(),
    styles: z.array(z.enum(["Solo", "Duo", "Group"])).max(3),
    interests: z.array(z.string().trim().min(1).max(30)).max(12),
    budget: z.enum(["Budget", "Mid-range", "Premium"]),
    showMe: z.enum(["everyone", "women", "men"]),
    ageMin: z.number().int().min(18).max(100),
    ageMax: z.number().int().min(18).max(100),
    verifiedOnly: z.boolean(),
  })
  .refine((p) => p.end >= p.start, { message: "The trip must end after it starts.", path: ["end"] })
  .refine((p) => p.ageMax >= p.ageMin, { message: "Maximum age must be at least the minimum.", path: ["ageMax"] });

const DEMO_GREETING = (to: string) => `Hey! Saw you're heading to ${to} too 👋`;
const DEMO_REPLY = "Love it. Let's start a group trip so we can plan and split costs.";
const cents = (dollars: number) => Math.round(dollars * 100);
const dollars = (c: number) => c / 100;
const pair = (a: string, b: string) => (a < b ? [a, b] : [b, a]) as [string, string];

/* Reading people ------------------------------------------------------------ */

async function myPlan(db: Db, me: string) {
  const [p] = await db.select().from(travelPlans).where(eq(travelPlans.userId, me)).limit(1);
  return p ?? null;
}

async function myPrefs(db: Db, me: string) {
  const [row] = await db.select({ prefs: matchPrefs.prefs }).from(matchPrefs).where(eq(matchPrefs.userId, me)).limit(1);
  return (row?.prefs as MatchPrefs | undefined) ?? null;
}

/** Ids of people who blocked me or whom I blocked. */
async function blockedEitherWay(db: Db, me: string) {
  const rows = await db
    .select({ userId: swipes.userId, targetId: swipes.targetId })
    .from(swipes)
    .where(and(eq(swipes.action, "block"), or(eq(swipes.userId, me), eq(swipes.targetId, me))));
  return new Set(rows.map((r) => (r.userId === me ? r.targetId : r.userId)));
}

/**
 * Travelers in the app's `Traveler` shape. With `ids`, just those people;
 * without, everyone who has a trip planned (newest first, capped).
 */
async function travelers(db: Db, me: string, opts: { ids?: string[]; limit?: number } = {}): Promise<Traveler[]> {
  if (opts.ids && opts.ids.length === 0) return [];
  const base = db
    .select()
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(travelPlans, eq(travelPlans.userId, users.id));
  const rows = opts.ids
    ? await base.where(inArray(users.id, opts.ids))
    : await base.where(and(ne(users.id, me), isNull(users.suspendedAt), sql`${travelPlans.userId} is not null`)).orderBy(sql`${travelPlans.updatedAt} desc`).limit(opts.limit ?? 200);
  const likedMe = new Set(
    (await db.select({ id: swipes.userId }).from(swipes).where(and(eq(swipes.targetId, me), eq(swipes.action, "like")))).map((r) => r.id),
  );
  const mine = await myPlan(db, me);
  return rows.map(({ users: u, profiles: p, travel_plans: plan }) => ({
    id: u.id,
    name: u.name,
    age: p.age ?? 0,
    from: p.fromCity ?? "",
    tint: p.tint,
    verified: p.verified,
    gender: p.gender ?? "woman",
    style: p.style,
    likesYou: likedMe.has(u.id) || u.demoLikesBack,
    bio: p.bio,
    interests: p.interests,
    trip: plan
      ? { to: plan.destination, dates: rangeLabel(plan.startDate, plan.endDate), start: plan.startDate, end: plan.endDate, flight: plan.flight ?? "", sameFlight: !!plan.flight && plan.flight === mine?.flight }
      : { to: "", dates: "", start: "", end: "", flight: "", sameFlight: false },
    budget: p.budget,
    image: p.image ?? "",
  }));
}

/** Other people I've matched with, excluding blocks either way. */
async function myMatches(db: Db, me: string) {
  const rows = await db.select().from(matches).where(or(eq(matches.userA, me), eq(matches.userB, me))).orderBy(asc(matches.createdAt));
  const blocked = await blockedEitherWay(db, me);
  return rows.map((m) => ({ matchId: m.id, other: m.userA === me ? m.userB : m.userA })).filter((m) => !blocked.has(m.other));
}

async function matchWith(db: Db, me: string, other: string) {
  const [a, b] = pair(me, other);
  const [m] = await db.select().from(matches).where(and(eq(matches.userA, a), eq(matches.userB, b))).limit(1);
  if (!m || (await blockedEitherWay(db, me)).has(other)) throw notFound("You haven't matched with this traveler.");
  return m;
}

/* Group trips --------------------------------------------------------------- */

async function assertMember(db: Db, groupId: string, userId: string) {
  const [row] = await db.select().from(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))).limit(1);
  if (!row) throw notFound("Group trip not found.");
}

/** Group trips in the app's `GroupTrip` shape. */
async function groupViews(db: Db, me: string, groupIds?: string[]) {
  const ids = groupIds ?? (await db.select({ id: groupMembers.groupId }).from(groupMembers).where(eq(groupMembers.userId, me))).map((r) => r.id);
  if (!ids.length) return [];
  const asMe = (id: string) => (id === me ? "me" : id);
  const [trips, members, plan, votes, myVotes, exps, splits, settled] = await Promise.all([
    db.select().from(groupTrips).where(inArray(groupTrips.id, ids)).orderBy(sql`${groupTrips.createdAt} desc`),
    db.select().from(groupMembers).where(inArray(groupMembers.groupId, ids)).orderBy(asc(groupMembers.joinedAt)),
    db.select().from(planItems).where(inArray(planItems.groupId, ids)).orderBy(asc(planItems.createdAt)),
    db
      .select({ itemId: planVotes.itemId, n: sql<number>`count(*)::int` })
      .from(planVotes)
      .innerJoin(planItems, eq(planItems.id, planVotes.itemId))
      .where(inArray(planItems.groupId, ids))
      .groupBy(planVotes.itemId),
    db
      .select({ itemId: planVotes.itemId })
      .from(planVotes)
      .innerJoin(planItems, eq(planItems.id, planVotes.itemId))
      .where(and(inArray(planItems.groupId, ids), eq(planVotes.userId, me))),
    db.select().from(expenses).where(inArray(expenses.groupId, ids)).orderBy(asc(expenses.createdAt)),
    db.select({ expenseId: expenseSplits.expenseId, userId: expenseSplits.userId }).from(expenseSplits).innerJoin(expenses, eq(expenses.id, expenseSplits.expenseId)).where(inArray(expenses.groupId, ids)),
    db.select().from(settlements).where(inArray(settlements.groupId, ids)).orderBy(asc(settlements.createdAt)),
  ]);
  const voteCount = new Map(votes.map((v) => [v.itemId, Number(v.n)]));
  const mine = new Set(myVotes.map((v) => v.itemId));
  return trips.map((g) => {
    const mem = members.filter((m) => m.groupId === g.id).map((m) => asMe(m.userId));
    // "me" first, as the app expects.
    mem.sort((a, b) => (a === "me" ? -1 : b === "me" ? 1 : 0));
    return {
      id: g.id,
      title: g.title,
      destination: g.destination,
      dates: g.dates,
      image: g.image,
      members: mem,
      plan: plan.filter((p) => p.groupId === g.id).map((p) => ({ id: p.id, day: p.day, title: p.title, votes: voteCount.get(p.id) ?? 0, votedByMe: mine.has(p.id) })),
      expenses: exps
        .filter((e) => e.groupId === g.id)
        .map((e) => ({ id: e.id, title: e.title, amount: dollars(e.amountCents), paidBy: asMe(e.paidBy), splitWith: splits.filter((s) => s.expenseId === e.id).map((s) => asMe(s.userId)) })),
      settled: settled.filter((s) => s.groupId === g.id).map((s) => ({ id: s.id, from: asMe(s.fromUser), to: asMe(s.toUser), amount: dollars(s.amountCents) })),
    };
  });
}

/* Whole state ---------------------------------------------------------------- */

/** Everything the Travel together screens need, in the app's `TogetherState` shape. */
async function togetherState(db: Db, me: string) {
  const [prefs, mySwipes, matched, groups, blocked] = await Promise.all([
    myPrefs(db, me),
    db.select().from(swipes).where(eq(swipes.userId, me)),
    myMatches(db, me),
    groupViews(db, me),
    blockedEitherWay(db, me),
  ]);
  const by = (a: "like" | "pass" | "block") => mySwipes.filter((s) => s.action === a).map((s) => s.targetId);

  const msgs = matched.length
    ? await db.select().from(messages).where(inArray(messages.matchId, matched.map((m) => m.matchId))).orderBy(asc(messages.createdAt))
    : [];
  const chats: Record<string, { id: string; from: string; text: string; at: number }[]> = {};
  for (const m of matched) {
    chats[m.other] = msgs.filter((x) => x.matchId === m.matchId).map((x) => ({ id: x.id, from: x.senderId === me ? "me" : x.senderId, text: x.body, at: x.createdAt.getTime() }));
  }

  // Discoverable travelers, plus anyone you chat or travel with.
  const known = new Set([...matched.map((m) => m.other), ...groups.flatMap((g) => g.members)].filter((id) => id !== "me"));
  const open = await travelers(db, me);
  const missing = [...known].filter((id) => !open.some((t) => t.id === id));
  const people = [...open, ...(await travelers(db, me, { ids: missing }))].filter((t) => !blocked.has(t.id) || by("block").includes(t.id));

  return { prefs, people, liked: by("like"), passed: by("pass"), blocked: by("block"), matches: matched.map((m) => m.other), chats, groups };
}

/* Routes --------------------------------------------------------------------- */

const userId = z.string().min(1).max(64);
const memberRef = z.string().min(1).max(64); // "me" or a user id
const money = z.number().positive().max(1_000_000);

async function swipe({ db, user, body }: AuthedCtx) {
  const { targetId, action } = await body(z.object({ targetId: userId, action: z.enum(["like", "pass", "block"]) }));
  if (targetId === user.id) throw new HttpError(400, "invalid_target", "You can't swipe on yourself.");
  const [target] = await db.select({ id: users.id, isDemo: users.isDemo, demoLikesBack: users.demoLikesBack, suspendedAt: users.suspendedAt }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target || (target.suspendedAt && action === "like")) throw notFound("Traveler not found.");

  await db
    .insert(swipes)
    .values({ userId: user.id, targetId, action })
    .onConflictDoUpdate({ target: [swipes.userId, swipes.targetId], set: { action, createdAt: new Date() } });
  if (action !== "like") return json({ match: false });

  const [theirs] = await db.select({ action: swipes.action }).from(swipes).where(and(eq(swipes.userId, targetId), eq(swipes.targetId, user.id))).limit(1);
  if (theirs?.action === "block") return json({ match: false });
  const mutual = theirs?.action === "like" || target.demoLikesBack;
  if (!mutual) return json({ match: false });

  const [a, b] = pair(user.id, targetId);
  const created = await db.insert(matches).values({ id: newId("mch"), userA: a, userB: b }).onConflictDoNothing().returning({ id: matches.id });
  const matchId = created[0]?.id ?? (await matchWith(db, user.id, targetId)).id;
  if (created.length && target.isDemo) {
    const plan = await myPlan(db, targetId);
    await db.insert(messages).values({ id: newId("msg"), matchId, senderId: targetId, body: DEMO_GREETING(plan?.destination ?? "the same place") });
  }
  return json({ match: true, matchId });
}

export const togetherRoutes = [
  route.authed("GET", "/together", async ({ db, user }) => json(await togetherState(db, user.id))),

  route.authed("GET", "/match/prefs", async ({ db, user }) => json({ prefs: await myPrefs(db, user.id) })),

  route.authed("PUT", "/match/prefs", async ({ db, user, body }) => {
    const prefs = await body(MatchPrefsSchema);
    await db.insert(matchPrefs).values({ userId: user.id, prefs }).onConflictDoUpdate({ target: matchPrefs.userId, set: { prefs, updatedAt: new Date() } });
    // Your preferences describe your own trip too, which makes you discoverable.
    const plan = { destination: prefs.destination, startDate: prefs.start, endDate: prefs.end, updatedAt: new Date() };
    await db.insert(travelPlans).values({ userId: user.id, ...plan }).onConflictDoUpdate({ target: travelPlans.userId, set: plan });
    return json({ prefs });
  }),

  /** Ranked people to swipe on, scored on the server. For the native apps. */
  route.authed("GET", "/match/candidates", async ({ db, user }) => {
    const prefs = await myPrefs(db, user.id);
    const [swiped, blocked] = await Promise.all([
      db.select({ id: swipes.targetId }).from(swipes).where(eq(swipes.userId, user.id)),
      blockedEitherWay(db, user.id),
    ]);
    const skip = new Set([...swiped.map((s) => s.id), ...blocked]);
    const open = (await travelers(db, user.id)).filter((t) => !skip.has(t.id));
    const ranked = prefs
      ? open.filter((t) => fitsPrefs(prefs, t)).map((t) => ({ traveler: t, compatibility: compatibility(prefs, t) })).sort((a, b) => b.compatibility.score - a.compatibility.score)
      : open.map((t) => ({ traveler: t, compatibility: null }));
    return json({ candidates: ranked });
  }),

  route.authed("POST", "/match/swipes", swipe),

  route.authed("GET", "/chats/:userId/messages", async ({ db, user, params }) => {
    const m = await matchWith(db, user.id, params.userId);
    const rows = await db.select().from(messages).where(eq(messages.matchId, m.id)).orderBy(asc(messages.createdAt));
    return json({ messages: rows.map((x) => ({ id: x.id, from: x.senderId === user.id ? "me" : x.senderId, text: x.body, at: x.createdAt.getTime() })) });
  }),

  route.authed("POST", "/chats/:userId/messages", async ({ db, user, params, body }) => {
    const { text } = await body(z.object({ text: z.string().trim().min(1).max(2000) }));
    assertClean({ text });
    const m = await matchWith(db, user.id, params.userId);
    const now = Date.now();
    await db.insert(messages).values({ id: newId("msg"), matchId: m.id, senderId: user.id, body: text, createdAt: new Date(now) });
    const [other] = await db.select({ isDemo: users.isDemo }).from(users).where(eq(users.id, params.userId)).limit(1);
    if (other?.isDemo) await db.insert(messages).values({ id: newId("msg"), matchId: m.id, senderId: params.userId, body: DEMO_REPLY, createdAt: new Date(now + 1000) });
    const rows = await db.select().from(messages).where(eq(messages.matchId, m.id)).orderBy(asc(messages.createdAt));
    return json({ messages: rows.map((x) => ({ id: x.id, from: x.senderId === user.id ? "me" : x.senderId, text: x.body, at: x.createdAt.getTime() })) }, { status: 201 });
  }),

  /** Start a group trip with a match. */
  route.authed("POST", "/groups", async ({ db, user, body }) => {
    const input = await body(z.object({ withUserId: userId, title: z.string().trim().min(1).max(80).optional() }));
    assertClean({ title: input.title });
    await matchWith(db, user.id, input.withUserId);
    const [t] = await travelers(db, user.id, { ids: [input.withUserId] });
    const id = newId("grp");
    await db.insert(groupTrips).values({
      id, title: input.title ?? `${t.trip.to || "Trip"} with ${t.name}`, destination: t.trip.to, dates: t.trip.dates, image: t.image, createdBy: user.id,
    });
    await db.insert(groupMembers).values([{ groupId: id, userId: user.id }, { groupId: id, userId: input.withUserId }]);
    const [group] = await groupViews(db, user.id, [id]);
    return json({ group }, { status: 201 });
  }),

  route.authed("GET", "/groups/:id", async ({ db, user, params }) => {
    await assertMember(db, params.id, user.id);
    const [group] = await groupViews(db, user.id, [params.id]);
    return json({ group });
  }),

  route.authed("POST", "/groups/:id/plan", async ({ db, user, params, body }) => {
    const { title } = await body(z.object({ title: z.string().trim().min(1).max(160) }));
    assertClean({ title });
    await assertMember(db, params.id, user.id);
    const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(planItems).where(eq(planItems.groupId, params.id));
    const itemId = newId("pln");
    await db.insert(planItems).values({ id: itemId, groupId: params.id, day: `Day ${Number(n) + 1}`, title, createdBy: user.id });
    await db.insert(planVotes).values({ itemId, userId: user.id });
    const [group] = await groupViews(db, user.id, [params.id]);
    return json({ group }, { status: 201 });
  }),

  /** One vote per traveler; voting twice is a no-op. */
  route.authed("POST", "/groups/:id/plan/:itemId/vote", async ({ db, user, params }) => {
    await assertMember(db, params.id, user.id);
    const [item] = await db.select().from(planItems).where(and(eq(planItems.id, params.itemId), eq(planItems.groupId, params.id))).limit(1);
    if (!item) throw notFound("Plan item not found.");
    await db.insert(planVotes).values({ itemId: item.id, userId: user.id }).onConflictDoNothing();
    const [group] = await groupViews(db, user.id, [params.id]);
    return json({ group });
  }),

  /** Take your vote back. Removing a vote you never cast is a no-op. */
  route.authed("DELETE", "/groups/:id/plan/:itemId/vote", async ({ db, user, params }) => {
    await assertMember(db, params.id, user.id);
    const [item] = await db.select().from(planItems).where(and(eq(planItems.id, params.itemId), eq(planItems.groupId, params.id))).limit(1);
    if (!item) throw notFound("Plan item not found.");
    await db.delete(planVotes).where(and(eq(planVotes.itemId, item.id), eq(planVotes.userId, user.id)));
    const [group] = await groupViews(db, user.id, [params.id]);
    return json({ group });
  }),

  route.authed("POST", "/groups/:id/expenses", async ({ db, user, params, body }) => {
    const input = await body(z.object({ title: z.string().trim().min(1).max(120), amount: money, paidBy: memberRef, splitWith: z.array(memberRef).min(1).max(50) }));
    assertClean({ title: input.title });
    await assertMember(db, params.id, user.id);
    const members = new Set((await db.select({ id: groupMembers.userId }).from(groupMembers).where(eq(groupMembers.groupId, params.id))).map((r) => r.id));
    const resolve = (ref: string) => (ref === "me" ? user.id : ref);
    const paidBy = resolve(input.paidBy);
    const split = [...new Set(input.splitWith.map(resolve))];
    if (![paidBy, ...split].every((m) => members.has(m))) throw new HttpError(400, "not_a_member", "Everyone on an expense must be in the group.");
    const id = newId("exp");
    await db.insert(expenses).values({ id, groupId: params.id, title: input.title, amountCents: cents(input.amount), paidBy });
    await db.insert(expenseSplits).values(split.map((m) => ({ expenseId: id, userId: m })));
    const [group] = await groupViews(db, user.id, [params.id]);
    return json({ group }, { status: 201 });
  }),

  /** Record a payback. Only the payer or the person paid can record it. */
  route.authed("POST", "/groups/:id/settlements", async ({ db, user, params, body }) => {
    const input = await body(z.object({ from: memberRef, to: memberRef, amount: money }));
    await assertMember(db, params.id, user.id);
    const from = input.from === "me" ? user.id : input.from;
    const to = input.to === "me" ? user.id : input.to;
    if (from === to) throw new HttpError(400, "invalid_settlement", "Pick two different travelers.");
    if (from !== user.id && to !== user.id) throw forbidden("Only the payer or the person paid can record this.");
    const members = new Set((await db.select({ id: groupMembers.userId }).from(groupMembers).where(eq(groupMembers.groupId, params.id))).map((r) => r.id));
    if (!members.has(from) || !members.has(to)) throw new HttpError(400, "not_a_member", "Both travelers must be in the group.");
    await db.insert(settlements).values({ id: newId("stl"), groupId: params.id, fromUser: from, toUser: to, amountCents: cents(input.amount) });
    const [group] = await groupViews(db, user.id, [params.id]);
    return json({ group }, { status: 201 });
  }),
];
