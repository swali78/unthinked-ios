"use client";

import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  BUDGETS,
  DEFAULT_PREFS,
  DESTINATIONS,
  INTERESTS,
  type MatchPrefs,
  type TravelStyle,
  rangeLabel,
  together,
  useTogether,
} from "@/lib/together";
import { Chip, SerifAccent, Switch } from "./primitives";
import { PrimaryButton, Screen, SectionLabel, Stepper } from "./screen";

const STYLES: { id: TravelStyle; note: string }[] = [
  { id: "Solo", note: "Share taxis and dinners" },
  { id: "Duo", note: "One travel buddy" },
  { id: "Group", note: "3 or more, split a villa" },
];

const SHOW_ME: { id: MatchPrefs["showMe"]; label: string }[] = [
  { id: "everyone", label: "Everyone" },
  { id: "women", label: "Women" },
  { id: "men", label: "Men" },
];

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/**
 * Matchmaking setup: your trip and who you'd like to meet. Shown the first
 * time someone opens Travel together, and from the trip pill afterwards.
 */
export function TogetherSetup() {
  const saved = useTogether().prefs;
  // Saved prefs only exist client-side, so seed from them once they've loaded.
  return <SetupForm key={saved ? "saved" : "new"} initial={saved ?? DEFAULT_PREFS} />;
}

function SetupForm({ initial }: { initial: MatchPrefs }) {
  const router = useRouter();
  const [p, setP] = useState<MatchPrefs>(initial);
  const update = (patch: Partial<MatchPrefs>) => setP((cur) => ({ ...cur, ...patch }));

  const datesOk = p.start <= p.end;
  const ready = datesOk && p.interests.length > 0 && p.styles.length > 0;

  const save = () => {
    together.setPrefs(p);
    router.push("/together");
  };

  return (
    <Screen
      title={<>Your <SerifAccent>match</SerifAccent> profile</>}
      back="/together"
      footer={
        <PrimaryButton className="w-full" disabled={!ready} onClick={save}>
          Show my matches
        </PrimaryButton>
      }
    >
      <p className="px-1 text-[13.5px] leading-snug text-white/60">
        Tell us about your trip. We&apos;ll match you with verified travelers going to the same place, at the same time,
        who travel the way you do.
      </p>

      <SectionLabel className="mt-6">Where to</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {DESTINATIONS.map((d) => (
          <Chip key={d} selected={p.destination === d} onClick={() => update({ destination: d })}>
            <MapPin className="-ml-1 mr-1.5 size-3.5" />
            {d}
          </Chip>
        ))}
      </div>

      <SectionLabel className="mt-6">When</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Arrive" value={p.start} onChange={(start) => update({ start })} />
        <DateField label="Leave" value={p.end} min={p.start} onChange={(end) => update({ end })} />
      </div>
      {!datesOk && <p className="mt-2 px-1 text-[13px] text-amber-300/90">Pick a leave date after you arrive.</p>}
      <label className="glass mt-3 flex items-center gap-3 rounded-[22px] px-4 py-3">
        <span className="flex-1">
          <span className="block text-[15px] text-white">My dates are flexible</span>
          <span className="block text-[12.5px] text-white/50">Include people arriving up to 3 days apart</span>
        </span>
        <Switch checked={p.flexible} onChange={(flexible) => update({ flexible })} label="Flexible dates" />
      </label>

      <SectionLabel className="mt-6">How you like to travel</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {STYLES.map((s) => {
          const on = p.styles.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => update({ styles: toggle(p.styles, s.id) })}
              className={cn(
                "flex flex-col items-start rounded-[20px] p-3 text-left transition-[background,transform] active:scale-[0.97]",
                on ? "bg-white text-black" : "glass-thin text-white",
              )}
            >
              <span className="text-[15px] font-medium">{s.id}</span>
              <span className={cn("mt-1 text-[11.5px] leading-tight", on ? "text-black/60" : "text-white/50")}>{s.note}</span>
            </button>
          );
        })}
      </div>

      <SectionLabel className="mt-6">What you&apos;re into</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {INTERESTS.map((i) => (
          <Chip key={i} selected={p.interests.includes(i)} onClick={() => update({ interests: toggle(p.interests, i) })}>
            {i}
          </Chip>
        ))}
      </div>

      <SectionLabel className="mt-6">Budget</SectionLabel>
      <div className="glass-thin grid grid-cols-3 gap-1 rounded-full p-1">
        {BUDGETS.map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={p.budget === b}
            onClick={() => update({ budget: b })}
            className={cn(
              "h-10 rounded-full text-[13.5px] font-medium transition-colors",
              p.budget === b ? "bg-white text-black" : "text-white/75",
            )}
          >
            {b}
          </button>
        ))}
      </div>

      <SectionLabel className="mt-6">Show me</SectionLabel>
      <div className="flex gap-2">
        {SHOW_ME.map((o) => (
          <Chip key={o.id} selected={p.showMe === o.id} onClick={() => update({ showMe: o.id })}>
            {o.label}
          </Chip>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="glass flex flex-col gap-1.5 rounded-[22px] px-3 py-2.5">
          <span className="pl-1 text-[12px] text-white/55">Youngest</span>
          <Stepper label="minimum age" value={p.ageMin} min={18} max={p.ageMax} onChange={(ageMin) => update({ ageMin })} />
        </div>
        <div className="glass flex flex-col gap-1.5 rounded-[22px] px-3 py-2.5">
          <span className="pl-1 text-[12px] text-white/55">Oldest</span>
          <Stepper label="maximum age" value={p.ageMax} min={p.ageMin} max={80} onChange={(ageMax) => update({ ageMax })} />
        </div>
      </div>

      <label className="glass mt-3 flex items-center gap-3 rounded-[22px] px-4 py-3">
        <ShieldCheck className="size-5 shrink-0 text-[#4FA3B8]" />
        <span className="flex-1">
          <span className="block text-[15px] text-white">Verified travelers only</span>
          <span className="block text-[12.5px] text-white/50">People who&apos;ve confirmed their ID and booking</span>
        </span>
        <Switch checked={p.verifiedOnly} onChange={(verifiedOnly) => update({ verifiedOnly })} label="Verified travelers only" />
      </label>

      <p className="mt-5 px-1 text-[12px] leading-snug text-white/40">
        Others see your first name, age, destination and {rangeLabel(p.start, p.end)} dates. Your flight and hotel stay
        private until you match.
      </p>
    </Screen>
  );
}

function DateField({ label, value, min, onChange }: { label: string; value: string; min?: string; onChange: (v: string) => void }) {
  return (
    <label className="glass relative flex flex-col justify-center rounded-[22px] px-4 py-3">
      <span className="text-[12px] text-white/55">{label}</span>
      <span className="mt-0.5 flex items-center gap-2 text-[16px] text-white">
        <CalendarDays className="size-4 text-white/60" />
        {new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
      </span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]"
        aria-label={`${label} date`}
      />
    </label>
  );
}
