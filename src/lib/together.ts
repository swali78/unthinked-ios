"use client";

/**
 * "Travel together": travel buddies, chats, group trips and shared costs.
 * Signed out, demo data is saved on the device (localStorage).
 * Signed in, every action goes to the API and the state comes back from the server.
 */
import { useSyncExternalStore } from "react";
import { api } from "./api";
import { findOffensive, OFFENSIVE_MESSAGE, type ReportReason } from "./moderation";
import { onSessionChange } from "./session";
import { img, TRAVELERS, type MatchPrefs, type Traveler } from "./matching";

export * from "./matching";

export type Expense = { id: string; title: string; amount: number; paidBy: string; splitWith: string[] };
export type PlanItem = { id: string; day: string; title: string; votes: number };
export type Settlement = { id: string; from: string; to: string; amount: number };
export type GroupTrip = {
  id: string;
  title: string;
  destination: string;
  dates: string;
  image: string;
  members: string[]; // "me" plus traveler ids
  plan: PlanItem[];
  expenses: Expense[];
  settled: Settlement[];
};
export type ChatMsg = { id: string; from: string; text: string; at: number };

export type TogetherState = {
  /** Travelers you can discover, chat or travel with. */
  people: Traveler[];
  liked: string[];
  passed: string[];
  blocked: string[];
  matches: string[];
  chats: Record<string, ChatMsg[]>;
  groups: GroupTrip[];
  /** Null until the traveler sets up matchmaking. */
  prefs: MatchPrefs | null;
};

const SEED_GROUP: GroupTrip = {
  id: "g1",
  title: "Bali villa crew",
  destination: "Bali",
  dates: "27 Nov – 3 Dec",
  image: img("photo-1559628233-100c798642d4"),
  members: ["me", "t1", "t2"],
  plan: [
    { id: "p1", day: "Day 1", title: "Land at DPS, check in to the Ubud villa", votes: 3 },
    { id: "p2", day: "Day 2", title: "Sunrise trek on Mount Batur", votes: 2 },
    { id: "p3", day: "Day 3", title: "Uluwatu temple and beach clubs", votes: 3 },
  ],
  expenses: [
    { id: "e1", title: "Villa, 6 nights", amount: 900, paidBy: "me", splitWith: ["me", "t1", "t2"] },
    { id: "e2", title: "Airport transfer", amount: 45, paidBy: "t1", splitWith: ["me", "t1", "t2"] },
  ],
  settled: [],
};

const INITIAL: TogetherState = { people: TRAVELERS, liked: [], passed: [], blocked: [], matches: [], chats: {}, groups: [SEED_GROUP], prefs: null };
const KEY = "unthinked.together.v1";

/*
 * Tiny external store. Signed out it's saved in localStorage. Signed in,
 * each action updates the screen straight away, calls the API, then reloads
 * the state from the server, which is the source of truth.
 */

let state: TogetherState = INITIAL;
let loaded = false;
let remote = false;
const listeners = new Set<() => void>();

function readLocal(): TogetherState {
  try {
    const raw = localStorage.getItem(KEY);
    // People always come from the app's demo data when signed out.
    if (raw) return { ...INITIAL, ...JSON.parse(raw), people: TRAVELERS };
  } catch {}
  return INITIAL;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = readLocal();
  onSessionChange((user) => {
    remote = !!user;
    state = remote ? { ...INITIAL, groups: [] } : readLocal();
    emit();
    if (remote) void refresh();
  });
}

const emit = () => listeners.forEach((l) => l());

