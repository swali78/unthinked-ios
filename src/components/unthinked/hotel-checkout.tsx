"use client";

import { CalendarDays, Moon, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import AICheckout from "@/components/kokonutui/ai-checkout";
import { useBooking } from "@/lib/booking-store";
import { SAVED_TRAVELER, usd } from "@/lib/data/booking";
import { getHotel, hotelRooms } from "@/lib/data/hotels";
import { TRAVELER } from "@/lib/data/seed";
import { cn } from "@/lib/utils";
import { checkOutDate, fmtShort, hotelQuery, Stars } from "./hotel-ui";
import { Chip, SerifAccent } from "./primitives";
import { PrimaryLink, Screen, SectionLabel } from "./screen";
import { FlowLoading } from "./use-selected-flight";
import { photo } from "@/lib/photo";

const ARRIVALS = ["Before 12:00", "12:00 – 15:00", "15:00 – 18:00", "After 18:00", "Not sure"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const arrivalPhrase = (a: string) => {
  if (a === "Not sure") return "on the day";
  if (a.includes("–")) return `between ${a.replace(" – ", " and ")}`;
  return a.replace("Before", "before").replace("After", "after");
};

export function HotelCheckout() {
  const { state, ready, update } = useBooking();
  const [guest, setGuest] = useState({ name: `${SAVED_TRAVELER.firstName} ${SAVED_TRAVELER.lastName}`, email: "khalid@example.com" });
  const [arrival, setArrival] = useState<string>("15:00 – 18:00");
  const [requests, setRequests] = useState("");
  const [touched, setTouched] = useState(false);
  const [ref, setRef] = useState<string>();

  if (!ready) return <FlowLoading />;
  const stay = state.stay;
  const hotel = stay ? getHotel(stay.hotelId) : undefined;
  const room = hotel ? hotelRooms(hotel).find((r) => r.id === stay?.roomId) : undefined;

  if (!stay || !hotel || !room) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-[20px] font-medium text-white">No stay selected</p>
        <p className="max-w-[28ch] text-[14.5px] text-white/60">Search for a hotel and pick a room to continue.</p>
        <PrimaryLink href="/hotels" className="mt-3 h-11 text-[15px]">
          Search stays
        </PrimaryLink>
      </div>
    );
  }

  const errors = {
    name: guest.name.trim().split(/\s+/).length < 2 ? "Enter a first and last name." : undefined,
    email: EMAIL.test(guest.email.trim()) ? undefined : "Enter a valid email for the confirmation.",
  };
  const valid = !errors.name && !errors.email;
  const show = (k: keyof typeof errors) => touched && errors[k];

  return (
    <Screen
      title={
        <>
          Confirm <SerifAccent className="text-[19px]">your stay</SerifAccent>
        </>
      }
      back={`/hotels/detail?${hotelQuery(stay, { id: hotel.id })}`}
      footer={
        ref ? (
          <div className="grid grid-cols-2 gap-2.5">
            <PrimaryLink href="/" className="glass-thin bg-transparent text-white">
              Home
            </PrimaryLink>
            <PrimaryLink href={`/flights?to=${encodeURIComponent(hotel.city)}&date=${stay.checkIn}`}>Add a flight</PrimaryLink>
          </div>
        ) : undefined
      }
    >
      {/* Stay summary */}
      <section className="glass mt-2 flex gap-3 rounded-[24px] p-2.5" aria-label="Stay summary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...photo(hotel.image, 92, 92)} alt="" className="size-[92px] shrink-0 rounded-[18px] object-cover" />
        <div className="min-w-0 py-1 pr-1">
          <Stars n={hotel.stars} />
          <p className="mt-1 truncate text-[16px] font-medium text-white">{hotel.name}</p>
          <p className="truncate text-[12.5px] text-white/55">
            {room.name} · {room.bed}
          </p>
          <p className={cn("mt-1 text-[12px]", room.cancellation === "free" ? "text-emerald-300" : "text-white/50")}>
            {room.cancellation === "free" ? "Free cancellation until 48h before" : "Non-refundable"}
          </p>
        </div>
      </section>
      <div className="mt-2.5 grid grid-cols-3 gap-2 text-[12.5px]">
        <Fact icon={CalendarDays} k="Check-in" v={fmtShort(stay.checkIn)} />
        <Fact icon={Moon} k="Nights" v={`${stay.nights} · out ${fmtShort(checkOutDate(stay))}`} />
        <Fact icon={Users} k="Guests" v={String(stay.guests)} />
      </div>

      {!ref && (
        <>
          <SectionLabel className="mt-7">Lead guest</SectionLabel>
          <div className="space-y-2.5">
            <Field id="g-name" label="Full name" value={guest.name} error={show("name") || undefined} onChange={(name) => setGuest({ ...guest, name })} autoComplete="name" />
            <Field id="g-email" label="Email for confirmation" type="email" value={guest.email} error={show("email") || undefined} onChange={(email) => setGuest({ ...guest, email })} autoComplete="email" />
          </div>

          <SectionLabel className="mt-7">Estimated arrival</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {ARRIVALS.map((a) => (
              <Chip key={a} selected={arrival === a} onClick={() => setArrival(a)}>
                {a}
              </Chip>
            ))}
          </div>

          <SectionLabel className="mt-7">Requests for the hotel</SectionLabel>
          <label htmlFor="g-req" className="sr-only">Requests for the hotel</label>
          <textarea
            id="g-req"
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="High floor, quiet room, early check-in…"
            className="w-full resize-none rounded-[18px] bg-white/[0.06] px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none focus:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]"
          />
          <p className="mt-1 px-1 text-[11.5px] text-white/40">Requests aren&apos;t guaranteed, but the hotel sees them before you arrive.</p>
        </>
      )}

      <div className="mt-6">
        <AICheckout
          message={ref ? undefined : "Your saved card is ready. Pay now to lock this rate."}
          confirmation={ref ? `Reserved. Confirmation ${ref} is on its way to ${guest.email}, and the hotel expects you ${arrivalPhrase(arrival)}.` : undefined}
          checkout={{
            merchant: hotel.name,
            item: {
              title: room.name,
              subtitle: `${usd(room.price)} × ${stay.nights} night${stay.nights > 1 ? "s" : ""}`,
              unitPrice: room.price * stay.nights,
              quantity: 1,
              maxQuantity: 1,
              icon: (
                // eslint-disable-next-line @next/next/no-img-element
                <img {...photo(hotel.image, 44, 44)} alt="" className="size-11 rounded-[12px] object-cover" />
              ),
            },
            taxRate: 0.12,
            cardLast4: TRAVELER.cardLast4,
            delivery: room.cancellation === "free" ? "Free cancellation" : "Non-refundable",
            feeLine: { label: "City tax", value: "Pay at hotel" },
          }}
          onPay={async (_qty, total) => {
            setTouched(true);
            if (!valid) throw new Error("Add the lead guest's full name and a valid email above, then pay.");
            await new Promise((r) => setTimeout(r, 1400));
            const { code, at } = stayStamp();
            update({
              trips: [
                {
                  kind: "stay",
                  id: code,
                  bookedAt: at,
                  hotelId: hotel.id,
                  hotelName: hotel.name,
                  image: hotel.image,
                  city: hotel.city,
                  country: hotel.country,
                  roomName: room.name,
                  checkIn: stay.checkIn,
                  nights: stay.nights,
                  guests: stay.guests,
                  guestName: guest.name.trim(),
                  total,
                },
                ...state.trips,
              ],
            });
            setRef(code);
            return code;
          }}
        />
        <p className="mt-4 px-1 text-[12px] leading-relaxed text-white/40">
          This is a demo. No card is charged and no room is held.{" "}
          <Link href="/hotels" className="underline underline-offset-2">
            Start a new search
          </Link>
        </p>
      </div>
    </Screen>
  );
}

/** Confirmation code and time (only called from the pay handler). */
const stayStamp = () => ({ code: `VY${Math.random().toString(36).slice(2, 7).toUpperCase()}`, at: Date.now() });

function Fact({ icon: Icon, k, v }: { icon: typeof Moon; k: string; v: string }) {
  return (
    <div className="glass-thin rounded-[16px] px-3 py-2.5">
      <p className="flex items-center gap-1 text-white/50">
        <Icon className="size-3" /> {k}
      </p>
      <p className="mt-0.5 truncate text-white">{v}</p>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex flex-col rounded-[16px] bg-white/[0.06] px-4 py-2.5 focus-within:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]",
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
          className="h-7 bg-transparent text-[15px] text-white focus:outline-none"
        />
      </label>
      {error && (
        <p id={`${id}-err`} className="mt-1 px-1 text-[12px] text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
