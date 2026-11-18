"use client";

/**
 * "Travel together": travel buddies, chats, group trips and shared costs.
 * Demo data saved on the device (localStorage); swap the actions for API calls later.
 */
import { useSyncExternalStore } from "react";

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export type TravelStyle = "Solo" | "Duo" | "Group";

export type Traveler = {
  id: string;
  name: string;
  age: number;
  from: string;
  /** Avatar gradient, from the orb palette. */
  tint: [string, string];
  verified: boolean;
  style: TravelStyle;
  likesYou: boolean;
  bio: string;
  interests: string[];
  trip: { to: string; dates: string; flight: string; sameFlight: boolean };
  budget: string;
  image: string;
};

export const TRAVELERS: Traveler[] = [
  {
    id: "t1", name: "Aisha", age: 27, from: "Dubai", tint: ["#C9785A", "#E9C99F"], verified: true, style: "Duo", likesYou: true,
    bio: "Sunrise hikes, street food, zero plans before noon.", interests: ["Hiking", "Food", "Photos"],
    trip: { to: "Bali", dates: "27 Nov – 3 Dec", flight: "EK 398", sameFlight: true }, budget: "Mid-range", image: img("photo-1537996194471-e657df975ab4"),
  },
  {
    id: "t2", name: "Rahul", age: 31, from: "Kochi", tint: ["#4FA3B8", "#2B3F6B"], verified: true, style: "Group", likesYou: true,
    bio: "Looking for 3–4 people to split a villa in Ubud.", interests: ["Villas", "Surfing", "Cafés"],
    trip: { to: "Bali", dates: "28 Nov – 4 Dec", flight: "EK 398", sameFlight: false }, budget: "Budget", image: img("photo-1555400038-63f5ba517a47"),
  },
  {
    id: "t3", name: "Sofia", age: 25, from: "Abu Dhabi", tint: ["#E9C99F", "#4FA3B8"], verified: true, style: "Solo", likesYou: false,
    bio: "Solo but social. Happy to share taxis and dinners.", interests: ["Museums", "Night markets"],
    trip: { to: "Istanbul", dates: "5 – 10 Dec", flight: "TK 761", sameFlight: false }, budget: "Mid-range", image: img("photo-1524231757912-21f4fe3a7200"),
  },
  {
    id: "t4", name: "Lucas", age: 28, from: "Dubai", tint: ["#2B3F6B", "#C9785A"], verified: true, style: "Solo", likesYou: true,
    bio: "Two weeks in Bali, remote working. Coworking buddies welcome.", interests: ["Coworking", "Yoga"],
    trip: { to: "Bali", dates: "26 Nov – 10 Dec", flight: "EK 398", sameFlight: true }, budget: "Budget", image: img("photo-1573790387438-4da905039392"),
  },
  {
    id: "t5", name: "Mei", age: 33, from: "Singapore", tint: ["#4FA3B8", "#E9C99F"], verified: true, style: "Group", likesYou: true,
    bio: "Six-person food tour. Two spots left.", interests: ["Food", "Temples"],
    trip: { to: "Tokyo", dates: "20 – 27 Dec", flight: "SQ 638", sameFlight: false }, budget: "Mid-range", image: img("photo-1540959733332-eab4deabeeaf"),
  },
];

export const travelerById = (id: string) => TRAVELERS.find((t) => t.id === id);

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
  liked: string[];
  passed: string[];
  blocked: string[];
  matches: string[];
  chats: Record<string, ChatMsg[]>;
  groups: GroupTrip[];
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

const INITIAL: TogetherState = { liked: [], passed: [], blocked: [], matches: [], chats: {}, groups: [SEED_GROUP] };
const KEY = "unthinked.together.v1";

/* Tiny external store over localStorage ------------------------------------ */

let state: TogetherState = INITIAL;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...INITIAL, ...JSON.parse(raw) };
  } catch {}
}

function set(fn: (s: TogetherState) => TogetherState) {
  load();
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((l) => l());
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

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export const together = {
  /** Returns true when it's a match. */
  like(id: string) {
    const t = travelerById(id);
    const match = !!t?.likesYou;
    set((s) => ({
      ...s,
      liked: [...new Set([...s.liked, id])],
      matches: match ? [...new Set([...s.matches, id])] : s.matches,
      chats: match && t && !s.chats[id]
        ? { ...s.chats, [id]: [{ id: uid("m"), from: id, text: `Hey! Saw you're heading to ${t.trip.to} too 👋`, at: Date.now() }] }
        : s.chats,
    }));
    return match;
  },
  pass(id: string) {
    set((s) => ({ ...s, passed: [...new Set([...s.passed, id])] }));
  },
  block(id: string) {
    set((s) => ({ ...s, blocked: [...new Set([...s.blocked, id])], matches: s.matches.filter((m) => m !== id) }));
  },
  send(id: string, text: string) {
    set((s) => ({ ...s, chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), { id: uid("m"), from: "me", text, at: Date.now() }] } }));
    setTimeout(() => {
      set((s) => ({
        ...s,
        chats: { ...s.chats, [id]: [...(s.chats[id] ?? []), { id: uid("m"), from: id, text: "Love it. Let's start a group trip so we can plan and split costs.", at: Date.now() }] },
      }));
    }, 1300);
  },
  startTrip(withId: string) {
    const t = travelerById(withId)!;
    const g: GroupTrip = {
      id: uid("g"), title: `${t.trip.to} with ${t.name}`, destination: t.trip.to, dates: t.trip.dates, image: t.image,
      members: ["me", withId], plan: [], expenses: [], settled: [],
    };
    set((s) => ({ ...s, groups: [g, ...s.groups] }));
    return g.id;
  },
  addPlan(gid: string, title: string) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, plan: [...g.plan, { id: uid("p"), day: `Day ${g.plan.length + 1}`, title, votes: 1 }] } : g)) }));
  },
  vote(gid: string, pid: string) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, plan: g.plan.map((p) => (p.id === pid ? { ...p, votes: p.votes + 1 } : p)) } : g)) }));
  },
  addExpense(gid: string, e: Omit<Expense, "id">) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, expenses: [...g.expenses, { ...e, id: uid("e") }] } : g)) }));
  },
  settle(gid: string, from: string, to: string, amount: number) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === gid ? { ...g, settled: [...g.settled, { id: uid("s"), from, to, amount }] } : g)) }));
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