function set(fn: (s: TogetherState) => TogetherState) {
  load();
  state = fn(state);
  if (!remote) {
    try {
      const saved: Partial<TogetherState> = { ...state };
      delete saved.people;
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {}
  }
  emit();
}

/** Reload everything from the server. */
async function refresh() {
  try {
    const next = await api<TogetherState>("/together");
    if (remote) {
      state = next;
      emit();
    }
  } catch (err) {
    console.warn("[together] couldn't load from the server", err);
  }
}

/** Run an API call after an optimistic update, then resync either way. */
function sync(call: () => Promise<unknown>) {
  if (!remote) return;
  call()
    .catch((err) => console.warn("[together] request failed", err))
    .finally(refresh);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useTogether() {
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => INITIAL,
  );
}

/** A traveler you can see: from the server when signed in, else the demo data. */
export const travelerById = (id: string): Traveler | undefined => state.people.find((t) => t.id === id) ?? TRAVELERS.find((t) => t.id === id);

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export const together = {
  setPrefs(prefs: MatchPrefs) {
    set((s) => ({ ...s, prefs }));
    sync(() => api("/match/prefs", { method: "PUT", body: prefs }));
  },
  /** Returns true when it's a match. */
  like(id: string) {
    const t = travelerById(id);
    const match = !!t?.likesYou;
    set((s) => ({
      ...s,
      liked: [...new Set([...s.liked, id])],
      matches: match ? [...new Set([...s.matches, id])] : s.matches,
      chats: match && t && !s.chats[id] && !remote
        ? { ...s.chats, [id]: [{ id: uid("m"), from: id, text: `Hey! Saw you're heading to ${t.trip.to} too 👋`, at: Date.now() }] }
        : s.chats,
    }));
    sync(() => api("/match/swipes", { method: "POST", body: { targetId: id, action: "like" } }));
    return match;
  },
  pass(id: string) {
    set((s) => ({ ...s, passed: [...new Set([...s.passed, id])] }));
    sync(() => api("/match/swipes", { method: "POST", body: { targetId: id, action: "pass" } }));
  },
  /**
   * Report and block. Signed in, the report goes to the moderation queue with
   * the conversation attached; signed out (demo profiles) it only blocks.
   */
  async report(id: string, input: { reason: ReportReason; details?: string; context: "profile" | "chat" | "discover" }) {
    set((s) => ({ ...s, blocked: [...new Set([...s.blocked, id])], matches: s.matches.filter((m) => m !== id) }));
    if (!remote) return;
    try {
      await api("/reports", { method: "POST", body: { targetId: id, ...input } });
    } finally {
      void refresh();
    }
  },
  block(id: string) {
    set((s) => ({ ...s, blocked: [...new Set([...s.blocked, id])], matches: s.matches.filter((m) => m !== id) }));
    sync(() => api("/match/swipes", { method: "POST", body: { targetId: id, action: "block" } }));
  },
  /** Returns an error to show instead of sending, or null once sent. */
  send(id: string, text: string): string | null {
    if (findOffensive(text)) return OFFENSIVE_MESSAGE;
    set((s) => ({ ...s, chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), { id: uid("m"), from: "me", text, at: Date.now() }] } }));
    if (remote) {
      sync(() => api(`/chats/${encodeURIComponent(id)}/messages`, { method: "POST", body: { text } }));
      return null;
    }
    setTimeout(() => {
      set((s) => ({
        ...s,
        chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), { id: uid("m"), from: id, text: "Love it. Let's start a group trip so we can plan and split costs.", at: Date.now() }] },
      }));
    }, 1300);
    return null;
  },
  /** Resolves to the new group trip's id. */
  async startTrip(withId: string): Promise<string> {
    load();
    if (remote) {
      const { group } = await api<{ group: GroupTrip }>("/groups", { method: "POST", body: { withUserId: withId } });
      set((s) => ({ ...s, groups: [group, ...s.groups.filter((g) => g.id !== group.id)] }));
      void refresh();
      return group.id;
    }
    const t = travelerById(withId)!;
    const g: GroupTrip = {
      id: uid("g"), title: `${t.trip.to} with ${t.name}`, destination: t.trip.to, dates: t.trip.dates, image: t.image,
      members: ["me", withId], plan: [], expenses: [], settled: [],
    };
    set((s) => ({ ...s, groups: [g, ...s.groups] }));
    return g.id;
  },
  addPlan(gid: string, title: string): string | null {
    if (findOffensive(title)) return OFFENSIVE_MESSAGE;
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, plan: [...g.plan, { id: uid("p"), day: `Day ${g.plan.length + 1}`, title, votes: 1 }] } : g)) }));
    sync(() => api(`/groups/${gid}/plan`, { method: "POST", body: { title } }));
    return null;
  },
  vote(gid: string, pid: string) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, plan: g.plan.map((p) => (p.id === pid ? { ...p, votes: p.votes + 1 } : p)) } : g)) }));
    sync(() => api(`/groups/${gid}/plan/${pid}/vote`, { method: "POST" }));
  },
  addExpense(gid: string, e: Omit<Expense, "id">): string | null {
    if (findOffensive(e.title)) return OFFENSIVE_MESSAGE;
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, expenses: [...g.expenses, { ...e, id: uid("e") }] } : g)) }));
    sync(() => api(`/groups/${gid}/expenses`, { method: "POST", body: e }));
    return null;
  },
  settle(gid: string, from: string, to: string, amount: number) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, settled: [...g.settled, { id: uid("s"), from, to, amount }] } : g)) }));
    sync(() => api(`/groups/${gid}/settlements`, { method: "POST", body: { from, to, amount } }));
  },
};

/** Who owes whom after settlements, simplified to a few transfers. */
export function balances(g: GroupTrip): { from: string; to: string; amount: number }[] {
  const net: Record<string, number> = Object.fromEntries(g.members.map((m) => [m, 0]));
  for (const e of g.expenses) {
    const share = e.amount / e.splitWith.length;
    net[e.paidBy] = (net[e.paidBy] ?? 0) + e.amount;
    for (const m of e.splitWith) net[m] = (net[m] ?? 0) - share;
  }
  for (const s of g.settled) {
    net[s.from] += s.amount;
    net[s.to] -= s.amount;
  }
  const debtors = Object.entries(net).filter(([, v]) => v < -0.01).map(([id, v]) => ({ id, v: -v }));
  const creditors = Object.entries(net).filter(([, v]) => v > 0.01).map(([id, v]) => ({ id, v }));
  const out: { from: string; to: string; amount: number }[] = [];
  for (const d of debtors)
    for (const c of creditors) {
      if (d.v <= 0.01) break;
      if (c.v <= 0.01) continue;
      const amt = Math.min(d.v, c.v);
      out.push({ from: d.id, to: c.id, amount: Math.round(amt * 100) / 100 });
      d.v -= amt;
      c.v -= amt;
    }
  return out;
}

export const nameOf = (id: string) => (id === "me" ? "You" : travelerById(id)?.name ?? "Someone");
