"use client";

import { Bell, ChevronRight, Cloud, CreditCard, FileText, Plane, RotateCcw, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { DEFAULT_PREFS, type Prefs, useBooking } from "@/lib/booking-store";
import { SAVED_TRAVELER } from "@/lib/data/booking";
import { AIRPORTS, TRAVELER } from "@/lib/data/seed";
import { useSession } from "@/lib/session";
import { findOffensive, OFFENSIVE_MESSAGE } from "@/lib/moderation";
import { cn } from "@/lib/utils";
import { Chip, SerifAccent, Skeleton, Switch } from "./primitives";
import { SectionLabel } from "./screen";
import { TabScreen } from "./tab-screen";

const SEATS: Prefs["seat"][] = ["Window", "Aisle", "No preference"];
const CABINS: Prefs["cabin"][] = ["Economy", "Premium", "Business", "First"];
const MEALS: Prefs["meal"][] = ["Standard", "Vegetarian", "Halal", "Vegan"];

export function ProfileScreen() {
  const router = useRouter();
  const { state, ready, update, reset } = useBooking();
  const [confirmReset, setConfirmReset] = useState(false);
  const account = useSession();
  const prefs = state.prefs;
  const setPref = (patch: Partial<Prefs>) => update({ prefs: { ...prefs, ...patch } });

  if (!ready) {
    return (
      <TabScreen title="Profile">
        <Skeleton className="h-[96px] w-full rounded-[26px]" />
      </TabScreen>
    );
  }

  const me = `${prefs.name} ${SAVED_TRAVELER.lastName}`;
  const companions = [
    ...new Set(
      state.trips.flatMap((t) => (t.kind === "flight" ? t.passengers : [t.guestName])).filter((n) => n && !n.startsWith(prefs.name) && n !== "Traveler"),
    ),
  ];
  const expiry = new Date(`${SAVED_TRAVELER.passportExpiry}T00:00:00`);
  const monthsLeft = (expiry.getFullYear() - new Date().getFullYear()) * 12 + expiry.getMonth() - new Date().getMonth();

  return (
    <TabScreen
      title={
        <>
          <SerifAccent>Profile</SerifAccent>
        </>
      }
    >
      {/* Identity */}
      <section className="glass flex items-center gap-4 rounded-[26px] p-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-[20px] font-semibold text-black">
          {prefs.name.slice(0, 1).toUpperCase()}
          {SAVED_TRAVELER.lastName.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <label htmlFor="p-name" className="text-[12px] text-white/50">
            Display name
          </label>
          <input
            id="p-name"
            value={prefs.name}
            maxLength={24}
            onChange={(e) => setPref({ name: e.target.value })}
            onBlur={(e) => (!e.target.value.trim() || findOffensive(e.target.value)) && setPref({ name: DEFAULT_PREFS.name })}
            aria-invalid={Boolean(findOffensive(prefs.name))}
            className="block w-full bg-transparent text-[20px] font-medium text-white focus:outline-none"
          />
          {findOffensive(prefs.name) && <p role="alert" className="text-[12px] text-rose-300">{OFFENSIVE_MESSAGE}</p>}
          <p className="text-[12.5px] text-white/50">
            {SAVED_TRAVELER.nationality} passport · Home {prefs.homeAirport}
          </p>
        </div>
      </section>

      {/* Account */}
      <Link href="/account" className="glass mt-3 flex items-center gap-3 rounded-[22px] px-4 py-3.5 transition-transform active:scale-[0.98]">
        <Cloud className="size-4 shrink-0 text-[#E9C99F]" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] text-white">
            {account.status === "signed-in" ? "Synced to your account" : "Create an account"}
          </span>
          <span className="block truncate text-[12px] text-white/50">
            {account.status === "signed-in" ? account.user?.email : "Keep trips, matches and chats on every device"}
          </span>
        </span>
        <ChevronRight className="size-4 text-white/35" />
      </Link>

      <SectionLabel className="mt-7">Travelers</SectionLabel>
      <List>
        <Row icon={Users} title={me} detail="You" />
        {companions.map((c) => (
          <Row key={c} icon={Users} title={c} detail="Travelled with you" />
        ))}
        {companions.length === 0 && <p className="px-4 py-3 text-[13px] text-white/50">People you book for will be saved here.</p>}
      </List>

      <SectionLabel className="mt-7">Passport</SectionLabel>
      <List>
        <Row
          icon={FileText}
          title={`${SAVED_TRAVELER.nationality} · ${SAVED_TRAVELER.passport.slice(0, 3)}•••${SAVED_TRAVELER.passport.slice(-2)}`}
          detail={
            <span className={monthsLeft < 6 ? "text-amber-300" : "text-white/50"}>
              Expires {expiry.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              {monthsLeft < 6 ? " · renew soon" : ""}
            </span>
          }
        />
      </List>

      <SectionLabel className="mt-7">Travel preferences</SectionLabel>
      <div className="glass space-y-5 rounded-[24px] p-4">
        <label className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 whitespace-nowrap text-[15px] text-white">
            <Plane className="size-4 text-white/55" /> Home airport
          </span>
          <select
            value={prefs.homeAirport}
            onChange={(e) => setPref({ homeAirport: e.target.value })}
            className="glass-thin h-10 appearance-none rounded-full bg-transparent px-4 text-[14px] text-white [color-scheme:dark] focus:outline-none"
          >
            {Object.entries(AIRPORTS)
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map(([code, city]) => (
                <option key={code} value={code}>
                  {city} ({code})
                </option>
              ))}
          </select>
        </label>
        <ChipGroup label="Seat" options={SEATS} value={prefs.seat} onChange={(seat) => setPref({ seat })} />
        <ChipGroup label="Cabin" options={CABINS} value={prefs.cabin} onChange={(cabin) => setPref({ cabin })} />
        <ChipGroup label="Meal" options={MEALS} value={prefs.meal} onChange={(meal) => setPref({ meal })} />
      </div>

      <SectionLabel className="mt-7">Payment</SectionLabel>
      <List>
        <Row
          icon={CreditCard}
          title={`Visa •••• ${TRAVELER.cardLast4}`}
          detail="Default · demo card, never charged"
        />
      </List>
      <p className="mt-2 px-1 text-[12px] text-white/40">Adding real cards needs a payment provider, which this demo doesn&apos;t connect to.</p>

      <SectionLabel className="mt-7">Settings</SectionLabel>
      <List>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-3 text-[15px] text-white">
            <Bell className="size-4 text-white/55" /> Trip updates
          </span>
          <Switch checked={prefs.notifications} onChange={(notifications) => setPref({ notifications })} label="Trip updates" />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            reset();
            router.replace("/welcome");
          }}
          onBlur={() => setConfirmReset(false)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left"
        >
          <span className={cn("flex items-center gap-3 text-[15px]", confirmReset ? "text-rose-300" : "text-white")}>
            <RotateCcw className="size-4" />
            {confirmReset ? "Tap again to erase everything" : "Reset demo data"}
          </span>
          <span className="text-[12px] text-white/45">
            {confirmReset ? "Bookings, visas, settings" : `${state.trips.length + state.visaApps.length} items`}
          </span>
        </button>
      </List>

      <p className="mt-8 text-center text-[12px] text-white/35">Unthinked demo · prices, bookings and visas are simulated</p>
    </TabScreen>
  );
}

function List({ children }: { children: ReactNode }) {
  return <div className="glass divide-y divide-white/[0.07] overflow-hidden rounded-[24px]">{children}</div>;
}

function Row({ icon: Icon, title, detail }: { icon: typeof Users; title: string; detail: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 shrink-0 text-white/55" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] text-white">{title}</span>
        <span className="block text-[12px] text-white/50">{detail}</span>
      </span>
    </div>
  );
}

function ChipGroup<T extends string>({ label, options, value, onChange }: { label: string; options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-2 text-[13px] text-white/55">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} role="radio" aria-checked={value === o} selected={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
}

