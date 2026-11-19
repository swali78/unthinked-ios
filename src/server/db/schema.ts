/**
 * Database schema: one Postgres database for accounts, matchmaking, chat,
 * group trips and bookings. Change it here, then run `npm run db:generate`.
 */
import { sql } from "drizzle-orm";
import { boolean, date, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/* Accounts ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  /** Null for demo travelers, who can't sign in. */
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  /** Seeded demo traveler. Lets the prototype feel alive before real users join. */
  isDemo: boolean("is_demo").notNull().default(false),
  /** Demo travelers who like you back as soon as you like them. */
  demoLikesBack: boolean("demo_likes_back").notNull().default(false),
  /** Set by a moderator. A suspended user can't sign in and is hidden from everyone. */
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/** Signed-in devices. Only a SHA-256 hash of the token is stored. */
export const sessions = pgTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Public traveler profile plus private booking preferences. */
export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  gender: text("gender").$type<"woman" | "man">(),
  fromCity: text("from_city"),
  bio: text("bio").notNull().default(""),
  interests: jsonb("interests").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  tint: jsonb("tint").$type<[string, string]>().notNull().default(sql`'["#4FA3B8","#2B3F6B"]'::jsonb`),
  image: text("image"),
  verified: boolean("verified").notNull().default(false),
  style: text("style").$type<"Solo" | "Duo" | "Group">().notNull().default("Solo"),
  budget: text("budget").$type<"Budget" | "Mid-range" | "Premium">().notNull().default("Mid-range"),
  // Booking preferences
  homeAirport: text("home_airport").notNull().default("DXB"),
  seat: text("seat").notNull().default("Window"),
  cabin: text("cabin").notNull().default("Economy"),
  meal: text("meal").notNull().default("Standard"),
  notifications: boolean("notifications").notNull().default(true),
});

/* Matchmaking --------------------------------------------------------------- */

/** The trip a traveler is looking for company on. One current plan each. */
export const travelPlans = pgTable(
  "travel_plans",
  {
    userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
    destination: text("destination").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    flight: text("flight"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("travel_plans_destination_idx").on(t.destination)],
);

/** Who you want to see in Discover. Shape: MatchPrefs in src/lib/matching.ts. */
export const matchPrefs = pgTable("match_prefs", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  prefs: jsonb("prefs").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const swipes = pgTable(
  "swipes",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetId: text("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: text("action").$type<"like" | "pass" | "block">().notNull(),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetId] }), index("swipes_target_idx").on(t.targetId)],
);

/** A mutual like. userA < userB so each pair appears once. */
export const matches = pgTable(
  "matches",
  {
    id: text("id").primaryKey(),
    userA: text("user_a").notNull().references(() => users.id, { onDelete: "cascade" }),
    userB: text("user_b").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("matches_pair_idx").on(t.userA, t.userB), index("matches_b_idx").on(t.userB)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("messages_match_idx").on(t.matchId, t.createdAt)],
);

/* Group trips --------------------------------------------------------------- */

export const groupTrips = pgTable("group_trips", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  destination: text("destination").notNull(),
  dates: text("dates").notNull(),
  image: text("image").notNull(),
  createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: text("group_id").notNull().references(() => groupTrips.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.userId] }), index("group_members_user_idx").on(t.userId)],
);

export const planItems = pgTable(
  "plan_items",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull().references(() => groupTrips.id, { onDelete: "cascade" }),
    day: text("day").notNull(),
    title: text("title").notNull(),
    createdBy: text("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("plan_items_group_idx").on(t.groupId)],
);

/** One vote per member per idea. */
export const planVotes = pgTable(
  "plan_votes",
  {
    itemId: text("item_id").notNull().references(() => planItems.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.userId] })],
);

export const expenses = pgTable(
  "expenses",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull().references(() => groupTrips.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amountCents: integer("amount_cents").notNull(),
    paidBy: text("paid_by").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [index("expenses_group_idx").on(t.groupId)],
);

export const expenseSplits = pgTable(
  "expense_splits",
  {
    expenseId: text("expense_id").notNull().references(() => expenses.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.expenseId, t.userId] })],
);

export const settlements = pgTable(
  "settlements",
  {
    id: text("id").primaryKey(),
    groupId: text("group_id").notNull().references(() => groupTrips.id, { onDelete: "cascade" }),
    fromUser: text("from_user").notNull().references(() => users.id, { onDelete: "cascade" }),
    toUser: text("to_user").notNull().references(() => users.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("settlements_group_idx").on(t.groupId)],
);

/* Bookings ------------------------------------------------------------------ */

/** Flight and hotel bookings. `details` holds the full Trip the app shows. */
export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"flight" | "stay">().notNull(),
    status: text("status").$type<"confirmed" | "cancelled">().notNull().default("confirmed"),
    totalCents: integer("total_cents").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    bookedAt: timestamp("booked_at", { withTimezone: true }).notNull(),
    details: jsonb("details").notNull(),
  },
  (t) => [index("bookings_user_idx").on(t.userId, t.startsAt)],
);

export const visaApplications = pgTable(
  "visa_applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    destination: text("destination").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
    details: jsonb("details").notNull(),
  },
  (t) => [index("visa_user_idx").on(t.userId)],
);

/* Moderation ---------------------------------------------------------------- */

export type ReportReason = "harassment" | "hate" | "sexual" | "spam" | "fake" | "safety" | "underage" | "other";

/**
 * "Report and block" from a profile, chat or group trip. Reviewed by the
 * people listed in UNTHINKED_ADMIN_EMAILS at /admin/reports.
 */
export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetId: text("target_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").$type<ReportReason>().notNull(),
    details: text("details").notNull().default(""),
    /** Where it was reported from: "profile", "chat" or "discover". */
    context: text("context").notNull().default("profile"),
    /** Copy of the reported person's profile and their latest messages to the reporter, kept as evidence. */
    evidence: jsonb("evidence").notNull(),
    status: text("status").$type<"open" | "dismissed" | "suspended">().notNull().default("open"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("reports_status_idx").on(t.status, t.createdAt), index("reports_target_idx").on(t.targetId)],
);
