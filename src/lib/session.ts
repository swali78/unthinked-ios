"use client";

/**
 * Who's signed in. Signed out, the app keeps working on demo data saved on
 * the device; signed in, the stores sync with the server.
 */
import { useSyncExternalStore } from "react";
import { api } from "./api";

export type SessionUser = { id: string; email: string | null; name: string };
type SessionState = { status: "loading" | "signed-in" | "signed-out"; user: SessionUser | null };

let state: SessionState = { status: "loading", user: null };
let started = false;
const listeners = new Set<() => void>();
const watchers = new Set<(user: SessionUser | null) => void>();

function setUser(user: SessionUser | null) {
  const changed = state.user?.id !== user?.id || state.status === "loading";
  state = { status: user ? "signed-in" : "signed-out", user };
  listeners.forEach((l) => l());
  if (changed) watchers.forEach((w) => w(user));
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  api<{ user: SessionUser }>("/me")
    .then((r) => setUser(r.user))
    .catch(() => setUser(null));
}

/** Call `fn` now if the session is known, and whenever the signed-in user changes. */
export function onSessionChange(fn: (user: SessionUser | null) => void) {
  start();
  watchers.add(fn);
  if (state.status !== "loading") fn(state.user);
  return () => {
    watchers.delete(fn);
  };
}

export function useSession() {
  return useSyncExternalStore(
    (l) => {
      start();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}

type AuthResponse = { user: SessionUser };

export const session = {
  async signUp(input: { name: string; email: string; password: string }) {
    const r = await api<AuthResponse>("/auth/signup", { method: "POST", body: input });
    setUser(r.user);
    return r.user;
  },
  async signIn(input: { email: string; password: string }) {
    const r = await api<AuthResponse>("/auth/login", { method: "POST", body: input });
    setUser(r.user);
    return r.user;
  },
  async signOut() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  },
};
