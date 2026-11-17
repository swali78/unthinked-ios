"use client";

import { Check, ChevronRight, FileText, Globe2, Plane } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useBooking } from "@/lib/booking-store";
import { usd } from "@/lib/data/booking";
import { canApplyOnline, NATIONALITIES, SERVICE_FEE, stageOf, VISA_DESTINATIONS, visaRuleFor } from "@/lib/data/visa";
import type { VisaRule } from "@/lib/data/types";
import { resolveAirport } from "@/lib/data/search";
import { cn } from "@/lib/utils";
import { SerifAccent } from "./primitives";
import { PrimaryLink, Screen, SectionLabel } from "./screen";

export const VISA_TONE: Record<VisaRule["type"], string> = {
  "Visa-free": "text-emerald-300",
  "Visa on arrival": "text-emerald-300",
  eVisa: "text-sky-300",
  "Embassy visa": "text-amber-300",
};

export function VisaCheck() {
  const params = useSearchParams();
  const { state, ready } = useBooking();
  const [nationality, setNationality] = useState<string>(params.get("nationality") ?? "India");
  const [destination, setDestination] = useState<string>(() => {
    const q = params.get("country");
    return q && VISA_DESTINATIONS.includes(q) ? q : "Egypt";
  });
  const rule = visaRuleFor(nationality, destination);

  // Re-render each few seconds so application stages stay current.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const flightTo = resolveAirport(destination);

  return (
    <Screen
      title={
        <>
          Visa <SerifAccent className="text-[19px]">Application</SerifAccent>
        </>
      }
      back="/"
    >
      <h2 className="mb-6 mt-3 px-1 text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-white">
        Do I need a visa <SerifAccent className="text-white/60">to go there?</SerifAccent>
      </h2>

      <div className="glass divide-y divide-white/[0.07] rounded-[26px]">
        <SelectRow icon={FileText} label="My passport" value={nationality} options={[...NATIONALITIES]} onChange={setNationality} />
        <SelectRow icon={Globe2} label="Travelling to" value={destination} options={VISA_DESTINATIONS} onChange={setDestination} />
      </div>

      {rule && (
        <section className="glass mt-4 overflow-hidden rounded-[26px]" aria-live="polite" aria-label="Requirements">
          <div className="p-4">
            <p className="text-[12px] text-white/55">
              {nationality} passport → {destination}
            </p>
            <p className={cn("mt-1.5 text-[28px] font-medium leading-tight tracking-tight", VISA_TONE[rule.type])}>{rule.type}</p>
            {rule.maxStayDays > 0 && (
              <dl className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
                <Stat k="Stay up to" v={`${rule.maxStayDays} days`} />
                <Stat k="Government fee" v={rule.fee ? usd(rule.fee) : "Free"} />
                <Stat k="Processing" v={rule.processingDays} />
              </dl>
            )}
          </div>
          <div className="border-t border-white/[0.07] px-4 py-3.5">
            <p className="mb-2 text-[12px] text-white/55">You&apos;ll need</p>
            <ul className="space-y-1.5">
              {rule.documents.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[14px] text-white/85">
                  <Check className="mt-0.5 size-4 shrink-0 text-white/45" /> {d}
                </li>
              ))}
            </ul>
            {rule.notes && <p className="mt-3 text-[12.5px] leading-relaxed text-white/55">{rule.notes}</p>}
          </div>
          <div className="px-4 pb-4">
            {canApplyOnline(rule) ? (
              <>
                <PrimaryLink
                  href={`/visa/apply?${new URLSearchParams({ country: destination, nationality })}`}
                  className="w-full"
                >
                  Apply online · {usd(rule.fee + SERVICE_FEE)}
                </PrimaryLink>
                <p className="mt-2 text-center text-[11.5px] text-white/45">
                  Government fee {usd(rule.fee)} + Unthinked service {usd(SERVICE_FEE)} · about 8 minutes
                </p>
              </>
            ) : rule.type === "Embassy visa" ? (
              <p className="rounded-[18px] bg-amber-300/10 px-4 py-3 text-[13px] leading-relaxed text-amber-100/85">
                This visa needs an in-person embassy appointment, so it can&apos;t be filed online. Use the list above to prepare
                your documents before you book a slot.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <p className="flex-1 text-[13px] text-white/70">No application needed. Carry these documents when you fly.</p>
                {flightTo && (
                  <PrimaryLink href={`/flights?to=${flightTo}`} className="h-11 shrink-0 px-4 text-[14px]">
                    <Plane className="size-4" /> Flights
                  </PrimaryLink>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {ready && state.visaApps.length > 0 && (
        <>
          <SectionLabel className="mt-8">Your applications</SectionLabel>
          <ul className="space-y-2">
            {state.visaApps.map((a) => {
              const stage = stageOf(a, now);
              return (
                <li key={a.id}>
                  <Link href={`/visa/status?id=${a.id}`} className="glass flex items-center gap-3 rounded-[20px] px-4 py-3.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] text-white">
                        {a.destination} {a.type}
                      </span>
                      <span className="block text-[12px] text-white/50">
                        {a.applicant.firstName} {a.applicant.lastName} · Ref {a.id}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11.5px] font-medium",
                        stage === "Approved" ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-white/75",
                      )}
                    >
                      {stage}
                    </span>
                    <ChevronRight className="size-4 text-white/40" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <p className="mt-8 px-1 text-[11.5px] leading-relaxed text-white/40">
        Demo data, not legal advice. Entry rules change often, so always confirm with the destination&apos;s official
        embassy or immigration site before you travel.
      </p>
    </Screen>
  );
}

function SelectRow({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const id = `sel-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={id} className="flex flex-col px-4 py-3.5">
      <span className="text-[12px] text-white/55">{label}</span>
      <span className="mt-0.5 flex items-center gap-2">
        <Icon className="size-4 text-white/60" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 appearance-none bg-transparent text-[20px] font-medium tracking-tight text-white [color-scheme:dark] focus:outline-none"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronRight className="size-4 rotate-90 text-white/40" />
      </span>
    </label>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[14px] bg-white/[0.05] px-2.5 py-2">
      <dt className="text-white/50">{k}</dt>
      <dd className="mt-0.5 font-medium leading-snug text-white">{v}</dd>
    </div>
  );
}
