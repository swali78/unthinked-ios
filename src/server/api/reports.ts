import { and, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { type ReportReason, REPORT_REASONS } from "@/lib/moderation";
import { matches, messages, profiles, reports, sessions, swipes, users } from "../db/schema";
import { type AuthedCtx, forbidden, HttpError, json, notFound, route } from "../http";
import { newId } from "../ids";
import { isModerator, notifyModerators } from "../moderation";

const REASONS = REPORT_REASONS.map((r) => r.id) as [ReportReason, ...ReportReason[]];

const NewReport = z.object({
  targetId: z.string().min(1).max(64),
  reason: z.enum(REASONS),
  details: z.string().trim().max(1000).default(""),
  context: z.enum(["profile", "chat", "discover"]).default("profile"),
});

/** The reported person's profile and their last 20 messages to the reporter, frozen at report time. */
async function evidence(db: Db, reporterId: string, targetId: string) {
  const [p] = await db
    .select({ name: users.name, email: users.email, bio: profiles.bio, fromCity: profiles.fromCity, interests: profiles.interests, age: profiles.age })
    .from(users)
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, targetId))
    .limit(1);
  const msgs = await db
    .select({ text: messages.body, at: messages.createdAt })
    .from(messages)
    .innerJoin(matches, eq(matches.id, messages.matchId))
    .where(
      and(
        eq(messages.senderId, targetId),
        or(and(eq(matches.userA, reporterId), eq(matches.userB, targetId)), and(eq(matches.userA, targetId), eq(matches.userB, reporterId))),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(20);
  return { profile: p ?? null, messages: msgs.reverse().map((m) => ({ text: m.text, at: m.at.getTime() })) };
}

function requireModerator(ctx: AuthedCtx) {
  if (!isModerator(ctx.user.email)) throw forbidden("Only moderators can see reports.");
}

export const reportRoutes = [
  /** Report and block in one step. Reporting the same person again adds another report. */
  route.authed("POST", "/reports", async ({ db, user, body }) => {
    const input = await body(NewReport);
    if (input.targetId === user.id) throw new HttpError(400, "invalid_target", "You can't report yourself.");
    const [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, input.targetId)).limit(1);
    if (!target) throw notFound("Traveler not found.");

    const id = newId("rpt");
    await db.insert(reports).values({
      id, reporterId: user.id, targetId: target.id, reason: input.reason, details: input.details, context: input.context,
      evidence: await evidence(db, user.id, target.id),
    });
    await db
      .insert(swipes)
      .values({ userId: user.id, targetId: target.id, action: "block" })
      .onConflictDoUpdate({ target: [swipes.userId, swipes.targetId], set: { action: "block", createdAt: new Date() } });

    const base = process.env.UNTHINKED_PUBLIC_URL ?? "";
    await notifyModerators(`New report (${input.reason}) against ${target.name}${input.details ? `: "${input.details.slice(0, 200)}"` : ""}. Review: ${base}/admin/reports`);
    return json({ id, blocked: true }, { status: 201 });
  }),

  /** The moderation queue. `?status=open|dismissed|suspended|all`, newest first. */
  route.authed("GET", "/admin/reports", async (ctx) => {
    requireModerator(ctx);
    const status = ctx.url.searchParams.get("status") ?? "open";
    const rows = await ctx.db
      .select()
      .from(reports)
      .where(status === "all" ? undefined : eq(reports.status, status as "open"))
      .orderBy(desc(reports.createdAt))
      .limit(200);
    const ids = [...new Set(rows.flatMap((r) => [r.reporterId, r.targetId]))];
    const people = ids.length
      ? await ctx.db.select({ id: users.id, name: users.name, email: users.email, suspendedAt: users.suspendedAt }).from(users).where(inArray(users.id, ids))
      : [];
    const byId = new Map(people.map((p) => [p.id, p]));
    // How many times each reported person has been reported in total.
    const counts = new Map<string, number>();
    if (rows.length) {
      const all = await ctx.db.select({ targetId: reports.targetId }).from(reports).where(inArray(reports.targetId, [...new Set(rows.map((r) => r.targetId))]));
      for (const r of all) counts.set(r.targetId, (counts.get(r.targetId) ?? 0) + 1);
    }
    return json({
      reports: rows.map((r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        context: r.context,
        status: r.status,
        createdAt: r.createdAt.getTime(),
        reviewedAt: r.reviewedAt?.getTime() ?? null,
        reviewedBy: r.reviewedBy,
        evidence: r.evidence,
        reporter: { id: r.reporterId, name: byId.get(r.reporterId)?.name ?? "Deleted", email: byId.get(r.reporterId)?.email ?? null },
        target: {
          id: r.targetId,
          name: byId.get(r.targetId)?.name ?? "Deleted",
          email: byId.get(r.targetId)?.email ?? null,
          suspended: Boolean(byId.get(r.targetId)?.suspendedAt),
          timesReported: counts.get(r.targetId) ?? 1,
        },
      })),
    });
  }),

  /**
   * Close a report. "suspend" also suspends the reported account (signs them
   * out everywhere, hides them, blocks sign-in) and closes their other open reports.
   */
  route.authed("POST", "/admin/reports/:id", async (ctx) => {
    requireModerator(ctx);
    const { action } = await ctx.body(z.object({ action: z.enum(["dismiss", "suspend", "reopen"]) }));
    const [r] = await ctx.db.select().from(reports).where(eq(reports.id, ctx.params.id)).limit(1);
    if (!r) throw notFound("Report not found.");
    const reviewed = { reviewedBy: ctx.user.email, reviewedAt: new Date() };

    if (action === "reopen") {
      await ctx.db.update(reports).set({ status: "open", reviewedBy: null, reviewedAt: null }).where(eq(reports.id, r.id));
    } else if (action === "dismiss") {
      await ctx.db.update(reports).set({ status: "dismissed", ...reviewed }).where(eq(reports.id, r.id));
    } else {
      await ctx.db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, r.targetId));
      await ctx.db.delete(sessions).where(eq(sessions.userId, r.targetId));
      await ctx.db
        .update(reports)
        .set({ status: "suspended", ...reviewed })
        .where(and(eq(reports.targetId, r.targetId), eq(reports.status, "open")));
    }
    return json({ ok: true });
  }),

  /** Lift a suspension. */
  route.authed("POST", "/admin/users/:id/unsuspend", async (ctx) => {
    requireModerator(ctx);
    const updated = await ctx.db.update(users).set({ suspendedAt: null }).where(eq(users.id, ctx.params.id)).returning({ id: users.id });
    if (!updated.length) throw notFound("User not found.");
    return json({ ok: true });
  }),

  /** Lets the app show the moderation link only to moderators. */
  route.authed("GET", "/admin/me", async ({ user }) => json({ moderator: isModerator(user.email) })),
];
