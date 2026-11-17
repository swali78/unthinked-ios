"use client";

import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { emptyPassenger, type Passenger, SAVED_TRAVELER, validatePassenger } from "@/lib/data/booking";
import { cn } from "@/lib/utils";
import { SerifAccent } from "./primitives";
import { PrimaryButton, Screen } from "./screen";
import { FlowLoading, NoFlightSelected, useSelectedFlight } from "./use-selected-flight";

type Errors = Partial<Record<keyof Passenger, string>>;

export function PassengerDetails() {
  const { flight, search, state, ready } = useSelectedFlight();
  if (!ready) return <FlowLoading />;
  if (!flight || !search) return <NoFlightSelected />;
  // Keyed so the form re-initialises if the traveler count changes.
  return <PassengerForm key={search.pax} pax={search.pax} travelDate={search.date} initial={state.passengers} />;
}

function PassengerForm({ pax, travelDate, initial }: { pax: number; travelDate: string; initial: Passenger[] }) {
  const router = useRouter();
  const { update } = useSelectedFlight();
  const [list, setList] = useState<Passenger[]>(() =>
    Array.from({ length: pax }, (_, i) => initial[i] ?? (i === 0 ? { ...SAVED_TRAVELER } : emptyPassenger())),
  );
  const [errors, setErrors] = useState<Errors[]>([]);

  const set = (i: number, patch: Partial<Passenger>) => {
    setList((l) => l.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    setErrors((e) => e.map((x, j) => (j === i ? { ...x, ...Object.fromEntries(Object.keys(patch).map((k) => [k, undefined])) } : x)));
  };

  const submit = () => {
    const errs = list.map((p) => validatePassenger(p, travelDate));
    setErrors(errs);
    const firstBad = errs.findIndex((e) => Object.keys(e).length > 0);
    if (firstBad >= 0) {
      const field = Object.keys(errs[firstBad])[0];
      document.getElementById(`p${firstBad}-${field}`)?.focus();
      return;
    }
    update({ passengers: list });
    router.push("/flights/checkout");
  };

  return (
    <Screen
      title={
        <>
          Who&apos;s <SerifAccent className="text-[19px]">flying?</SerifAccent>
        </>
      }
      footer={
        <PrimaryButton className="w-full" onClick={submit}>
          Review and pay
        </PrimaryButton>
      }
    >
      <p className="mb-4 mt-1 px-1 text-[13px] text-white/55">Enter names exactly as they appear on each passport.</p>
      <div className="space-y-4">
        {list.map((p, i) => (
          <fieldset key={i} className="glass rounded-[24px] p-4">
            <legend className="sr-only">Traveler {i + 1}</legend>
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-[16px] font-medium text-white">
                <UserRound className="size-4 text-white/60" /> Traveler {i + 1}
                {i === 0 && <span className="text-[12px] font-normal text-white/50">· you</span>}
              </p>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => set(i, { ...SAVED_TRAVELER, firstName: "", dob: "", passport: "" })}
                  className="text-[12.5px] text-white/60 underline-offset-2 hover:underline"
                >
                  Same nationality as you
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field id={`p${i}-firstName`} label="First name" value={p.firstName} error={errors[i]?.firstName} onChange={(v) => set(i, { firstName: v })} autoComplete={i === 0 ? "given-name" : "off"} />
              <Field id={`p${i}-lastName`} label="Last name" value={p.lastName} error={errors[i]?.lastName} onChange={(v) => set(i, { lastName: v })} autoComplete={i === 0 ? "family-name" : "off"} />
              <Field id={`p${i}-dob`} label="Date of birth" type="date" value={p.dob} error={errors[i]?.dob} onChange={(v) => set(i, { dob: v })} />
              <Field id={`p${i}-nationality`} label="Nationality" value={p.nationality} error={errors[i]?.nationality} onChange={(v) => set(i, { nationality: v })} />
              <Field id={`p${i}-passport`} label="Passport number" value={p.passport} error={errors[i]?.passport} onChange={(v) => set(i, { passport: v.toUpperCase() })} />
              <Field id={`p${i}-passportExpiry`} label="Passport expiry" type="date" value={p.passportExpiry} error={errors[i]?.passportExpiry} onChange={(v) => set(i, { passportExpiry: v })} />
            </div>
          </fieldset>
        ))}
      </div>
    </Screen>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete = "off",
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
          "flex flex-col rounded-[16px] bg-white/[0.06] px-3 py-2 transition-shadow focus-within:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]",
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
          className="h-7 min-w-0 bg-transparent text-[15px] text-white [color-scheme:dark] focus:outline-none"
        />
      </label>
      {error && (
        <p id={`${id}-err`} className="mt-1 px-1 text-[12px] leading-snug text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
