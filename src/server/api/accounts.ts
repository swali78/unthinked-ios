import { eq } from "drizzle-orm";
import { z } from "zod";
import { clearedSessionCookie, createSession, deleteSession, hashPassword, readToken, sessionCookie, verifyPassword } from "../auth";
import type { Db } from "../db";
import { profiles, users } from "../db/schema";
import { seedStarterGroup } from "../demo";
import { HttpError, json, route } from "../http";
import { assertClean } from "../moderation";
import { newId } from "../ids";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8, "Use at least 8 characters.").max(200);

const SignUp = z.object({ email, password, name: z.string().trim().min(1).max(40) });
const SignIn = z.object({ email, password: z.string().min(1).max(200) });
const DeleteAccount = z.object({ password: z.string().min(1).max(200) });

const ProfilePatch = z
  .object({
    name: z.string().trim().min(1).max(40),
    // Booking preferences
    homeAirport: z.string().trim().length(3).toUpperCase(),
    seat: z.enum(["Window", "Aisle", "No preference"]),
    cabin: z.enum(["Economy", "Premium", "Business", "First"]),
    meal: z.enum(["Standard", "Vegetarian", "Halal", "Vegan"]),
    notifications: z.boolean(),
    // Traveler profile shown in matchmaking
    age: z.number().int().min(18).max(100),
    gender: z.enum(["woman", "man"]),
    fromCity: z.string().trim().max(60),
    bio: z.string().trim().max(300),
    interests: z.array(z.string().trim().min(1).max(30)).max(12),
    style: z.enum(["Solo", "Duo", "Group"]),
    budget: z.enum(["Budget", "Mid-range", "Premium"]),
  })
  .partial()
  .strict();

async function account(db: Db, userId: string) {
  const [row] = await db
    .select()
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) throw new HttpError(404, "not_found", "Account not found.");
  const { users: u, profiles: p } = row;
  return {
    user: { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt },
    /** Same shape as `Prefs` in the app's booking store. */
    prefs: { name: u.name, homeAirport: p.homeAirport, seat: p.seat, cabin: p.cabin, meal: p.meal, notifications: p.notifications },
    profile: { age: p.age, gender: p.gender, fromCity: p.fromCity, bio: p.bio, interests: p.interests, tint: p.tint, image: p.image, verified: p.verified, style: p.style, budget: p.budget },
  };
}

async function signedIn(db: Db, userId: string, status = 200) {
  const { token, expiresAt } = await createSession(db, userId);
  // The token is in the body too, for the native apps, which can't read httpOnly cookies.
  return json({ ...(await account(db, userId)), token, expiresAt }, { status, headers: { "set-cookie": sessionCookie(token, expiresAt) } });
}

export const accountRoutes = [
  route.public("POST", "/auth/signup", async ({ db, body }) => {
    const input = await body(SignUp);
    assertClean({ name: input.name });
    const id = newId("usr");
    const passwordHash = await hashPassword(input.password);
    const inserted = await db.insert(users).values({ id, email: input.email, passwordHash, name: input.name }).onConflictDoNothing().returning({ id: users.id });
    if (!inserted.length) throw new HttpError(409, "email_taken", "There's already an account with that email.");
    await db.insert(profiles).values({ userId: id });
    await seedStarterGroup(db, id);
    return signedIn(db, id, 201);
  }),

  route.public("POST", "/auth/login", async ({ db, body }) => {
    const input = await body(SignIn);
    const [u] = await db.select({ id: users.id, passwordHash: users.passwordHash, suspendedAt: users.suspendedAt }).from(users).where(eq(users.email, input.email)).limit(1);
    // Same answer whether the email or the password is wrong.
    if (!u || !(await verifyPassword(input.password, u.passwordHash))) throw new HttpError(401, "invalid_credentials", "That email and password don't match.");
    if (u.suspendedAt) throw new HttpError(403, "account_suspended", "This account has been suspended for breaking our community rules. Contact support if you think this is a mistake.");
    return signedIn(db, u.id);
  }),

  route.public("POST", "/auth/logout", async ({ db, req }) => {
    const token = readToken(req);
    if (token) await deleteSession(db, token);
    return json({ ok: true }, { headers: { "set-cookie": clearedSessionCookie() } });
  }),

  route.authed("GET", "/me", async ({ db, user }) => json(await account(db, user.id))),

  route.authed("PATCH", "/me", async ({ db, user, body }) => {
    const { name, ...rest } = await body(ProfilePatch);
    assertClean({ name, fromCity: rest.fromCity, bio: rest.bio, interests: rest.interests?.join(" ") });
    if (name) await db.update(users).set({ name }).where(eq(users.id, user.id));
    if (Object.keys(rest).length) await db.update(profiles).set(rest).where(eq(profiles.userId, user.id));
    return json(await account(db, user.id));
  }),

  // Required by the App Store (guideline 5.1.1(v)) and Google Play. Every table
  // references users with ON DELETE CASCADE, so this erases sessions, profile,
  // swipes, matches, messages, group trips, bookings and visa applications.
  route.authed("DELETE", "/me", async ({ db, user, body }) => {
    const { password } = await body(DeleteAccount);
    const [u] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!u || !(await verifyPassword(password, u.passwordHash))) throw new HttpError(401, "invalid_credentials", "That password isn't right.");
    await db.delete(users).where(eq(users.id, user.id));
    return json({ ok: true }, { headers: { "set-cookie": clearedSessionCookie() } });
  }),
];
