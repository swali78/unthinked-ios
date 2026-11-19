/**
 * Flight and hotel bookings, and visa applications.
 *
 * The app still prices and "books" against demo inventory, so for now the
 * server stores the confirmed Trip the app sends. When real suppliers and
 * payments arrive (step 4), pricing and confirmation move here.
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { bookings, visaApplications } from "../db/schema";
import { HttpError, json, notFound, route } from "../http";
import { bookingRef } from "../ids";

const ref = z.string().regex(/^[A-Z0-9-]{4,24}$/i, "Use 4–24 letters, digits or dashes.");

const FlightTrip = z
  .object({
    kind: z.literal("flight"),
    id: ref.optional(),
    bookedAt: z.number().int().positive().optional(),
    flight: z.object({ departAt: z.string().datetime({ offset: true }).or(z.string().datetime({ local: true })) }).passthrough(),
    fare: z.enum(["light", "classic", "flex"]),
    seats: z.array(z.string().max(4)).max(9),
    passengers: z.array(z.string().max(80)).min(1).max(9),
    total: z.number().int().nonnegative(),
  })
  .passthrough();

const StayTrip = z
  .object({
    kind: z.literal("stay"),
    id: ref.optional(),
    bookedAt: z.number().int().positive().optional(),
    hotelId: z.string().max(64),
    hotelName: z.string().max(120),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    nights: z.number().int().min(1).max(60),
    guests: z.number().int().min(1).max(12),
    total: z.number().int().nonnegative(),
  })
  .passthrough();

const Trip = z.discriminatedUnion("kind", [FlightTrip, StayTrip]);

const VisaApp = z
  .object({
    id: ref.optional(),
    destination: z.string().trim().min(1).max(80),
    submittedAt: z.number().int().positive().optional(),
  })
  .passthrough();

export const bookingRoutes = [
  /** Your bookings, soonest first, in the app's `Trip` shape plus `status`. */
  route.authed("GET", "/bookings", async ({ db, user }) => {
    const rows = await db.select().from(bookings).where(eq(bookings.userId, user.id)).orderBy(asc(bookings.startsAt));
    return json({ bookings: rows.map((b) => ({ ...(b.details as object), id: b.id, status: b.status })) });
  }),

  /** Save a confirmed booking. Sending the same reference again is a no-op. */
  route.authed("POST", "/bookings", async ({ db, user, body }) => {
    const trip = await body(Trip);
    const id = trip.id ?? bookingRef();
    const bookedAt = trip.bookedAt ?? Date.now();
    const startsAt = trip.kind === "flight" ? new Date(trip.flight.departAt) : new Date(`${trip.checkIn}T15:00:00Z`);
    if (Number.isNaN(startsAt.getTime())) throw new HttpError(400, "invalid_body", "The trip's start date isn't valid.");
    const details = { ...trip, id, bookedAt };
    await db
      .insert(bookings)
      .values({ id, userId: user.id, kind: trip.kind, totalCents: trip.total, startsAt, bookedAt: new Date(bookedAt), details })
      .onConflictDoNothing();
    const [saved] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    if (saved.userId !== user.id) throw new HttpError(409, "reference_taken", "That booking reference is already in use.");
    return json({ booking: { ...(saved.details as object), id: saved.id, status: saved.status } }, { status: 201 });
  }),

  route.authed("POST", "/bookings/:id/cancel", async ({ db, user, params }) => {
    const [b] = await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(and(eq(bookings.id, params.id), eq(bookings.userId, user.id)))
      .returning();
    if (!b) throw notFound("Booking not found.");
    return json({ booking: { ...(b.details as object), id: b.id, status: b.status } });
  }),

  /** Your visa applications, newest first, in the app's `VisaApplication` shape. */
  route.authed("GET", "/visa-applications", async ({ db, user }) => {
    const rows = await db.select().from(visaApplications).where(eq(visaApplications.userId, user.id)).orderBy(desc(visaApplications.submittedAt));
    return json({ applications: rows.map((r) => r.details) });
  }),

  route.authed("POST", "/visa-applications", async ({ db, user, body }) => {
    const app = await body(VisaApp);
    const id = app.id ?? `EV${bookingRef().slice(2)}`;
    const submittedAt = app.submittedAt ?? Date.now();
    const details = { ...app, id, submittedAt };
    await db
      .insert(visaApplications)
      .values({ id, userId: user.id, destination: app.destination, submittedAt: new Date(submittedAt), details })
      .onConflictDoNothing();
    const [saved] = await db.select().from(visaApplications).where(eq(visaApplications.id, id)).limit(1);
    if (saved.userId !== user.id) throw new HttpError(409, "reference_taken", "That application reference is already in use.");
    return json({ application: saved.details }, { status: 201 });
  }),
];
