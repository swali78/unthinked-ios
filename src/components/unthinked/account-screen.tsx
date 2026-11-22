"use client";

import { Cloud, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { session, useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { SerifAccent } from "./primitives";
import { PrimaryButton, Screen, SecondaryButton } from "./screen";

/** Create an account or sign in, so trips, matches and chats follow you across devices. */
export function AccountScreen() {
  const router = useRouter();
  const { status, user } = useSession();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [moderator, setModerator] = useState(false);

  useEffect(() => {
    if (status !== "signed-in") return;
    api<{ moderator: boolean }>("/admin/me")
      .then((r) => setModerator(r.moderator))
      .catch(() => setModerator(false));
  }, [status]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (mode === "signup") await session.signUp(form);
      else await session.signIn({ email: form.email, password: form.password });
      router.push("/profile");
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = Object.fromEntries(Object.entries(err.details?.fieldErrors ?? {}).map(([k, v]) => [k, v[0]]));
        setErrors(Object.keys(fields).length ? fields : { form: err.message });
      } else setErrors({ form: "Couldn't reach the server. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  if (status === "signed-in" && user) {
    return (
      <Screen title={<SerifAccent>Account</SerifAccent>} back="/profile">
        <section className="glass rounded-[26px] p-5">
          <Cloud className="size-6 text-[#E9C99F]" />
          <p className="mt-3 text-[20px] font-medium text-white">Signed in as {user.name}</p>
          <p className="mt-1 text-[13.5px] text-white/55">{user.email}</p>
          <p className="mt-3 text-[13.5px] text-white/65">Your bookings, visa applications, matches, chats and group trips are saved to your account.</p>
        </section>
        {moderator && (
          <Link href="/admin/reports" className="glass mt-3 flex items-center gap-3 rounded-[22px] px-4 py-3.5 transition-transform active:scale-[0.98]">
            <ShieldAlert className="size-4 text-[#E9A58A]" />
            <span className="flex-1 text-[15px] text-white">Review reports</span>
            <ChevronRight className="size-4 text-white/35" />
          </Link>
        )}
        <SecondaryButton
          className="mt-5 w-full"
          onClick={async () => {
            await session.signOut();
            router.push("/profile");
          }}
        >
          <LogOut className="size-4" /> Sign out
        </SecondaryButton>
        <DeleteAccount onDeleted={() => router.push("/profile")} />
      </Screen>
    );
  }

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Screen title={<SerifAccent>{mode === "signup" ? "Create account" : "Sign in"}</SerifAccent>} back="/profile">
      <p className="px-1 text-[14px] text-white/65">
        {mode === "signup"
          ? "Save your trips, matches and chats, and pick up where you left off on any device."
          : "Welcome back. Sign in to see your trips, matches and chats."}
      </p>
      <form onSubmit={submit} className="mt-5 space-y-3" noValidate>
        {mode === "signup" && <Field id="a-name" label="Name" value={form.name} onChange={set("name")} error={errors.name} autoComplete="given-name" />}
        <Field id="a-email" label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Field
          id="a-password"
          label={mode === "signup" ? "Password, at least 8 characters" : "Password"}
          type="password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {errors.form && (
          <p role="alert" className="px-1 text-[13px] text-rose-300">
            {errors.form}
          </p>
        )}
        <PrimaryButton type="submit" disabled={busy} className="!mt-5 w-full">
          {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
        </PrimaryButton>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setErrors({});
        }}
        className="mt-4 w-full text-center text-[14px] text-white/65"
      >
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </Screen>
  );
}

/** Two-step delete: reveal, then confirm with the password. */
function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-6 flex w-full items-center justify-center gap-2 text-[14px] text-rose-300/90">
        <Trash2 className="size-4" /> Delete account
      </button>
    );
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await session.deleteAccount(password);
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="glass mt-6 space-y-3 rounded-[24px] p-4" noValidate>
      <p className="text-[15px] font-medium text-white">Delete your account?</p>
      <p className="text-[13px] leading-snug text-white/60">
        This permanently erases your profile, matches, chats, group trips, bookings and visa applications. It can&apos;t be undone.
      </p>
      <Field id="d-password" label="Enter your password to confirm" type="password" value={password} onChange={setPassword} error={error} autoComplete="current-password" />
      <div className="flex gap-2">
        <SecondaryButton type="button" className="flex-1" onClick={() => setOpen(false)}>
          Cancel
        </SecondaryButton>
        <button
          type="submit"
          disabled={busy || !password}
          className="flex-1 rounded-full bg-rose-500/90 px-4 py-3 text-[15px] font-medium text-white transition-opacity disabled:opacity-50"
        >
          {busy ? "Deleting…" : "Delete forever"}
        </button>
      </div>
    </form>
  );
}

function Field({
  id, label, value, onChange, error, type = "text", autoComplete,
}: { id: string; label: string; value: string; onChange: (v: string) => void; error?: string; type?: string; autoComplete?: string }) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex flex-col rounded-[16px] bg-white/[0.06] px-3 py-2 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]",
          error && "shadow-[inset_0_0_0_1.5px_rgb(251_113_133/0.7)]",
        )}
      >
        <span className="text-[11.5px] text-white/50">{label}</span>
        <input
          id={id}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className="h-7 min-w-0 bg-transparent text-[15px] text-white [color-scheme:dark] focus:outline-none"
        />
      </label>
      {error && (
        <p id={`${id}-err`} className="mt-1 px-1 text-[12px] leading-snug text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
