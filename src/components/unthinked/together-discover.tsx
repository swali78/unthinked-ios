"use client";

import { BadgeCheck, ChevronRight, MessageCircle, Plane, ShieldCheck, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { AnimatePresence, animate, motion, type PanInfo, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { photo } from "@/lib/photo";
import { type Compatibility, compatibility, fitsPrefs, rangeLabel, type Traveler, type TravelStyle, together, useTogether } from "@/lib/together";
import { Chip, SerifAccent } from "./primitives";
import { Screen } from "./screen";
import { ReportSheet } from "./together-report";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function Avatar({ t, size = 40 }: { t: Pick<Traveler, "name" | "tint"> | { name: string; tint: [string, string] }; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ring-2 ring-black/40"
      style={{ width: size, height: size, fontSize: size * 0.42, background: `linear-gradient(135deg, ${t.tint[0]}, ${t.tint[1]})` }}
    >
      {t.name[0]}
    </span>
  );
}

export const ME_AVATAR = { name: "You", tint: ["#4FA3B8", "#C9785A"] as [string, string] };

/** "It's a trip!" dialog, shown when both travelers connect. */
export function MatchCelebration({ match, onMessage, onClose }: { match: Traveler | null; onMessage: (t: Traveler) => void; onClose: () => void }) {
  const prefs = useTogether().prefs;
  const fit = match && prefs ? compatibility(prefs, match) : null;
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          role="dialog"
          aria-modal="true"
          aria-label={`You matched with ${match.name}`}
        >
          <motion.div
            className="glass w-full rounded-[30px] p-6 text-center"
            initial={{ y: 24, scale: 0.96 }}
            animate={{ y: 0, scale: 1, transition: { duration: 0.32, ease: EASE_OUT } }}
          >
            <div className="flex items-center justify-center gap-3">
              <Avatar t={ME_AVATAR} size={72} />
              <Plane className="size-6 text-[#E9C99F]" />
              <Avatar t={match} size={72} />
            </div>
            <h2 className="mt-5 text-[30px] font-medium leading-none tracking-[-0.02em] text-white">
              It&apos;s a <SerifAccent className="text-[34px] text-[#E9C99F]">trip!</SerifAccent>
            </h2>
            <p className="mt-3 text-[14px] text-white/65">
              You and {match.name} are both heading to {match.trip.to}
              {fit && fit.overlapDays > 0 ? `, with ${fit.overlapDays} days together` : ""}. Say hi and start planning.
            </p>
            {fit && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] text-white/85">
                <Sparkles className="size-3.5 text-[#E9C99F]" /> {fit.score}% match
              </p>
            )}
            <button
              type="button"
              onClick={() => onMessage(match)}
              className="mt-5 w-full rounded-full bg-white py-3.5 text-[15px] font-medium text-black transition-transform active:scale-[0.97]"
            >
              Send a message
            </button>
            <button type="button" onClick={onClose} className="mt-3 text-[14px] text-white/60">
              Keep swiping
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TogetherDiscover() {
  const s = useTogether();
  const router = useRouter();
  const [style, setStyle] = useState<"All" | TravelStyle>("All");
  const [match, setMatch] = useState<Traveler | null>(null);
  const [safety, setSafety] = useState<Traveler | null>(null);
  const [reporting, setReporting] = useState<Traveler | null>(null);

  // With preferences set, filter by them and put the best matches first.
  const deck = useMemo(() => {
    const open = s.people.filter(
      (t) => !s.liked.includes(t.id) && !s.passed.includes(t.id) && !s.blocked.includes(t.id) && (style === "All" || t.style === style),
    );
    const { prefs } = s;
    if (!prefs) return open.map((t) => ({ t, fit: null }));
    return open
      .filter((t) => fitsPrefs(prefs, t))
      .map((t) => ({ t, fit: compatibility(prefs, t) }))
      .sort((a, b) => b.fit.score - a.fit.score);
  }, [s, style]);
  const top = deck[0]?.t;

  const decide = (t: Traveler, dir: 1 | -1) => {
    if (dir > 0) {
      if (together.like(t.id)) setMatch(t);
    } else together.pass(t.id);
  };

  return (
    <Screen
      title={<>Travel <SerifAccent>together</SerifAccent></>}
      back="/"
      right={
        <Link href="/together/chats" aria-label="Matches and chats" className="glass-thin relative flex size-11 items-center justify-center rounded-full text-white/85 transition-transform active:scale-[0.96]">
          <MessageCircle className="size-5" />
          {s.matches.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#C9785A] text-[10.5px] font-semibold text-white">
              {s.matches.length}
            </span>
          )}
        </Link>
      }
      bodyClassName="flex flex-col pb-4"
      overlay={
        <>
      <MatchCelebration
        match={match}
        onMessage={(t) => { setMatch(null); router.push(`/together/chat?id=${t.id}`); }}
        onClose={() => setMatch(null)}
      />

      {/* Safety sheet */}
      <AnimatePresence>
        {safety && (
          <motion.div className="absolute inset-0 z-30 flex items-end bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.15 } }} onClick={() => setSafety(null)}>
            <motion.div
              className="w-full rounded-t-[30px] border-t border-white/10 bg-[#141518] p-6 pb-9"
              initial={{ y: "100%" }}
              animate={{ y: 0, transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }}
              exit={{ y: "100%", transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[18px] text-white">Travel safely with {safety.name}</h3>
              <ul className="mt-3 space-y-3 text-[14px] text-white/70">
                <li className="flex gap-3"><BadgeCheck className="size-5 shrink-0 text-[#4FA3B8]" />{safety.verified ? "ID verified by Unthinked" : "Not ID verified yet. Take extra care."}</li>
                <li className="flex gap-3"><MessageCircle className="size-5 shrink-0 text-[#4FA3B8]" />Keep chats and payments inside the app.</li>
                <li className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-[#4FA3B8]" />Meet in public first and share your plans with someone you trust.</li>
              </ul>
              <button type="button" onClick={() => { setReporting(safety); setSafety(null); }} className="mt-5 w-full rounded-full border border-[#C9785A]/60 py-3 text-[15px] text-[#E9A58A] transition-transform active:scale-[0.97]">
                Report and block
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ReportSheet person={reporting} context="discover" onClose={() => setReporting(null)} />
        </>
      }
    >
      {s.prefs ? (
        <Link
          href="/together/setup"
          className="glass-thin flex items-center gap-2 self-start rounded-full py-2 pl-3.5 pr-3 text-[13px] text-white/85 transition-transform active:scale-[0.97]"
        >
          <Plane className="size-3.5 text-[#E9C99F]" />
          {s.prefs.destination} · {rangeLabel(s.prefs.start, s.prefs.end)}
          <SlidersHorizontal className="ml-1 size-3.5 text-white/55" aria-label="Edit match preferences" />
        </Link>
      ) : (
        <Link href="/together/setup" className="glass flex items-center gap-3 rounded-[22px] p-3.5 transition-transform active:scale-[0.98]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
            <Sparkles className="size-5 text-[#E9C99F]" />
          </span>
          <span className="flex-1">
            <span className="block text-[14.5px] text-white">Get matched on your trip</span>
            <span className="block text-[12.5px] text-white/55">Add your dates and interests to see who fits best</span>
          </span>
          <ChevronRight className="size-4 text-white/40" />
        </Link>
      )}
      <div className="mt-3 flex gap-2">
        {(["All", "Solo", "Duo", "Group"] as const).map((v) => (
          <Chip key={v} selected={style === v} onClick={() => setStyle(v)}>
            {v}
          </Chip>
        ))}
      </div>

      <div className="relative mt-4 min-h-[440px] flex-1">
        {top ? (
          deck.slice(0, 2).reverse().map(({ t, fit }) => (
            <SwipeCard
              key={t.id}
              t={t}
              fit={fit}
              isTop={t.id === top.id}
              onDecide={(d) => decide(t, d)}
              onSafety={() => setSafety(t)}
              onOpen={() => router.push(`/together/profile?id=${t.id}`)}
            />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Plane className="size-9 text-white/40" />
            <p className="mt-4 text-[17px] text-white">You&apos;ve seen everyone for now</p>
            <p className="mt-1 text-[13.5px] text-white/55">Try another travel style, widen your dates, or ask the assistant to find a group.</p>
            <Link href="/chat" className="mt-5 rounded-full bg-white px-5 py-3 text-[14px] font-medium text-black transition-transform active:scale-[0.97]">
              Ask Unthinked
            </Link>
          </div>
        )}
      </div>

      {top && (
        <div className="mt-4 flex items-center justify-center gap-5">
          <button type="button" aria-label="Pass" onClick={() => decide(top, -1)} className="glass flex size-16 items-center justify-center rounded-full text-white/80 transition-transform active:scale-[0.96]">
            <X className="size-7" />
          </button>
          <Link href="/chat?q=Who%20is%20flying%20to%20Bali%20on%20my%20dates%3F" aria-label="Ask the assistant" className="glass-thin flex size-12 items-center justify-center rounded-full text-[#E9C99F] transition-transform active:scale-[0.96]">
            <Sparkles className="size-5" />
          </Link>
          <button type="button" aria-label="Connect" onClick={() => decide(top, 1)} className="flex size-[72px] items-center justify-center rounded-full bg-white text-black shadow-[0_12px_40px_rgb(79_163_184/0.35)] transition-transform active:scale-[0.96]">
            <Plane className="size-7" />
          </button>
        </div>
      )}

    </Screen>
  );
}

function SwipeCard({
  t,
  fit,
  isTop,
  onDecide,
  onSafety,
  onOpen,
}: {
  t: Traveler;
  fit: Compatibility | null;
  isTop: boolean;
  onDecide: (d: 1 | -1) => void;
  onSafety: () => void;
  onOpen: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-10, 0, 10]);
  const connect = useTransform(x, [20, 110], [0, 1]);
  const pass = useTransform(x, [-110, -20], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Velocity counts as much as distance, so a quick flick commits.
    const swipe = info.offset.x + info.velocity.x * 0.2;
    if (Math.abs(swipe) > 120) {
      const dir = swipe > 0 ? 1 : -1;
      animate(x, dir * 520, { duration: 0.22, ease: EASE_OUT }).then(() => onDecide(dir));
    } else animate(x, 0, { type: "spring", stiffness: 420, damping: 32 });
  };

  return (
    <motion.article
      className="absolute inset-0 overflow-hidden rounded-[30px] bg-[#16181b] shadow-[0_30px_80px_rgb(0_0_0/0.55)] touch-none"
      style={isTop ? { x, rotate } : undefined}
      initial={false}
      animate={isTop ? { scale: 1, y: 0 } : { scale: 0.95, y: 12 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      drag={isTop ? "x" : false}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      // A tap (not a drag) opens the full profile.
      onTap={isTop ? onOpen : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...photo(t.image, 360, 460)} alt="" draggable={false} className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/90" />

      {t.trip.sameFlight && (
        <span className="glass-thin absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-white">
          <Plane className="size-3.5 text-[#E9C99F]" /> Same flight · {t.trip.flight}
        </span>
      )}
      <button type="button" aria-label={`Safety options for ${t.name}`} onClick={onSafety} onPointerDown={(e) => e.stopPropagation()} className="glass-thin absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-white/85">
        <ShieldCheck className="size-[18px]" />
      </button>

      {isTop && (
        <>
          <motion.span style={{ opacity: connect }} className="absolute left-5 top-20 -rotate-12 rounded-xl border-[3px] border-[#4FA3B8] px-3 py-1 text-[22px] font-semibold tracking-wide text-[#8FD3E2]">
            CONNECT
          </motion.span>
          <motion.span style={{ opacity: pass }} className="absolute right-5 top-20 rotate-12 rounded-xl border-[3px] border-[#C9785A] px-3 py-1 text-[22px] font-semibold tracking-wide text-[#E9A58A]">
            PASS
          </motion.span>
        </>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5">
        {fit && (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-black">
            <Sparkles className="size-3.5 text-[#C9785A]" />
            {fit.score}% match
            {fit.overlapDays > 0 && <span className="text-black/55">· {fit.overlapDays} days together</span>}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Avatar t={t} size={42} />
          <h2 className="text-[26px] font-medium leading-none tracking-[-0.02em] text-white">
            {t.name}, <SerifAccent className="text-[28px] text-white/85">{t.age}</SerifAccent>
          </h2>
          {t.verified && <BadgeCheck className="size-5 text-[#8FD3E2]" aria-label="Verified" />}
        </div>
        <p className="mt-2.5 text-[13.5px] text-white/80">
          {t.from} → {t.trip.to} · {t.trip.dates}
        </p>
        <p className="mt-1.5 text-[14px] leading-snug text-white/70">{t.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[t.style, t.budget, ...t.interests.slice(0, 2)].map((tag) => (
            <span key={tag} className="rounded-full bg-white/12 px-2.5 py-1 text-[11.5px] text-white/85 backdrop-blur-md">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
