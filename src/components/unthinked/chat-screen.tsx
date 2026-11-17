"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { ChevronLeft, MoreHorizontal, RotateCcw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSpeech } from "@/hooks/use-speech";
import type { Destination, Flight, Hotel, VisaRule } from "@/lib/data/types";
import { AIOrb } from "./ai-orb";
import { DestinationCards, FlightResults, HotelResults, VisaCard } from "./chat-cards";
import { Composer } from "./composer";
import { Chip, FadedQuestion, IconButton, SerifAccent, Skeleton } from "./primitives";

const STARTERS = [
  "Can you suggest vacation options for a trip to the sea?",
  "Flights from Dubai to Bali next month",
  "Do I need a visa for Japan?",
  "Best hotels in Santorini",
];

const EASE = [0.23, 1, 0.32, 1] as const;

export function ChatScreen() {
  const params = useSearchParams();
  const { messages, sendMessage, status, error, regenerate, setMessages } = useChat();
  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    if (!busy) sendMessage({ text });
  };
  const speech = useSpeech(send);

  // Start from a prompt passed in from Home. Deferred and cancelled on
  // cleanup, so Strict Mode's mount → unmount → mount sends exactly once.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    const t = setTimeout(() => {
      started.current = true;
      const q = params.get("q");
      if (q) sendMessage({ text: q });
      else if (params.get("voice")) speech.start();
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest content in view.
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  const empty = messages.length === 0;
  const voiceStage = speech.listening || (empty && !busy);

  return (
    <div className="relative flex h-full flex-col pt-[max(env(safe-area-inset-top),12px)] md:pt-[54px]">
      {/* Spotlight glow behind the stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/4 h-[60%]"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 70%, rgb(255 246 232 / 0.09), transparent 70%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-4 pb-2">
        <Link
          href="/"
          aria-label="Back to home"
          className="glass-thin flex size-11 items-center justify-center rounded-full text-white/85 transition-transform active:scale-[0.96]"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className="text-[17px] text-white">
          AI <SerifAccent className="text-[19px]">Chat</SerifAccent>
        </h1>
        <IconButton label="New chat" onClick={() => setMessages([])} disabled={empty}>
          <MoreHorizontal className="size-5" />
        </IconButton>
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {voiceStage ? (
          <motion.main
            key="stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.18 } }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative flex flex-1 flex-col items-center px-7"
          >
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="text-balance text-[30px] font-medium leading-[1.15] tracking-[-0.02em] text-white">
                {speech.listening ? (
                  speech.transcript ? (
                    <FadedQuestion text={speech.transcript} />
                  ) : (
                    <span className="text-white/50">Listening…</span>
                  )
                ) : (
                  <>
                    Where do you <FadedQuestion text="want to go next?" split={0} />
                  </>
                )}
              </p>
              {!speech.listening && (
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {STARTERS.slice(1).map((s) => (
                    <Chip key={s} onClick={() => send(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              )}
              {(speech.error || (!speech.supported && params.get("voice"))) && (
                <p role="alert" className="mt-6 max-w-[30ch] text-[13.5px] text-white/60">
                  {speech.error ?? "Voice input isn't available in this browser. Type your question instead."}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={!speech.supported}
              aria-label={speech.listening ? "Stop listening" : "Tap to talk"}
              className="mb-8 flex flex-col items-center gap-14 rounded-full disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-white/70"
            >
              <AIOrb size={60} listening />
              <span className="text-[12.5px] text-white/50">
                {speech.listening ? "Tap to finish" : speech.supported ? "Tap to talk" : "Voice unavailable"}
              </span>
            </button>
          </motion.main>
        ) : (
          <motion.main
            key="thread"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="relative flex-1 overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none]"
            aria-live="polite"
          >
            <div className="space-y-7 pt-4">
              {messages.map((m) => (
                <Message key={m.id} message={m} onAsk={send} />
              ))}
              {status === "submitted" && <Thinking />}
              {error && (
                <div role="alert" className="glass flex items-center justify-between gap-3 rounded-[20px] p-4 text-[14px] text-white/80">
                  <span>The assistant couldn&apos;t answer. Check your connection and try again.</span>
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-black"
                  >
                    <RotateCcw className="size-3.5" /> Retry
                  </button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </motion.main>
        )}
      </AnimatePresence>

      <div className="relative z-10 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 md:pb-7">
        <Composer
          onSubmit={send}
          disabled={busy}
          onMic={speech.supported ? (speech.listening ? speech.stop : speech.start) : undefined}
          listening={speech.listening}
        />
      </div>
    </div>
  );
}

function Message({ message, onAsk }: { message: UIMessage; onAsk: (q: string) => void }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="text-balance pr-6 text-[25px] font-medium leading-[1.18] tracking-[-0.015em] text-white"
      >
        <FadedQuestion text={text} />
      </motion.h2>
    );
  }

  const firstText = message.parts.findIndex((p) => p.type === "text");
  return (
    <div className="space-y-3.5">
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;
        if (part.type === "text") {
          return (
            <p key={key} className="flex gap-3 text-[15.5px] leading-[1.6] text-white/85">
              {i === firstText && <AIOrb size={22} className="mt-[3px]" />}
              <span className={i === firstText ? "" : "pl-[34px]"}>{part.text}</span>
            </p>
          );
        }
        if (!part.type.startsWith("tool-")) return null;
        const tool = part as { type: string; state: string; output?: unknown };
        if (tool.state === "output-error") {
          return (
            <p key={key} className="glass rounded-[20px] px-4 py-3 text-[14px] text-white/70">
              That search didn&apos;t work. Ask again in a moment.
            </p>
          );
        }
        if (tool.state !== "output-available") {
          return <ToolSkeleton key={key} type={tool.type} />;
        }
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            {renderTool(tool.type, tool.output, onAsk)}
          </motion.div>
        );
      })}
    </div>
  );
}

function renderTool(type: string, output: unknown, onAsk: (q: string) => void) {
  switch (type) {
    case "tool-searchFlights":
      return <FlightResults {...(output as { flights: Flight[]; error?: string })} />;
    case "tool-searchHotels":
      return <HotelResults {...(output as { hotels: Hotel[]; error?: string })} />;
    case "tool-checkVisa":
      return <VisaCard {...(output as { rule?: VisaRule; nationality: string; error?: string })} />;
    case "tool-suggestDestinations":
      return (
        <DestinationCards
          destinations={(output as { destinations: Destination[] }).destinations}
          onPick={(d) => onAsk(`Find flights to ${d.city}`)}
        />
      );
    default:
      return null;
  }
}

function ToolSkeleton({ type }: { type: string }) {
  const wide = type === "tool-searchHotels" || type === "tool-suggestDestinations";
  return (
    <div className={wide ? "flex gap-2.5" : "space-y-2"} aria-label="Loading results">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className={wide ? "h-[220px] w-[200px] shrink-0 rounded-[22px]" : "h-[132px] w-full rounded-[22px]"} />
      ))}
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-3 text-[14px] text-white/55">
      <AIOrb size={22} />
      <span className="serif-accent text-[16px]">Thinking…</span>
    </div>
  );
}
