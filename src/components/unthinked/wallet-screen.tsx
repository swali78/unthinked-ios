"use client";

import { Download, Sun } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { type FlightTrip, type StayTrip, tripStart, useBooking } from "@/lib/booking-store";
import { fareById, fmtDay, fmtTime } from "@/lib/data/booking";
import { AIRPORTS } from "@/lib/data/seed";
import { stageOf, type VisaApplication } from "@/lib/data/visa";
import { downloadEVisa, Code, EVisaCard } from "./evisa-card";
import { SerifAccent, Skeleton } from "./primitives";
import { PrimaryLink, SecondaryButton } from "./screen";
import { TabScreen } from "./tab-screen";
import { stayRange } from "./trip-ui";
import { photo } from "@/lib/photo";

type Pass =
  | { id: string; kind: "boarding"; trip: FlightTrip; passenger: string; seat?: string; order: number }
  | { id: string; kind: "voucher"; trip: StayTrip; order: number }
  | { id: string; kind: "evisa"; app: VisaApplication; order: number };

const STACK_PEEK = 76; // px of each card visible in the stack
const CARD_H = 248;

export function WalletScreen() {
  const { state, ready } = useBooking();
  const params = useSearchParams();
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const passes: Pass[] = [];
  for (const t of state.trips) {
    if (t.kind === "flight") {
      t.passengers.forEach((p, i) =>
        passes.push({ id: `${t.id}-${i}`, kind: "boarding", trip: t, passenger: p, seat: t.seats[i], order: tripStart(t) }),
      );
    } else passes.push({ id: t.id, kind: "voucher", trip: t, order: tripStart(t) });
  }
  for (const a of state.visaApps) {
    if (stageOf(a, now) === "Approved") passes.push({ id: a.id, kind: "evisa", app: a, order: new Date(`${a.travel.arrival}T00:00:00`).getTime() });
  }
  passes.sort((a, b) => a.order - b.order);

  // ?pass=<booking ref> opens that pass (boarding passes match on the booking ref prefix).
  const wanted = params.get("pass");
  const selected = wanted ? passes.find((p) => p.id === wanted || p.id.startsWith(`${wanted}-`)) : undefined;
  const select = (id?: string) => router.replace(id ? `/wallet?pass=${id}` : "/wallet", { scroll: false });

  return (
    <TabScreen
      title={
        <>
          <SerifAccent>Wallet</SerifAccent>
        </>
      }
      action={
        selected ? (
          <button type="button" onClick={() => select()} className="glass-thin h-9 rounded-full px-4 text-[14px] text-white">
            Done
          </button>
        ) : undefined
      }
    >
      {!ready ? (
        <Skeleton className="h-[248px] w-full rounded-[26px]" />
      ) : passes.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-[26px] px-6 py-10 text-center">
          <span className="text-[34px]" aria-hidden>
            🎫
          </span>
          <p className="mt-3 text-[18px] font-medium text-white">Your wallet is empty</p>
          <p className="mt-1.5 max-w-[30ch] text-[14px] text-white/60">
            Boarding passes, hotel vouchers and approved e-visas land here after you book.
          </p>
          <PrimaryLink href="/flights" className="mt-5 h-11 text-[15px]">
            Book a flight
          </PrimaryLink>
        </div>
      ) : (
        <LayoutGroup>
          {selected ? (
            <div className="space-y-4">
              <motion.div layoutId={selected.id} transition={{ type: "spring", stiffness: 380, damping: 36 }}>
                <PassCard pass={selected} />
              </motion.div>
              <PassActions pass={selected} />
              <p className="px-1 text-[12.5px] text-white/45">Other passes</p>
              <Stack passes={passes.filter((p) => p.id !== selected.id)} onSelect={select} />
            </div>
          ) : (
            <Stack passes={passes} onSelect={select} />
          )}
        </LayoutGroup>
      )}
    </TabScreen>
  );
}

function Stack({ passes, onSelect }: { passes: Pass[]; onSelect: (id: string) => void }) {
  return (
    <ul aria-label="Passes">
      {passes.map((p, i) => (
        <motion.li
          key={p.id}
          layoutId={p.id}
          transition={{ type: "spring", stiffness: 380, damping: 36 }}
          style={{ marginTop: i === 0 ? 0 : -(CARD_H - STACK_PEEK), zIndex: i }}
          className="relative"
        >
          <button
            type="button"
            onClick={() => onSelect(p.id)}
            className="block w-full overflow-hidden rounded-[26px] text-left transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
            style={{ height: i === passes.length - 1 ? undefined : CARD_H }}
            aria-label={`Open ${label(p)}`}
          >
            <PassCard pass={p} />
          </button>
        </motion.li>
      ))}
    </ul>
  );
}

const label = (p: Pass) =>
  p.kind === "boarding"
    ? `boarding pass ${p.trip.flight.flightNumber} for ${p.passenger}`
    : p.kind === "voucher"
      ? `hotel voucher for ${p.trip.hotelName}`
      : `${p.app.destination} e-visa`;

