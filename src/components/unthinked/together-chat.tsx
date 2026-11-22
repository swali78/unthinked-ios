"use client";

import { ArrowUp, BadgeCheck, ChevronRight, Flag, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { together, travelerById, useTogether } from "@/lib/together";
import { SerifAccent, STAGGER } from "./primitives";
import { Screen } from "./screen";
import { Avatar } from "./together-discover";
import { ReportSheet } from "./together-report";

/** Matches and conversations. */
export function TogetherChats() {
  const s = useTogether();
  const people = s.matches.map(travelerById).filter((t) => !!t);
  return (
    <Screen title={<>Your <SerifAccent>matches</SerifAccent></>} back="/together">
      {people.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-[17px] text-white">No matches yet</p>
          <p className="mt-1 text-[13.5px] text-white/55">Connect with travelers heading where you are.</p>
          <Link href="/together" className="mt-5 rounded-full bg-white px-5 py-3 text-[14px] font-medium text-black">Find travel buddies</Link>
        </div>
      ) : (
        <>
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-4 pt-1 [scrollbar-width:none]">
            {people.map((p) => (
              <Link key={p.id} href={`/together/chat?id=${p.id}`} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5">
                <Avatar t={p} size={60} />
                <span className="text-[12.5px] text-white">{p.name}</span>
              </Link>
            ))}
          </div>
          <h2 className="mb-2 px-1 text-[13px] text-white/60">Messages</h2>
          <ul className="space-y-2">
            {people.map((p, i) => {
              const last = (s.chats[p.id] ?? []).slice(-1)[0];
              return (
                <motion.li key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: STAGGER[Math.min(i, 5)], duration: 0.24 }}>
                  <Link href={`/together/chat?id=${p.id}`} className="glass flex items-center gap-3 rounded-[22px] p-3 transition-transform active:scale-[0.98]">
                    <Avatar t={p} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-white">{p.name} · <span className="text-white/60">{p.trip.to}</span></p>
                      <p className="truncate text-[13px] text-white/55">{last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "Say hi 👋"}</p>
                    </div>
                    <ChevronRight className="size-4 text-white/35" />
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </>
      )}
    </Screen>
  );
}

/** One conversation, with a shortcut to plan a group trip together. */
export function TogetherChat() {
  const id = useSearchParams().get("id") ?? "";
  const person = travelerById(id);
  const s = useTogether();
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const messages = s.chats[id] ?? [];

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (!person) return null;

  const send = () => {
    const t = text.trim();
    if (!t) return;
    const problem = together.send(id, t);
    setError(problem);
    if (!problem) setText("");
  };

  return (
    <Screen
      title={
        <span className="inline-flex items-center gap-2">
          <Avatar t={person} size={26} />
          {person.name}
          {person.verified && <BadgeCheck className="size-4 text-[#8FD3E2]" />}
        </span>
      }
      back="/together/chats"
      right={
        <button
          type="button"
          aria-label={`Report ${person.name}`}
          onClick={() => setReporting(true)}
          className="glass-thin flex size-11 items-center justify-center rounded-full text-[#E9A58A] transition-transform active:scale-[0.96]"
        >
          <Flag className="size-4" />
        </button>
      }
      overlay={<ReportSheet person={reporting ? person : null} context="chat" onClose={() => setReporting(false)} onDone={() => router.push("/together/chats")} />}
      footer={
        <>
        {error && (
          <p role="alert" className="mb-2 px-2 text-[12.5px] leading-snug text-rose-300">
            {error}
          </p>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); if (error) setError(null); }}
            placeholder={`Message ${person.name}`}
            aria-label={`Message ${person.name}`}
            className="glass-thin h-12 flex-1 rounded-full px-5 text-[16px] text-white placeholder:text-white/40 focus:outline-none"
          />
          <button type="submit" aria-label="Send" className="flex size-12 items-center justify-center rounded-full bg-white text-black transition-transform active:scale-[0.96]">
            <ArrowUp className="size-5" />
          </button>
        </form>
        </>
      }
    >
      <button
        type="button"
        onClick={async () => router.push(`/together/trip?id=${await together.startTrip(id)}`)}
        className="glass flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left transition-transform active:scale-[0.98]"
      >
        <Users className="size-5 text-[#E9C99F]" />
        <span className="flex-1 text-[13.5px] text-white/85">
          Start a group trip to <SerifAccent className="text-[15px]">{person.trip.to}</SerifAccent>, plan and split costs
        </span>
        <ChevronRight className="size-4 text-white/40" />
      </button>
      <p className="mt-4 text-center text-[11.5px] text-white/35">{person.trip.dates} · {person.trip.flight}</p>
      <div className="mt-3 space-y-2">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className={m.from === "me" ? "ml-auto max-w-[80%] rounded-[20px] rounded-br-md bg-white px-4 py-2.5 text-[15px] text-black" : "glass-thin max-w-[80%] rounded-[20px] rounded-bl-md px-4 py-2.5 text-[15px] text-white"}
          >
            {m.text}
          </motion.div>
        ))}
        <div ref={end} />
      </div>
    </Screen>
  );
}
