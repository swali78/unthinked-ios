"use client";

import { BadgeCheck, CalendarDays, Flag, Heart, MapPin, Plane, Sparkles, Users, Wallet, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { photo } from "@/lib/photo";
import { compatibility, type MatchFactor, type Traveler, together, travelerById, useTogether } from "@/lib/together";
import { cn } from "@/lib/utils";
import { SerifAccent } from "./primitives";
import { PrimaryButton, Screen, SecondaryButton, SectionLabel } from "./screen";
import { Avatar, MatchCelebration } from "./together-discover";
import { ReportSheet } from "./together-report";

const FACTOR_ICON: Record<MatchFactor["key"], typeof MapPin> = {
  place: MapPin,
  dates: CalendarDays,
  interests: Heart,
  style: Users,
  budget: Wallet,
};

/** Full traveler profile, with why you'd travel well together. */
export function TogetherProfile() {
  const id = useSearchParams().get("id") ?? "";
  const t = travelerById(id);
  const s = useTogether();
  const router = useRouter();
  const [match, setMatch] = useState<Traveler | null>(null);
  const [reporting, setReporting] = useState(false);

  if (!t) {
    return (
      <Screen title="Traveler" back="/together">
        <p className="pt-10 text-center text-[15px] text-white/60">This traveler isn&apos;t available any more.</p>
      </Screen>
    );
  }

  const fit = s.prefs ? compatibility(s.prefs, t) : null;
  const matched = s.matches.includes(t.id);
  const liked = s.liked.includes(t.id);

  const connect = () => {
    if (together.like(t.id)) setMatch(t);
    else router.push("/together");
  };
  const pass = () => {
    together.pass(t.id);
    router.push("/together");
  };

  return (
    <Screen
      title={<>{t.name}&apos;s <SerifAccent>trip</SerifAccent></>}
      back="back"
      footer={
        matched ? (
          <PrimaryButton className="w-full" onClick={() => router.push(`/together/chat?id=${t.id}`)}>
            Message {t.name}
          </PrimaryButton>
        ) : liked ? (
          <p className="py-3 text-center text-[14px] text-white/60">Request sent. We&apos;ll tell you when {t.name} connects.</p>
        ) : (
          <div className="flex gap-3">
            <SecondaryButton className="px-5" onClick={pass} aria-label={`Pass on ${t.name}`}>
              <X className="size-5" />
              Pass
            </SecondaryButton>
            <PrimaryButton className="flex-1" onClick={connect}>
              <Plane className="size-5" />
              Connect
            </PrimaryButton>
          </div>
        )
      }
      overlay={
        <>
          <MatchCelebration
            match={match}
            onMessage={(m) => { setMatch(null); router.push(`/together/chat?id=${m.id}`); }}
            onClose={() => { setMatch(null); router.push("/together"); }}
          />
          <ReportSheet person={reporting ? t : null} context="profile" onClose={() => setReporting(false)} onDone={() => router.push("/together")} />
        </>
      }
    >
      {/* Hero */}
      <div className="relative h-[260px] overflow-hidden rounded-[30px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...photo(t.image, 360, 260)} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
        {t.trip.sameFlight && (
          <span className="glass-thin absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white">
            <Plane className="size-3.5 text-[#E9C99F]" /> Same flight · {t.trip.flight}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
          <Avatar t={t} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="flex items-center gap-2 text-[26px] font-medium leading-none tracking-[-0.02em] text-white">
              {t.name}, <SerifAccent className="text-[28px] text-white/85">{t.age}</SerifAccent>
              {t.verified && <BadgeCheck className="size-5 text-[#8FD3E2]" aria-label="Verified" />}
            </h2>
            <p className="mt-1.5 text-[13px] text-white/70">From {t.from} · Travels {t.style.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Trip */}
      <div className="glass mt-3 grid grid-cols-3 divide-x divide-white/[0.08] rounded-[22px] py-3 text-center">
        <Stat label="Going to" value={t.trip.to} />
        <Stat label="Dates" value={t.trip.dates} />
        <Stat label="Budget" value={t.budget} />
      </div>

      {/* Why you match */}
      <SectionLabel className="mt-6">Why you match</SectionLabel>
      {fit ? (
        <div className="glass rounded-[26px] p-4">
          <div className="flex items-center gap-4">
            <ScoreRing score={fit.score} />
            <div className="flex-1">
              <p className="text-[17px] text-white">
                {fit.score >= 80 ? "Great" : fit.score >= 60 ? "Good" : "Partial"} <SerifAccent>fit</SerifAccent>
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-white/55">
                {fit.overlapDays > 0
                  ? `You're both in ${t.trip.to} for ${fit.overlapDays} days${fit.shared.length ? ` and share ${fit.shared.length} interest${fit.shared.length === 1 ? "" : "s"}` : ""}.`
                  : `Your dates don't overlap with ${t.name}'s yet.`}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {fit.factors.map((f, i) => {
              const Icon = FACTOR_ICON[f.key];
              return (
                <li key={f.key} className="flex items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/[0.07]">
                    <Icon className="size-4 text-white/75" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] text-white">{f.label}</span>
                      <span className="truncate text-[12px] text-white/50">{f.note}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                      <motion.div
                        className={cn("h-full rounded-full", barColor(f.value))}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.value}%` }}
                        transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <Link href="/together/setup" className="glass flex items-center gap-3 rounded-[22px] p-4 text-[14px] text-white/80">
          <Sparkles className="size-5 text-[#E9C99F]" />
          Add your trip details to see how well you match.
        </Link>
      )}

      {/* About */}
      <SectionLabel className="mt-6">About {t.name}</SectionLabel>
      <p className="px-1 text-[15px] leading-relaxed text-white/80">{t.bio}</p>

      <SectionLabel className="mt-6">Into</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {t.interests.map((i) => {
          const shared = fit?.shared.includes(i);
          return (
            <span
              key={i}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium",
                shared ? "bg-white text-black" : "glass-thin text-white/85",
              )}
            >
              {shared && <Heart className="size-3.5 fill-[#C9785A] text-[#C9785A]" />}
              {i}
            </span>
          );
        })}
      </div>
      {fit && fit.shared.length > 0 && <p className="mt-2 px-1 text-[12px] text-white/40">Hearts mark interests you share.</p>}

      {/* Safety */}
      <div className="glass mt-6 rounded-[22px] p-4">
        <p className="flex items-center gap-2 text-[14px] text-white">
          <BadgeCheck className="size-5 text-[#4FA3B8]" />
          {t.verified ? "ID and booking verified by Unthinked" : "Not verified yet. Take extra care."}
        </p>
        <p className="mt-1.5 text-[12.5px] leading-snug text-white/50">
          Keep chats and payments in the app, and meet somewhere public first.
        </p>
        <button type="button" onClick={() => setReporting(true)} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#E9A58A]">
          <Flag className="size-3.5" /> Report and block {t.name}
        </button>
      </div>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2">
      <p className="text-[11.5px] text-white/50">{label}</p>
      <p className="mt-0.5 truncate text-[14px] text-white">{value}</p>
    </div>
  );
}

const barColor = (v: number) => (v >= 80 ? "bg-[#8FD3E2]" : v >= 50 ? "bg-[#E9C99F]" : "bg-[#C9785A]");

/** Animated ring showing the overall match score. */
function ScoreRing({ score }: { score: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-[76px] shrink-0">
      <svg viewBox="0 0 76 76" className="size-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="7" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="url(#match-ring)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        />
        <defs>
          <linearGradient id="match-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4FA3B8" />
            <stop offset="100%" stopColor="#E9C99F" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[19px] font-medium tabular-nums text-white">{score}%</span>
    </div>
  );
}