function PassCard({ pass }: { pass: Pass }) {
  if (pass.kind === "evisa") return <EVisaCard app={pass.app} />;
  if (pass.kind === "voucher") return <Voucher trip={pass.trip} />;
  return <BoardingPass trip={pass.trip} passenger={pass.passenger} seat={pass.seat} id={pass.id} />;
}

function Shell({ children, tint }: { children: ReactNode; tint: string }) {
  return (
    <article
      className="relative overflow-hidden rounded-[26px] text-white shadow-[0_-8px_30px_-10px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.16)]"
      style={{ background: tint }}
    >
      {children}
    </article>
  );
}

function BoardingPass({ trip, passenger, seat, id }: { trip: FlightTrip; passenger: string; seat?: string; id: string }) {
  const f = trip.flight;
  const boarding = new Date(new Date(f.departAt).getTime() - 40 * 60000).toISOString();
  return (
    <Shell tint="linear-gradient(160deg, #2b2f36 0%, #1a1c20 60%, #121315 100%)">
      <div className="flex h-[68px] items-center justify-between px-5">
        <span>
          <span className="block text-[12px] text-white/55">Boarding pass</span>
          <span className="block text-[15px] font-medium">
            {f.airline.name} · {f.flightNumber}
          </span>
        </span>
        <span className="text-right text-[13px] text-white/70">{fmtDay(f.departAt)}</span>
      </div>
      <div className="flex items-end justify-between px-5 pb-4">
        <div>
          <p className="text-[44px] font-medium leading-none tracking-tight">{f.from}</p>
          <p className="mt-1 text-[12px] text-white/55">
            {AIRPORTS[f.from]} · {fmtTime(f.departAt)}
          </p>
        </div>
        <span className="mb-6 h-px flex-1 border-t border-dashed border-white/25 mx-3" />
        <div className="text-right">
          <p className="text-[44px] font-medium leading-none tracking-tight">{f.to}</p>
          <p className="mt-1 text-[12px] text-white/55">
            {AIRPORTS[f.to]} · {fmtTime(f.arriveAt)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-4 gap-2 border-t border-white/10 px-5 py-4 text-[11.5px]">
        <Field k="Passenger" v={passenger} span />
        <Field k="Seat" v={seat ?? "TBA"} />
        <Field k="Boards" v={fmtTime(boarding)} />
      </dl>
      <div className="flex items-center justify-between gap-4 border-t border-dashed border-white/15 px-5 py-4">
        <dl className="grid flex-1 grid-cols-2 gap-2 text-[11.5px]">
          <Field k="Gate" v="TBA" />
          <Field k="Fare" v={fareById(trip.fare).name} />
          <Field k="Cabin" v={f.cabin} />
          <Field k="Ref" v={trip.id} />
        </dl>
        <Code seed={id} size={86} />
      </div>
    </Shell>
  );
}

function Voucher({ trip }: { trip: StayTrip }) {
  return (
    <Shell tint="linear-gradient(160deg, #33302b 0%, #1f1d1a 60%, #141312 100%)">
      <div className="flex h-[68px] items-center justify-between px-5">
        <span className="min-w-0">
          <span className="block text-[12px] text-white/55">Hotel voucher</span>
          <span className="block truncate text-[15px] font-medium">{trip.hotelName}</span>
        </span>
        <span className="shrink-0 text-right text-[13px] text-white/70">{stayRange(trip)}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...photo(trip.image, 400, 120)} alt="" className="h-[120px] w-full object-cover" />
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <dl className="grid flex-1 grid-cols-2 gap-x-3 gap-y-2.5 text-[11.5px]">
          <Field k="Guest" v={trip.guestName} />
          <Field k="Room" v={trip.roomName} />
          <Field k="Check-in" v="From 15:00" />
          <Field k="Nights" v={`${trip.nights} · ${trip.guests} guest${trip.guests > 1 ? "s" : ""}`} />
          <Field k="Confirmation" v={trip.id} />
          <Field k="City" v={trip.city} />
        </dl>
        <Code seed={trip.id} size={86} />
      </div>
    </Shell>
  );
}

function Field({ k, v, span }: { k: string; v: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="text-white/45">{k}</dt>
      <dd className="mt-0.5 truncate text-[13.5px] font-medium">{v}</dd>
    </div>
  );
}

function PassActions({ pass }: { pass: Pass }) {
  const [error, setError] = useState<string>();
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        {pass.kind === "boarding" && (
          <p className="flex items-center gap-2 rounded-[18px] bg-white/[0.05] px-4 py-3 text-[13px] text-white/70">
            <Sun className="size-4 shrink-0" /> Turn your screen brightness up when you scan at the gate.
          </p>
        )}
        {pass.kind === "evisa" && (
          <SecondaryButton className="w-full" onClick={() => downloadEVisa(pass.app).catch((e: Error) => setError(e.message))}>
            <Download className="size-4" /> Download e-visa
          </SecondaryButton>
        )}
        {error && <p className="px-1 text-[12.5px] text-rose-300">{error}</p>}
        <p className="px-1 text-[11.5px] text-white/40">Demo pass. It won&apos;t scan at a real airport or hotel.</p>
      </motion.div>
    </AnimatePresence>
  );
}
