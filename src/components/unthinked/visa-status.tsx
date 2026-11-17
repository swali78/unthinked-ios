"use client";

import { Download, Plane } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBooking } from "@/lib/booking-store";
import { resolveAirport } from "@/lib/data/search";
import { STAGE_AT, stageOf, VISA_STAGES } from "@/lib/data/visa";
import { cn } from "@/lib/utils";
import { downloadEVisa, EVisaCard } from "./evisa-card";
import { SerifAccent } from "./primitives";
import { PrimaryLink, Screen, SecondaryButton } from "./screen";
import { FlowLoading } from "./use-selected-flight";

const COPY = {
  Submitted: "We've sent your application. Review usually starts within a day.",
  "In review": "An officer is checking your documents. Nothing is needed from you.",
  Approved: "Your e-visa is ready. Keep a copy on your phone and show it at immigration.",
} as const;

export function VisaStatus() {
  const params = useSearchParams();
  const { state, ready } = useBooking();
  const [now, setNow] = useState(() => Date.now());
  const [downloadError, setDownloadError] = useState<string>();

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!ready) return <FlowLoading />;
  const app = state.visaApps.find((a) => a.id === params.get("id"));
  if (!app) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-[20px] font-medium text-white">Application not found</p>
        <p className="max-w-[28ch] text-[14.5px] text-white/60">It may have been made on another device. Check your visa requirements to start one.</p>
        <PrimaryLink href="/visa" className="mt-3 h-11 text-[15px]">
          Visa requirements
        </PrimaryLink>
      </div>
    );
  }

  const stage = stageOf(app, now);
  const current = VISA_STAGES.indexOf(stage);
  const at = (s: (typeof VISA_STAGES)[number]) => app.submittedAt + (s === "Submitted" ? 0 : STAGE_AT[s]);
  const time = (t: number) => new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const airport = resolveAirport(app.destination);

  return (
    <Screen
      title={
        <>
          Visa <SerifAccent className="text-[19px]">status</SerifAccent>
        </>
      }
      back="/visa"
      footer={
        stage === "Approved" ? (
          <div className="grid grid-cols-2 gap-2.5">
            <SecondaryButton
              onClick={() => downloadEVisa(app).catch((e: Error) => setDownloadError(e.message))}
            >
              <Download className="size-4" /> Download
            </SecondaryButton>
            {airport ? (
              <PrimaryLink href={`/flights?to=${airport}&date=${app.travel.arrival}`}>
                <Plane className="size-4" /> Book flight
              </PrimaryLink>
            ) : (
              <PrimaryLink href="/">Home</PrimaryLink>
            )}
          </div>
        ) : undefined
      }
    >
      <p className="mt-2 px-1 text-[12.5px] text-white/50">
        {app.destination} {app.type} · Ref {app.id}
      </p>
      <h2 className="mt-1 px-1 text-[32px] font-medium leading-tight tracking-[-0.02em] text-white" aria-live="polite">
        {stage === "Approved" ? (
          <>
            You&apos;re <SerifAccent className="text-emerald-300">approved</SerifAccent>
          </>
        ) : (
          <>
            {stage} <SerifAccent className="text-white/55">{stage === "Submitted" ? "and waiting" : "right now"}</SerifAccent>
          </>
        )}
      </h2>
      <p className="mt-2 px-1 text-[14.5px] leading-relaxed text-white/65">{COPY[stage]}</p>

      {/* Timeline */}
      <ol className="glass mt-5 rounded-[24px] p-4" aria-label="Application progress">
        {VISA_STAGES.map((s, i) => {
          const done = i < current || stage === "Approved";
          const active = i === current && stage !== "Approved";
          return (
            <li key={s} className="relative grid grid-cols-[22px_1fr] gap-x-3 pb-5 last:pb-0">
              {i < VISA_STAGES.length - 1 && (
                <span className={cn("absolute left-[10px] top-6 h-[calc(100%-20px)] w-0.5 rounded-full", i < current ? "bg-white/70" : "bg-white/12")} />
              )}
              <span className="relative mt-0.5 flex size-[22px] items-center justify-center">
                {active && <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />}
                <span
                  className={cn(
                    "relative size-[14px] rounded-full border-2",
                    done ? "border-white bg-white" : active ? "border-white bg-[#0b0b0c]" : "border-white/25 bg-transparent",
                  )}
                />
              </span>
              <div>
                <p className={cn("text-[15px]", done || active ? "text-white" : "text-white/40")}>{s}</p>
                <p className="text-[12px] text-white/45">{done || active ? time(at(s)) : "Next"}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <AnimatePresence>
        {stage === "Approved" && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mt-5"
          >
            <EVisaCard app={app} />
            {downloadError && <p className="mt-2 px-1 text-[12.5px] text-rose-300">{downloadError}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {stage !== "Approved" && (
        <p className="mt-4 px-1 text-[12px] leading-relaxed text-white/40">
          Demo timeline: this application is reviewed in about 15 seconds and decided within a minute.
        </p>
      )}
    </Screen>
  );
}
