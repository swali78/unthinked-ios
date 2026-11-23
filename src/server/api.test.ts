import { beforeAll, describe, expect, it } from "vitest";
import { handleApi } from "./api";

/** Call the API like a client would, with an optional session token. */
async function call(method: string, path: string, opts: { token?: string; body?: unknown } = {}) {
  const res = await handleApi(
    new Request(`http://test/api/v1${path}`, {
      method,
      headers: { "content-type": "application/json", ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    }),
  );
  return { status: res.status, headers: res.headers, data: await res.json() };
}

let seq = 0;
async function signUp(name = "Khalid") {
  const email = `traveler${++seq}@example.com`;
  const r = await call("POST", "/auth/signup", { body: { email, password: "correct horse", name } });
  expect(r.status).toBe(201);
  return { token: r.data.token as string, id: r.data.user.id as string, email };
}

const PREFS = {
  destination: "Bali", start: "2026-11-27", end: "2026-12-03", flexible: true, styles: ["Duo", "Group"],
  interests: ["Food", "Hiking"], budget: "Mid-range", showMe: "everyone", ageMin: 21, ageMax: 40, verifiedOnly: false,
};

describe("health", () => {
  it("reports the database", async () => {
    const r = await call("GET", "/health");
    expect(r.status).toBe(200);
    expect(r.data).toEqual({ ok: true, database: "pglite" });
  });
  it("404s unknown paths and 405s wrong methods", async () => {
    expect((await call("GET", "/nope")).status).toBe(404);
    expect((await call("DELETE", "/health")).status).toBe(405);
  });
});

describe("accounts", () => {
  it("signs up, sets a cookie, and reads the account back", async () => {
    const r = await call("POST", "/auth/signup", { body: { email: "Swali@Example.com", password: "long enough", name: "Swali" } });
    expect(r.status).toBe(201);
    expect(r.headers.get("set-cookie")).toMatch(/ut_session=.+HttpOnly/);
    expect(r.data.user.email).toBe("swali@example.com");
    const me = await call("GET", "/me", { token: r.data.token });
    expect(me.data.prefs).toMatchObject({ name: "Swali", homeAirport: "DXB", seat: "Window" });
  });

  it("rejects duplicate emails, short passwords and wrong passwords", async () => {
    const { email } = await signUp();
    expect((await call("POST", "/auth/signup", { body: { email, password: "another one", name: "X" } })).status).toBe(409);
    const short = await call("POST", "/auth/signup", { body: { email: "new@example.com", password: "short", name: "X" } });
    expect(short.status).toBe(400);
    expect(short.data.error.details.fieldErrors.password).toBeTruthy();
    expect((await call("POST", "/auth/login", { body: { email, password: "wrong password" } })).status).toBe(401);
    expect((await call("POST", "/auth/login", { body: { email, password: "correct horse" } })).status).toBe(200);
  });

  it("requires a session and ends it on logout", async () => {
    expect((await call("GET", "/me")).status).toBe(401);
    const { token } = await signUp();
    expect((await call("POST", "/auth/logout", { token })).status).toBe(200);
    expect((await call("GET", "/me", { token })).status).toBe(401);
  });

  it("updates preferences and profile", async () => {
    const { token } = await signUp();
    const r = await call("PATCH", "/me", { token, body: { name: "Kal", seat: "Aisle", age: 30, interests: ["Food"] } });
    expect(r.status).toBe(200);
    expect(r.data.prefs).toMatchObject({ name: "Kal", seat: "Aisle" });
    expect(r.data.profile).toMatchObject({ age: 30, interests: ["Food"] });
    expect((await call("PATCH", "/me", { token, body: { isAdmin: true } })).status).toBe(400);
  });

  it("deletes the account only with the right password", async () => {
    const { token, email } = await signUp();
    expect((await call("DELETE", "/me", { token, body: { password: "wrong password" } })).status).toBe(401);
    expect((await call("GET", "/me", { token })).status).toBe(200);
    const r = await call("DELETE", "/me", { token, body: { password: "correct horse" } });
    expect(r.status).toBe(200);
    expect((await call("GET", "/me", { token })).status).toBe(401);
    expect((await call("POST", "/auth/login", { body: { email, password: "correct horse" } })).status).toBe(401);
    // The email is free to sign up again.
    expect((await call("POST", "/auth/signup", { body: { email, password: "correct horse", name: "Again" } })).status).toBe(201);
  });
});

describe("matchmaking and chat", () => {
  let me: Awaited<ReturnType<typeof signUp>>;
  beforeAll(async () => {
    me = await signUp();
  });

  it("starts with demo travelers and a starter group trip", async () => {
    const s = (await call("GET", "/together", { token: me.token })).data;
    expect(s.people.map((p: { id: string }) => p.id)).toEqual(expect.arrayContaining(["t1", "t2", "t3", "t4", "t5"]));
    expect(s.groups).toHaveLength(1);
    expect(s.groups[0]).toMatchObject({ title: "Bali villa crew", members: ["me", "t1", "t2"] });
    expect(s.groups[0].expenses[0]).toMatchObject({ amount: 900, paidBy: "me", splitWith: ["me", "t1", "t2"] });
  });

  it("saves preferences and ranks candidates", async () => {
    expect((await call("PUT", "/match/prefs", { token: me.token, body: { ...PREFS, end: "2026-01-01" } })).status).toBe(400);
    expect((await call("PUT", "/match/prefs", { token: me.token, body: PREFS })).status).toBe(200);
    const { candidates } = (await call("GET", "/match/candidates", { token: me.token })).data;
    expect(candidates[0].traveler.trip.to).toBe("Bali");
    const scores = candidates.map((c: { compatibility: { score: number } }) => c.compatibility.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("matches with a demo traveler who likes you back, then chats", async () => {
    const like = await call("POST", "/match/swipes", { token: me.token, body: { targetId: "t1", action: "like" } });
    expect(like.data.match).toBe(true);
    const s = (await call("GET", "/together", { token: me.token })).data;
    expect(s.matches).toContain("t1");
    expect(s.chats.t1[0]).toMatchObject({ from: "t1", text: expect.stringContaining("Bali") });

    const sent = await call("POST", "/chats/t1/messages", { token: me.token, body: { text: "Hi Aisha!" } });
    expect(sent.status).toBe(201);
    expect(sent.data.messages.map((m: { from: string }) => m.from)).toEqual(["t1", "me", "t1"]);
  });

  it("doesn't match when they haven't liked you, and won't let you message them", async () => {
    expect((await call("POST", "/match/swipes", { token: me.token, body: { targetId: "t3", action: "like" } })).data.match).toBe(false);
    expect((await call("POST", "/chats/t3/messages", { token: me.token, body: { text: "hi" } })).status).toBe(404);
  });

  it("matches two real travelers once both like each other", async () => {
    const a = await signUp("Ana");
    const b = await signUp("Ben");
    await call("PUT", "/match/prefs", { token: b.token, body: PREFS });
    expect((await call("POST", "/match/swipes", { token: a.token, body: { targetId: b.id, action: "like" } })).data.match).toBe(false);
    const bSees = (await call("GET", "/together", { token: b.token })).data;
    expect(bSees.people.find((p: { id: string }) => p.id === a.id)).toBeUndefined(); // Ana hasn't set a trip yet
    expect((await call("POST", "/match/swipes", { token: b.token, body: { targetId: a.id, action: "like" } })).data.match).toBe(true);
    await call("POST", `/chats/${b.id}/messages`, { token: a.token, body: { text: "Hey Ben" } });
    const chat = (await call("GET", `/chats/${a.id}/messages`, { token: b.token })).data.messages;
    expect(chat).toEqual([expect.objectContaining({ from: a.id, text: "Hey Ben" })]);

    // Blocking hides the match and closes the chat for both.
    await call("POST", "/match/swipes", { token: b.token, body: { targetId: a.id, action: "block" } });
    expect((await call("GET", "/together", { token: a.token })).data.matches).not.toContain(b.id);
    expect((await call("POST", `/chats/${b.id}/messages`, { token: a.token, body: { text: "?" } })).status).toBe(404);
  });

  it("can't swipe on yourself or on someone who doesn't exist", async () => {
    expect((await call("POST", "/match/swipes", { token: me.token, body: { targetId: me.id, action: "like" } })).status).toBe(400);
    expect((await call("POST", "/match/swipes", { token: me.token, body: { targetId: "ghost", action: "like" } })).status).toBe(404);
  });
});

describe("group trips", () => {
  it("plans, votes once per person, splits costs and settles up", async () => {
    const me = await signUp();
    await call("POST", "/match/swipes", { token: me.token, body: { targetId: "t4", action: "like" } });
    const created = await call("POST", "/groups", { token: me.token, body: { withUserId: "t4" } });
    expect(created.status).toBe(201);
    const gid = created.data.group.id;
    expect(created.data.group).toMatchObject({ title: "Bali with Lucas", members: ["me", "t4"] });

    let g = (await call("POST", `/groups/${gid}/plan`, { token: me.token, body: { title: "Surf lesson in Canggu" } })).data.group;
    expect(g.plan[0]).toMatchObject({ day: "Day 1", votes: 1 });
    g = (await call("POST", `/groups/${gid}/plan/${g.plan[0].id}/vote`, { token: me.token })).data.group;
    expect(g.plan[0].votes).toBe(1);
    expect(g.plan[0].votedByMe).toBe(true);
    // Voting is a toggle: taking the vote back, twice, leaves zero.
    g = (await call("DELETE", `/groups/${gid}/plan/${g.plan[0].id}/vote`, { token: me.token })).data.group;
    expect(g.plan[0]).toMatchObject({ votes: 0, votedByMe: false });
    g = (await call("DELETE", `/groups/${gid}/plan/${g.plan[0].id}/vote`, { token: me.token })).data.group;
    expect(g.plan[0].votes).toBe(0);
    g = (await call("POST", `/groups/${gid}/plan/${g.plan[0].id}/vote`, { token: me.token })).data.group;
    expect(g.plan[0]).toMatchObject({ votes: 1, votedByMe: true });

    g = (await call("POST", `/groups/${gid}/expenses`, { token: me.token, body: { title: "Scooters", amount: 40.5, paidBy: "me", splitWith: ["me", "t4"] } })).data.group;
    expect(g.expenses[0]).toMatchObject({ amount: 40.5, paidBy: "me" });
    expect((await call("POST", `/groups/${gid}/expenses`, { token: me.token, body: { title: "x", amount: 5, paidBy: "t1", splitWith: ["me"] } })).status).toBe(400);

    g = (await call("POST", `/groups/${gid}/settlements`, { token: me.token, body: { from: "t4", to: "me", amount: 20.25 } })).data.group;
    expect(g.settled[0]).toMatchObject({ from: "t4", to: "me", amount: 20.25 });
  });

  it("counts one vote per member when two people vote on the same idea", async () => {
    const a = await signUp("Aisha");
    const b = await signUp("Ben");
    await call("POST", "/match/swipes", { token: a.token, body: { targetId: b.id, action: "like" } });
    await call("POST", "/match/swipes", { token: b.token, body: { targetId: a.id, action: "like" } });
    const created = await call("POST", "/groups", { token: a.token, body: { withUserId: b.id } });
    expect(created.status).toBe(201);
    const gid = created.data.group.id;
    let g = (await call("POST", `/groups/${gid}/plan`, { token: a.token, body: { title: "Night market" } })).data.group;
    const item = g.plan[0].id;
    for (let i = 0; i < 3; i++) await call("POST", `/groups/${gid}/plan/${item}/vote`, { token: b.token });
    g = (await call("GET", `/groups/${gid}`, { token: b.token })).data.group;
    expect(g.plan[0]).toMatchObject({ votes: 2, votedByMe: true });
    g = (await call("DELETE", `/groups/${gid}/plan/${item}/vote`, { token: a.token })).data.group;
    expect(g.plan[0]).toMatchObject({ votes: 1, votedByMe: false });
  });

  it("can't start a trip without a match, or open someone else's group", async () => {
    const me = await signUp();
    const other = await signUp();
    expect((await call("POST", "/groups", { token: me.token, body: { withUserId: "t5" } })).status).toBe(404);
    const theirs = (await call("GET", "/together", { token: other.token })).data.groups[0].id;
    expect((await call("GET", `/groups/${theirs}`, { token: me.token })).status).toBe(404);
    expect((await call("POST", `/groups/${theirs}/plan`, { token: me.token, body: { title: "sneaky" } })).status).toBe(404);
  });
});

describe("bookings and visas", () => {
  const flightTrip = {
    kind: "flight", id: "UTTEST1", bookedAt: 1_700_000_000_000, fare: "classic", seats: ["12A"], passengers: ["Khalid Rahman"], total: 45900,
    flight: { id: "f1", flightNumber: "EK 398", from: "DXB", to: "DPS", departAt: "2026-11-27T09:40:00+04:00", arriveAt: "2026-11-27T22:55:00+08:00" },
  };

  it("saves, lists and cancels bookings, idempotently", async () => {
    const me = await signUp();
    expect((await call("POST", "/bookings", { token: me.token, body: flightTrip })).status).toBe(201);
    expect((await call("POST", "/bookings", { token: me.token, body: flightTrip })).status).toBe(201);
    const stay = await call("POST", "/bookings", {
      token: me.token,
      body: { kind: "stay", hotelId: "h1", hotelName: "Ubud Villa", checkIn: "2026-11-20", nights: 3, guests: 2, total: 60000, roomName: "Garden" },
    });
    expect(stay.data.booking.id).toMatch(/^UT/);
    const list = (await call("GET", "/bookings", { token: me.token })).data.bookings;
    expect(list.map((b: { kind: string }) => b.kind)).toEqual(["stay", "flight"]);
    expect((await call("POST", "/bookings/UTTEST1/cancel", { token: me.token })).data.booking.status).toBe("cancelled");
  });

  it("keeps bookings private", async () => {
    const other = await signUp();
    expect((await call("GET", "/bookings", { token: other.token })).data.bookings).toEqual([]);
    expect((await call("POST", "/bookings", { token: other.token, body: flightTrip })).status).toBe(409);
    expect((await call("POST", "/bookings/UTTEST1/cancel", { token: other.token })).status).toBe(404);
  });

  it("validates bookings", async () => {
    const me = await signUp();
    expect((await call("POST", "/bookings", { token: me.token, body: { ...flightTrip, id: undefined, total: -1 } })).status).toBe(400);
    expect((await call("POST", "/bookings", { token: me.token, body: { kind: "cruise" } })).status).toBe(400);
  });

  it("saves visa applications", async () => {
    const me = await signUp();
    const r = await call("POST", "/visa-applications", { token: me.token, body: { destination: "Indonesia", nationality: "India", type: "eVisa", fee: 3500 } });
    expect(r.status).toBe(201);
    const apps = (await call("GET", "/visa-applications", { token: me.token })).data.applications;
    expect(apps).toEqual([expect.objectContaining({ destination: "Indonesia", id: r.data.application.id })]);
  });
});
