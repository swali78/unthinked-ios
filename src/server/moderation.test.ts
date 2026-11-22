import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { handleApi } from "./api";

async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const res = await handleApi(
    new Request(`http://test/api/v1${path}`, {
      method,
      headers: { "content-type": "application/json", ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  );
  return { status: res.status, data: await res.json() };
}

let seq = 0;
async function signUp(name: string, email = `mod${++seq}@example.com`) {
  const r = await call("POST", "/auth/signup", { body: { email, password: "correct horse", name } });
  expect(r.status).toBe(201);
  return { token: r.data.token as string, id: r.data.user.id as string, email };
}

const PREFS = {
  destination: "Bali", start: "2026-11-27", end: "2026-12-03", flexible: true, styles: ["Duo", "Group"],
  interests: ["Food"], budget: "Mid-range", showMe: "everyone", ageMin: 18, ageMax: 99, verifiedOnly: false,
};

/** Two real travelers who have matched. */
async function matchedPair() {
  const a = await signUp("Ana");
  const b = await signUp("Ben");
  await call("PUT", "/match/prefs", { token: a.token, body: PREFS });
  await call("PUT", "/match/prefs", { token: b.token, body: PREFS });
  await call("POST", "/match/swipes", { token: a.token, body: { targetId: b.id, action: "like" } });
  expect((await call("POST", "/match/swipes", { token: b.token, body: { targetId: a.id, action: "like" } })).data.match).toBe(true);
  return { a, b };
}

describe("offensive-content filter", () => {
  it("rejects offensive chat messages and keeps clean ones", async () => {
    const { a, b } = await matchedPair();
    const bad = await call("POST", `/chats/${b.id}/messages`, { token: a.token, body: { text: "you're a f u c k i n g idiot, bitch" } });
    expect(bad.status).toBe(422);
    expect(bad.data.error.code).toBe("offensive_content");
    expect((await call("POST", `/chats/${b.id}/messages`, { token: a.token, body: { text: "Landing in Niger, then Nigeria" } })).status).toBe(201);
  });

  it("rejects offensive names, bios and group trip text", async () => {
    expect((await call("POST", "/auth/signup", { body: { email: "x@example.com", password: "correct horse", name: "Sh1thead" } })).status).toBe(422);
    const { token } = await signUp("Kal");
    const bio = await call("PATCH", "/me", { token, body: { bio: "DM me for nudes" } });
    expect(bio.status).toBe(422);
    expect(bio.data.error.details.fieldErrors.bio).toBeTruthy();
    expect((await call("PATCH", "/me", { token, body: { bio: "Street food and sunrise hikes" } })).status).toBe(200);
    const group = (await call("GET", "/together", { token })).data.groups[0];
    expect((await call("POST", `/groups/${group.id}/plan`, { token, body: { title: "Bitch party" } })).status).toBe(422);
    expect((await call("POST", `/groups/${group.id}/expenses`, { token, body: { title: "fucking taxi", amount: 10, paidBy: "me", splitWith: ["me"] } })).status).toBe(422);
  });
});

describe("reports", () => {
  const ADMIN = "owner@example.com";
  let admin: Awaited<ReturnType<typeof signUp>>;
  beforeAll(async () => {
    process.env.UNTHINKED_ADMIN_EMAILS = `someone@else.com, ${ADMIN.toUpperCase()}`;
    admin = await signUp("Owner", ADMIN);
  });
  afterAll(() => {
    delete process.env.UNTHINKED_ADMIN_EMAILS;
  });

  it("reports and blocks, saving the messages as evidence", async () => {
    const { a, b } = await matchedPair();
    await call("POST", `/chats/${a.id}/messages`, { token: b.token, body: { text: "Send me your passport number" } });
    const r = await call("POST", "/reports", { token: a.token, body: { targetId: b.id, reason: "safety", details: "Asked for my passport", context: "chat" } });
    expect(r.status).toBe(201);

    // Blocked both ways.
    expect((await call("POST", `/chats/${a.id}/messages`, { token: b.token, body: { text: "hello?" } })).status).toBe(404);
    expect((await call("GET", "/together", { token: a.token })).data.blocked).toContain(b.id);

    const queue = (await call("GET", "/admin/reports", { token: admin.token })).data.reports;
    const mine = queue.find((x: { id: string }) => x.id === r.data.id);
    expect(mine).toMatchObject({ reason: "safety", status: "open", context: "chat", reporter: { id: a.id }, target: { id: b.id, timesReported: 1 } });
    expect(mine.evidence.messages).toEqual([expect.objectContaining({ text: "Send me your passport number" })]);
  });

  it("only lets moderators see and act on reports", async () => {
    const { a, b } = await matchedPair();
    const { data } = await call("POST", "/reports", { token: a.token, body: { targetId: b.id, reason: "spam" } });
    expect((await call("GET", "/admin/reports", { token: a.token })).status).toBe(403);
    expect((await call("POST", `/admin/reports/${data.id}`, { token: a.token, body: { action: "suspend" } })).status).toBe(403);
    expect((await call("GET", "/admin/me", { token: a.token })).data.moderator).toBe(false);
    expect((await call("GET", "/admin/me", { token: admin.token })).data.moderator).toBe(true);
    expect((await call("POST", "/reports", { token: a.token, body: { targetId: a.id, reason: "spam" } })).status).toBe(400);
  });

  it("dismisses a report", async () => {
    const { a, b } = await matchedPair();
    const { data } = await call("POST", "/reports", { token: a.token, body: { targetId: b.id, reason: "other" } });
    expect((await call("POST", `/admin/reports/${data.id}`, { token: admin.token, body: { action: "dismiss" } })).status).toBe(200);
    const closed = (await call("GET", "/admin/reports?status=dismissed", { token: admin.token })).data.reports;
    expect(closed.find((x: { id: string }) => x.id === data.id)).toMatchObject({ status: "dismissed", reviewedBy: ADMIN });
    expect((await call("GET", "/me", { token: b.token })).status).toBe(200);
  });

  it("suspends: signs them out, blocks sign-in, hides them, and can be lifted", async () => {
    const { a, b } = await matchedPair();
    const c = await signUp("Cat");
    await call("PUT", "/match/prefs", { token: c.token, body: PREFS });
    expect((await call("GET", "/together", { token: c.token })).data.people.map((p: { id: string }) => p.id)).toContain(b.id);

    const { data } = await call("POST", "/reports", { token: a.token, body: { targetId: b.id, reason: "harassment" } });
    expect((await call("POST", `/admin/reports/${data.id}`, { token: admin.token, body: { action: "suspend" } })).status).toBe(200);

    expect((await call("GET", "/me", { token: b.token })).status).toBe(401);
    const login = await call("POST", "/auth/login", { body: { email: b.email, password: "correct horse" } });
    expect(login.status).toBe(403);
    expect(login.data.error.code).toBe("account_suspended");
    expect((await call("GET", "/together", { token: c.token })).data.people.map((p: { id: string }) => p.id)).not.toContain(b.id);
    expect((await call("POST", "/match/swipes", { token: c.token, body: { targetId: b.id, action: "like" } })).status).toBe(404);

    expect((await call("POST", `/admin/users/${b.id}/unsuspend`, { token: admin.token })).status).toBe(200);
    expect((await call("POST", "/auth/login", { body: { email: b.email, password: "correct horse" } })).status).toBe(200);
  });
});
