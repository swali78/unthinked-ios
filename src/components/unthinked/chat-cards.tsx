"use client";

import { Check, Clock3, FileText, Star } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import AICheckout from "@/components/kokonutui/ai-checkout";
import { TRAVELER } from "@/lib/data/seed";
import type { Destination, Flight, Hotel, VisaRule } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { FlightCard } from "./flight-ui";
import { SerifAccent } from "./primitives";
import { photo } from "@/lib/photo";

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

const fakePay = () =>
  new Promise<string>((resolve) =>
    setTimeout(() => resolve(Math.random().toString(36).slice(2, 8).toUpperCase()), 1400),
  );

function ErrorNote({ children }: { children: string }) {
  return (
    <p role="status" className="glass rounded-[20px] px-4 py-3 text-[14px] text-white/75">
      {children}
    </p>
  );
}

/* ---------------- Flights ---------------- */

export function FlightResults({ flights, error }: { flights: Flight[]; error?: string }) {
  const [picked, setPicked] = useState<string>();
  if (error || flights.length === 0) return <ErrorNote>{error ?? "No flights on that day. Try another date."}</ErrorNote>;
  const chosen = flights.find((f) => f.id === picked);
  const cheapest = Math.min(...flights.map((f) => f.price));

  return (
    <div className="space-y-2">
      <ul className="space-y-2" aria-label="Flight options">
        {flights.map((f) => (
          <li key={f.id}>
            <FlightCard
              flight={f}
              selected={f.id === picked}
              onClick={() => setPicked(f.id === picked ? undefined : f.id)}
              badge={f.price === cheapest ? "Cheapest" : undefined}
            />
          </li>
        ))}
      </ul>
      <Link
        href={`/flights/results?${new URLSearchParams({ from: flights[0].from, to: flights[0].to, date: flights[0].departAt.slice(0, 10), pax: "1", cabin: flights[0].cabin })}`}
        className="glass-thin flex h-11 items-center justify-center rounded-full text-[14px] text-white/85"
      >
        See all flights, seats and fares
      </Link>
      <AnimatePresence>
        {chosen && (
          <motion.div
            key={chosen.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.16 } }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
            className="pt-2"
          >
            <AICheckout
              message={`${chosen.flightNumber} on ${day(chosen.departAt)}. Set the number of travelers and confirm.`}
              confirmation="Booked. Your e-ticket is in Wallet, and I'll remind you when check-in opens."
              checkout={{
                merchant: chosen.airline.name,
                item: {
                  title: `${chosen.fromCity} → ${chosen.toCity}`,
                  subtitle: `${chosen.flightNumber} · ${chosen.cabin}`,
                  unitPrice: chosen.price,
                  quantity: 1,
                  maxQuantity: 6,
                  icon: <TicketIcon code={chosen.airline.code} />,
                },
                taxRate: 0.05,
                cardLast4: TRAVELER.cardLast4,
                delivery: "E-ticket sent instantly",
                feeLine: { label: "Baggage", value: "30 kg included" },
              }}
              onPay={fakePay}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TicketIcon({ code }: { code: string }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-[12px] bg-zinc-800 text-[12px] font-semibold text-white ring-1 ring-white/10">
      {code}
    </span>
  );
}

/* ---------------- Hotels ---------------- */

export function HotelResults({ hotels, error }: { hotels: Hotel[]; error?: string }) {
  const [picked, setPicked] = useState<string>();
  if (error || hotels.length === 0) return <ErrorNote>{error ?? "No stays match. Try a different city."}</ErrorNote>;
  const chosen = hotels.find((h) => h.id === picked);

  return (
    <div className="space-y-3">
      <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Hotel options">
        {hotels.map((h) => {
          const active = h.id === picked;
          return (
            <li key={h.id} className="snap-start">
              <button
                type="button"
                onClick={() => setPicked(active ? undefined : h.id)}
                aria-pressed={active}
                className={cn(
                  "glass block w-[232px] overflow-hidden rounded-[22px] text-left transition-transform active:scale-[0.98]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
                  active && "shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.85)]",
                )}
              >
                <div className="relative h-[132px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img {...photo(h.image, 232, 132)} alt="" loading="lazy" className="size-full object-cover" />
                  <span className="glass-thin absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] font-medium text-white">
                    <Star className="size-3 fill-white" /> {h.rating.toFixed(1)}
                  </span>
                  {active && (
                    <span className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-white text-black">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="truncate text-[15px] font-medium text-white">{h.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-white/55">{h.area} · {h.amenities[0]}</p>
                  <p className="mt-2.5 text-[12px] text-white/55">
                    <span className="text-[16px] font-semibold tabular-nums text-white">{usd(h.pricePerNight)}</span> / night
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <Link
        href={`/hotels/results?city=${encodeURIComponent(hotels[0].city)}`}
        className="glass-thin flex h-11 items-center justify-center rounded-full text-[14px] text-white/85"
      >
        See all stays, rooms and reviews
      </Link>
      <AnimatePresence>
        {chosen && (
          <motion.div
            key={chosen.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.16 } }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          >
            <AICheckout
              message={`${chosen.name} in ${chosen.area}. Choose how many nights.`}
              confirmation="Reserved. The voucher is in Wallet and the hotel has your arrival time."
              checkout={{
                merchant: chosen.name,
                item: {
                  title: "Deluxe room",
                  subtitle: "per night · breakfast included",
                  unitPrice: chosen.pricePerNight,
                  quantity: 3,
                  maxQuantity: 14,
                  icon: (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img {...photo(chosen.image, 44, 44)} alt="" className="size-11 rounded-[12px] object-cover" />
                  ),
                },
                taxRate: 0.1,
                cardLast4: TRAVELER.cardLast4,
                delivery: "Free cancellation until 48h before",
                feeLine: { label: "Resort fee", value: "Included" },
              }}
              onPay={fakePay}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- Visa ---------------- */

const VISA_TONE: Record<VisaRule["type"], string> = {
  "Visa-free": "text-emerald-300",
  "Visa on arrival": "text-emerald-300",
  eVisa: "text-sky-300",
  "Embassy visa": "text-amber-300",
};

export function VisaCard({ rule, nationality, error }: { rule?: VisaRule; nationality: string; error?: string }) {
  if (!rule) return <ErrorNote>{error ?? "No visa rules found."}</ErrorNote>;
  const needsApplication = rule.type === "eVisa" || rule.type === "Embassy visa";
  return (
    <div className="glass overflow-hidden rounded-[24px]">
      <div className="p-4">
        <p className="text-[12px] text-white/55">{nationality} passport → {rule.destination}</p>
        <p className={cn("mt-1.5 text-[24px] font-medium leading-tight tracking-tight", VISA_TONE[rule.type])}>
          {rule.type}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
          <Stat label="Stay" value={`${rule.maxStayDays} days`} />
          <Stat label="Fee" value={rule.fee ? usd(rule.fee) : "Free"} />
          <Stat label="Processing" value={rule.processingDays} />
        </dl>
      </div>
      <div className="border-t border-white/[0.07] px-4 py-3.5">
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-white/55">
          <FileText className="size-3.5" /> Documents
        </p>
        <ul className="space-y-1.5">
          {rule.documents.map((d) => (
            <li key={d} className="flex items-start gap-2 text-[13.5px] text-white/85">
              <Check className="mt-0.5 size-3.5 shrink-0 text-white/45" /> {d}
            </li>
          ))}
        </ul>
        {rule.notes && <p className="mt-3 text-[12.5px] leading-relaxed text-white/55">{rule.notes}</p>}
      </div>
      {needsApplication && (
        <div className="flex gap-2 px-4 pb-4">
          <Link
            href={`/${rule.type === "eVisa" ? "visa/apply" : "visa"}?${new URLSearchParams({ country: rule.destination, nationality })}`}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-white text-[14.5px] font-medium text-black transition-transform active:scale-[0.97]"
          >
            {rule.type === "eVisa" ? "Start application" : "Prepare documents"}
          </Link>
          {rule.type === "eVisa" && (
            <span className="glass-thin flex h-11 items-center gap-1.5 rounded-full px-4 text-[12.5px] text-white/70">
              <Clock3 className="size-3.5" /> ~8 min
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-white/[0.05] px-2.5 py-2">
      <dt className="text-white/50">{label}</dt>
      <dd className="mt-0.5 font-medium leading-snug text-white">{value}</dd>
    </div>
  );
}

/* ---------------- Destinations ---------------- */

export function DestinationCards({
  destinations,
  onPick,
}: {
  destinations: Destination[];
  onPick: (d: Destination) => void;
}) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Destination ideas">
      {destinations.map((d) => (
        <li key={d.id} className="snap-start">
          <button
            type="button"
            onClick={() => onPick(d)}
            className="relative block h-[260px] w-[200px] overflow-hidden rounded-[24px] text-left transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img {...photo(d.image, 200, 260)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />
            <div className="absolute inset-x-0 top-0 p-3.5">
              <span className="glass-thin rounded-full px-2.5 py-1 text-[11px] text-white/85">{d.bestMonths}</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-3.5">
              <p className="text-[20px] font-medium leading-tight text-white">
                {d.city} {d.city !== d.country && <SerifAccent className="text-white/70">{d.country}</SerifAccent>}
              </p>
              <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-white/70">{d.blurb}</p>
              <p className="mt-2 text-[12px] text-white/60">
                Flights from <span className="font-semibold text-white">{usd(d.fromPrice)}</span>
              </p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
