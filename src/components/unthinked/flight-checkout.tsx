"use client";

import { Plane } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import AICheckout from "@/components/kokonutui/ai-checkout";
import { fareById, farePrice, fmtDay, fmtTime, seatFee, seatMap, usd } from "@/lib/data/booking";
import { AIRPORTS, TRAVELER } from "@/lib/data/seed";
import { SerifAccent } from "./primitives";
import { PrimaryLink, Screen } from "./screen";
import { FlowLoading, NoFlightSelected, useSelectedFlight } from "./use-selected-flight";

export function FlightCheckout() {
  const { flight, search, state, ready, update } = useSelectedFlight();
  const [pnr, setPnr] = useState<string>();
  const seats = useMemo(() => (flight ? seatMap(flight.id) : []), [flight]);
  if (!ready) return <FlowLoading />;
  if (!flight || !search) return <NoFlightSelected />;

  const fare = fareById(state.fare);
  const fareTotal = farePrice(flight, state.fare) * search.pax;
  const seatFees = state.seats.reduce((sum, id) => {
    const s = seats.find((x) => x.id === id);
    return sum + (s ? seatFee(s, state.fare) : 0);
  }, 0);
  const subtotal = fareTotal + seatFees;
  const names = state.passengers.map((p) => `${p.firstName} ${p.lastName}`.trim()).filter(Boolean);

  return (
    <Screen
      title={
        <>
          Review <SerifAccent className="text-[19px]">& pay</SerifAccent>
        </>
      }
      footer={
        pnr ? (
          <div className="grid grid-cols-2 gap-2.5">
            <PrimaryLink href="/" className="glass-thin bg-transparent text-white">
              Home
            </PrimaryLink>
            <PrimaryLink href={`/chat?q=${encodeURIComponent(`Do I need a visa for ${AIRPORTS[flight.to]}?`)}`}>Check visa</PrimaryLink>
          </div>
        ) : undefined
      }
    >
      {/* Boarding-pass style summary */}
      <section className="glass relative mt-2 overflow-hidden rounded-[26px]" aria-label="Trip summary">
        <div className="p-4">
          <p className="text-[12px] text-white/55">
            {flight.airline.name} · {flight.flightNumber} · {fmtDay(flight.departAt)}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <p className="text-[34px] font-medium leading-none tracking-tight text-white">{flight.from}</p>
              <p className="mt-1 text-[12.5px] text-white/55">
                {AIRPORTS[flight.from]} · {fmtTime(flight.departAt)}
              </p>
            </div>
            <Plane className="size-5 rotate-45 text-white/60" />
            <div className="text-right">
              <p className="text-[34px] font-medium leading-none tracking-tight text-white">{flight.to}</p>
              <p className="mt-1 text-[12.5px] text-white/55">
                {AIRPORTS[flight.to]} · {fmtTime(flight.arriveAt)}
              </p>
            </div>
          </div>
        </div>
        {/* Perforation */}
        <div className="relative flex items-center">
          <span className="absolute -left-3 size-6 rounded-full bg-[#0b0b0c]" />
          <span className="mx-5 h-px flex-1 border-t border-dashed border-white/15" />
          <span className="absolute -right-3 size-6 rounded-full bg-[#0b0b0c]" />
        </div>
        <dl className="grid grid-cols-2 gap-y-3 p-4 text-[13px]">
          <Item k="Travelers" v={names.length ? names.join(", ") : `${search.pax}`} />
          <Item k="Fare" v={`${fare.name} · ${fare.checkedBag === "Not included" ? "cabin bag only" : fare.checkedBag}`} />
          <Item k="Seats" v={state.seats.length ? state.seats.join(", ") : "Assigned at check-in"} />
          <Item k="Cabin" v={flight.cabin} />
        </dl>
      </section>

      <dl className="mt-4 space-y-1.5 px-1 text-[13.5px]">
        <Line k={`${fare.name} fare × ${search.pax}`} v={usd(fareTotal, 2)} />
        <Line k="Seat selection" v={seatFees ? usd(seatFees, 2) : "Included"} />
      </dl>

      <div className="mt-5">
        <AICheckout
          message={pnr ? undefined : "Everything look right? Pay with your saved card to confirm."}
          confirmation={pnr ? `You're booked. Booking reference ${pnr}. Your e-tickets are on their way.` : undefined}
          checkout={{
            merchant: flight.airline.name,
            item: {
              title: `${flight.fromCity} → ${flight.toCity}`,
              subtitle: `${search.pax} traveler${search.pax > 1 ? "s" : ""} · ${fare.name}`,
              unitPrice: subtotal,
              quantity: 1,
              maxQuantity: 1,
              icon: (
                <span className="flex size-11 items-center justify-center rounded-[12px] bg-zinc-800 text-[12px] font-semibold text-white ring-1 ring-white/10">
                  {flight.airline.code}
                </span>
              ),
            },
            taxRate: 0.05,
            cardLast4: TRAVELER.cardLast4,
            delivery: "E-tickets by email",
            feeLine: { label: "Seats & extras", value: seatFees ? "In subtotal" : "Included" },
          }}
          onPay={async (_qty, total) => {
            await new Promise((r) => setTimeout(r, 1400));
            const { ref, at } = bookingStamp();
            update({
              trips: [
                { kind: "flight", id: ref, bookedAt: at, flight, fare: state.fare, seats: state.seats, passengers: names.length ? names : ["Traveler"], total },
                ...state.trips,
              ],
            });
            setPnr(ref);
            return ref;
          }}
        />
        <p className="mt-4 px-1 text-[12px] leading-relaxed text-white/40">
          This is a demo. No card is charged and no ticket is issued.{" "}
          <Link href="/flights" className="underline underline-offset-2">
            Start a new search
          </Link>
        </p>
      </div>
    </Screen>
  );
}

/** Booking reference and time (only called from the pay handler). */
const bookingStamp = () => ({ ref: Math.random().toString(36).slice(2, 8).toUpperCase(), at: Date.now() });

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0 pr-2">
      <dt className="text-[11.5px] text-white/50">{k}</dt>
      <dd className="truncate text-white">{v}</dd>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-white/55">{k}</dt>
      <dd className="tabular-nums text-white/85">{v}</dd>
    </div>
  );
}
