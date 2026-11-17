"use client";

import { Camera, Check, ChevronLeft, Glasses, ImageUp, Ruler, ScanLine, Smile, Sun, TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import AICheckout from "@/components/kokonutui/ai-checkout";
import { useBooking } from "@/lib/booking-store";
import { SAVED_TRAVELER, usd } from "@/lib/data/booking";
import { getHotel } from "@/lib/data/hotels";
import { toISODate } from "@/lib/data/search";
import { TRAVELER } from "@/lib/data/seed";
import { canApplyOnline, SERVICE_FEE, type VisaApplication, type VisaPurpose, visaRuleFor } from "@/lib/data/visa";
import { cn } from "@/lib/utils";
import { Chip, SerifAccent } from "./primitives";
import { PrimaryButton, PrimaryLink, SecondaryButton } from "./screen";
import { FlowLoading } from "./use-selected-flight";

const STEPS = ["Personal details", "Passport", "Photo", "Travel plans", "Review & pay"] as const;
const PURPOSES: VisaPurpose[] = ["Tourism", "Business", "Visiting family"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EASE = [0.32, 0.72, 0, 1] as const;

type Upload = { url: string; name: string; w: number; h: number; size: number };

/** Reference and timestamp for a new application (only called from the pay handler). */
const newStamp = () => ({ id: `V${Math.random().toString(36).slice(2, 8).toUpperCase()}`, submittedAt: Date.now() });

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Waits for saved state so travel details can be prefilled from a hotel booking. */
export function VisaApply() {
  const { ready } = useBooking();
  return ready ? <VisaApplyForm /> : <FlowLoading />;
}

function VisaApplyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const destination = params.get("country") ?? "Egypt";
  const nationality = params.get("nationality") ?? "India";
  const rule = visaRuleFor(nationality, destination);
  const { state, update } = useBooking();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [tried, setTried] = useState<Record<number, boolean>>({});

  const [person, setPerson] = useState({
    firstName: SAVED_TRAVELER.firstName,
    lastName: SAVED_TRAVELER.lastName,
    dob: SAVED_TRAVELER.dob,
    email: "khalid@example.com",
  });
  const [passport, setPassport] = useState({ number: "", expiry: "" });
  const [scan, setScan] = useState<{ file?: Upload; status: "idle" | "scanning" | "done" }>({ status: "idle" });
  const [photo, setPhoto] = useState<Upload>();
  const today = new Date();
  const [travel, setTravel] = useState(() => {
    // Prefill from a hotel booked in this country, if there is one.
    const hotel = state.stay ? getHotel(state.stay.hotelId) : undefined;
    const matches = hotel && hotel.country === destination;
    const arrival = matches ? state.stay!.checkIn : toISODate(addDays(today, 14));
    return {
      arrival,
      departure: toISODate(addDays(new Date(`${arrival}T00:00:00`), matches ? state.stay!.nights : 7)),
      purpose: "Tourism" as VisaPurpose,
      address: matches ? `${hotel.name}, ${hotel.area}, ${hotel.city}` : "",
      fromHotel: matches ? hotel.name : undefined,
    };
  });
  const [declared, setDeclared] = useState(false);
  const [appId, setAppId] = useState<string>();

  // Free object URLs when they're replaced or the page unmounts.
  const urls = useRef<string[]>([]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  if (!rule || !canApplyOnline(rule)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-[20px] font-medium text-white">No online application needed</p>
        <p className="max-w-[30ch] text-[14.5px] text-white/60">
          {rule ? `${destination} is ${rule.type.toLowerCase()} for ${nationality} passports, or needs an embassy visit.` : `We don't have rules for ${destination} yet.`}
        </p>
        <PrimaryLink href={`/visa?country=${encodeURIComponent(destination)}&nationality=${encodeURIComponent(nationality)}`} className="mt-3 h-11 text-[15px]">
          See requirements
        </PrimaryLink>
      </div>
    );
  }

  /* ---------- validation per step ---------- */
  const minExpiry = addDays(new Date(`${travel.arrival}T00:00:00`), 182);
  const errors: Record<number, Record<string, string | undefined>> = {
    0: {
      firstName: person.firstName.trim() ? undefined : "Enter your first name.",
      lastName: person.lastName.trim() ? undefined : "Enter your last name.",
      dob: person.dob && new Date(person.dob) < today ? undefined : "Enter a valid date of birth.",
      email: EMAIL.test(person.email.trim()) ? undefined : "Enter an email for your e-visa.",
    },
    1: {
      number: /^[A-Z0-9]{6,9}$/i.test(passport.number.trim()) ? undefined : "Use 6–9 letters or digits.",
      expiry: !passport.expiry
        ? "Enter the expiry date."
        : new Date(passport.expiry) < minExpiry
          ? "Must be valid 6 months after you arrive."
          : undefined,
    },
    2: {
      photo: !photo ? "Add a photo to continue." : photo.w < 600 || photo.h < 600 ? "This photo is too small. Use one at least 600 × 600 px." : photo.size > 10e6 ? "Use a file under 10 MB." : undefined,
    },
    3: {
      arrival: new Date(`${travel.arrival}T00:00:00`) < addDays(today, 3) ? "Allow at least 3 days for processing." : undefined,
      departure:
        travel.departure <= travel.arrival
          ? "Departure must be after arrival."
          : (new Date(travel.departure).getTime() - new Date(travel.arrival).getTime()) / 864e5 > rule.maxStayDays
            ? `This visa allows up to ${rule.maxStayDays} days.`
            : undefined,
      address: travel.address.trim().length >= 6 ? undefined : "Add where you'll stay, like a hotel name and city.",
    },
    4: {},
  };
  const stepValid = (i: number) => Object.values(errors[i]).every((e) => !e);
  const err = (i: number, k: string) => (tried[i] ? errors[i][k] : undefined);

  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  };
  const next = () => {
    setTried((t) => ({ ...t, [step]: true }));
    if (stepValid(step)) go(step + 1);
  };

  const readFile = (file: File, onDone: (u: Upload) => void) => {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    if (!file.type.startsWith("image/")) {
      onDone({ url, name: file.name, w: 0, h: 0, size: file.size });
      return;
    }
    const img = new Image();
    img.onload = () => onDone({ url, name: file.name, w: img.naturalWidth, h: img.naturalHeight, size: file.size });
    img.onerror = () => onDone({ url, name: file.name, w: 0, h: 0, size: file.size });
    img.src = url;
  };

  const onPassportFile = (file?: File) => {
    if (!file) return;
    readFile(file, (u) => {
      setScan({ file: u, status: "scanning" });
      // Demo "OCR": real text recognition would run server-side. Here we fill
      // from the saved passport after a short scan animation.
      setTimeout(() => {
        setPassport({ number: SAVED_TRAVELER.passport, expiry: SAVED_TRAVELER.passportExpiry });
        setScan((s) => ({ ...s, status: "done" }));
      }, 1800);
    });
  };

  const total = rule.fee + SERVICE_FEE;
  const submit = async () => {
    if (!declared) throw new Error("Tick the declaration above to submit.");
    await new Promise((r) => setTimeout(r, 1400));
    const { id, submittedAt } = newStamp();
    const app: VisaApplication = {
      id,
      destination,
      nationality,
      type: rule.type,
      fee: total,
      maxStayDays: rule.maxStayDays,
      submittedAt,
      applicant: { ...person, passport: passport.number.toUpperCase(), passportExpiry: passport.expiry },
      travel: { arrival: travel.arrival, departure: travel.departure, purpose: travel.purpose, address: travel.address },
    };
    update({ visaApps: [app, ...state.visaApps] });
    setAppId(id);
    return id;
  };

  /* ---------- step bodies ---------- */
  let body: ReactNode;
  if (step === 0) {
    body = (
      <div className="space-y-2.5">
        <Lead>Enter your details exactly as they appear on your passport.</Lead>
        <div className="grid grid-cols-2 gap-2.5">
          <Field id="v-first" label="First name" value={person.firstName} error={err(0, "firstName")} onChange={(firstName) => setPerson({ ...person, firstName })} />
          <Field id="v-last" label="Last name" value={person.lastName} error={err(0, "lastName")} onChange={(lastName) => setPerson({ ...person, lastName })} />
        </div>
        <Field id="v-dob" label="Date of birth" type="date" value={person.dob} error={err(0, "dob")} onChange={(dob) => setPerson({ ...person, dob })} />
        <Field id="v-email" label="Email for your e-visa" type="email" value={person.email} error={err(0, "email")} onChange={(email) => setPerson({ ...person, email })} />
        <p className="px-1 text-[12px] text-white/45">Nationality: {nationality}. Change it on the requirements screen.</p>
      </div>
    );
  } else if (step === 1) {
    body = (
      <div className="space-y-3">
        <Lead>Scan the photo page of your passport and we&apos;ll fill in the details.</Lead>
        <label
          className={cn(
            "glass relative flex h-[200px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-[24px] text-center",
            "focus-within:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]",
          )}
        >
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="sr-only"
            onChange={(e) => onPassportFile(e.target.files?.[0])}
          />
          {scan.file?.w ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scan.file.url} alt="Passport scan" className="absolute inset-0 size-full object-cover opacity-70" />
          ) : null}
          {scan.status === "scanning" && (
            <motion.span
              aria-hidden
              className="absolute inset-x-6 h-0.5 rounded-full bg-white shadow-[0_0_18px_4px_rgb(255_255_255/0.6)]"
              initial={{ top: "12%" }}
              animate={{ top: ["12%", "88%", "12%"] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <span className="relative flex flex-col items-center gap-2 rounded-[18px] bg-black/40 px-4 py-3">
            {scan.status === "done" ? <Check className="size-6 text-emerald-300" /> : <ScanLine className="size-6 text-white" />}
            <span className="text-[15px] font-medium text-white">
              {scan.status === "idle" ? "Scan or upload passport" : scan.status === "scanning" ? "Reading your passport…" : "Details read from your passport"}
            </span>
            <span className="text-[12px] text-white/60">
              {scan.status === "idle" ? "JPG, PNG or PDF of the photo page" : scan.file?.name}
            </span>
          </span>
        </label>
        {scan.status === "done" && (
          <p className="rounded-[16px] bg-white/[0.05] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/55">
            Demo scan: details are filled from your saved passport, not read from the image. Check them below.
          </p>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          <Field id="v-pp" label="Passport number" value={passport.number} error={err(1, "number")} onChange={(v) => setPassport({ ...passport, number: v.toUpperCase() })} />
          <Field id="v-ppx" label="Expiry date" type="date" value={passport.expiry} error={err(1, "expiry")} onChange={(expiry) => setPassport({ ...passport, expiry })} />
        </div>
      </div>
    );
  } else if (step === 2) {
    const checks = photo
      ? [
          photo.w >= 600 && photo.h >= 600
            ? { ok: true, label: `Sharp enough (${photo.w} × ${photo.h} px)` }
            : { ok: false, label: `Too small: ${photo.w} × ${photo.h} px, needs 600 × 600` },
          photo.h > photo.w
            ? { ok: true, label: "Portrait shape, like 35 × 45 mm" }
            : { ok: false, warnOnly: true, label: "Looks landscape. Crop it to a portrait 35 × 45 mm shape." },
          photo.size <= 10e6
            ? { ok: true, label: `File size ${photo.size < 1e6 ? `${Math.max(1, Math.round(photo.size / 1e3))} KB` : `${(photo.size / 1e6).toFixed(1)} MB`}` }
            : { ok: false, label: `${(photo.size / 1e6).toFixed(1)} MB is too large. Use a file under 10 MB.` },
        ]
      : [];
    body = (
      <div className="space-y-3">
        <Lead>Add a recent passport-style photo of your face.</Lead>
        <ul className="grid grid-cols-2 gap-2 text-[12.5px]">
          <Guide icon={Sun} text="Even light, plain white background" />
          <Guide icon={Smile} text="Neutral face, mouth closed" />
          <Guide icon={Glasses} text="No glasses or hats" />
          <Guide icon={Ruler} text="Taken in the last 6 months" />
        </ul>
        <div className="flex gap-3">
          <label className="glass relative flex h-[168px] w-[132px] shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[22px] focus-within:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]">
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="sr-only"
              aria-label="Upload visa photo"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f, setPhoto);
              }}
            />
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt="Your visa photo" className="size-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-center text-[12px] text-white/60">
                <Camera className="size-6 text-white/80" />
                Take or upload
              </span>
            )}
            {/* Face guide */}
            <span aria-hidden className="pointer-events-none absolute left-1/2 top-[14%] h-[62%] w-[58%] -translate-x-1/2 rounded-[50%] border border-dashed border-white/70 mix-blend-difference" />
          </label>
          <div className="flex-1 space-y-2 pt-1">
            {photo ? (
              checks.map((c) => (
                <p key={c.label} className={cn("flex items-start gap-2 text-[13px]", c.ok ? "text-white/85" : c.warnOnly ? "text-amber-200" : "text-rose-300")}>
                  {c.ok ? <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" /> : <TriangleAlert className="mt-0.5 size-4 shrink-0" />}
                  {c.label}
                </p>
              ))
            ) : (
              <p className="text-[13px] leading-relaxed text-white/55">We check size and shape here. The embassy checks the rest.</p>
            )}
            {photo && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px] text-white/60 underline-offset-2 hover:underline">
                <ImageUp className="size-3.5" /> Replace photo
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0], setPhoto)} />
              </label>
            )}
          </div>
        </div>
        {err(2, "photo") && <p className="px-1 text-[12.5px] text-rose-300">{err(2, "photo")}</p>}
      </div>
    );
  } else if (step === 3) {
    body = (
      <div className="space-y-2.5">
        <Lead>Tell {destination} when you&apos;re coming and where you&apos;ll stay.</Lead>
        <div className="grid grid-cols-2 gap-2.5">
          <Field id="v-arr" label="Arrival" type="date" value={travel.arrival} error={err(3, "arrival")} onChange={(arrival) => setTravel({ ...travel, arrival })} />
          <Field id="v-dep" label="Departure" type="date" value={travel.departure} error={err(3, "departure")} onChange={(departure) => setTravel({ ...travel, departure })} />
        </div>
        <div className="pt-1">
          <p className="mb-2 px-1 text-[12px] text-white/55">Purpose of visit</p>
          <div className="flex flex-wrap gap-2">
            {PURPOSES.map((p) => (
              <Chip key={p} selected={travel.purpose === p} onClick={() => setTravel({ ...travel, purpose: p })}>
                {p}
              </Chip>
            ))}
          </div>
        </div>
        <Field id="v-addr" label="Address in destination" value={travel.address} error={err(3, "address")} onChange={(address) => setTravel({ ...travel, address, fromHotel: undefined })} />
        {travel.fromHotel && <p className="px-1 text-[12px] text-emerald-300/85">Filled from your {travel.fromHotel} booking.</p>}
      </div>
    );
  } else {
    const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    body = (
      <div className="space-y-2.5">
        {!appId && <Lead>Check everything once more. You can&apos;t edit after you submit.</Lead>}
        <ReviewBlock title="Personal details" onEdit={appId ? undefined : () => go(0)} rows={[["Name", `${person.firstName} ${person.lastName}`], ["Date of birth", fmt(person.dob)], ["Email", person.email]]} />
        <ReviewBlock title="Passport" onEdit={appId ? undefined : () => go(1)} rows={[["Number", passport.number], ["Expires", fmt(passport.expiry)], ["Nationality", nationality]]} />
        <ReviewBlock
          title="Photo & travel"
          onEdit={appId ? undefined : () => go(3)}
          rows={[["Photo", photo?.name ?? "—"], ["Dates", `${fmt(travel.arrival)} – ${fmt(travel.departure)}`], ["Purpose", travel.purpose], ["Staying at", travel.address]]}
        />
        {!appId && (
          <label className="flex cursor-pointer items-start gap-3 rounded-[18px] bg-white/[0.05] px-4 py-3 text-[13px] leading-relaxed text-white/75">
            <input type="checkbox" checked={declared} onChange={(e) => setDeclared(e.target.checked)} className="mt-1 size-4 accent-white" />
            I confirm these details are true and match my passport. A wrong detail can get the visa refused.
          </label>
        )}
        <div className="pt-2">
          <AICheckout
            message={appId ? undefined : `Submit your ${destination} eVisa application.`}
            confirmation={appId ? `Submitted. Reference ${appId}. We'll email ${person.email} when it's decided.` : undefined}
            checkout={{
              merchant: `${destination} eVisa`,
              item: {
                title: `${rule.type} · ${rule.maxStayDays} days`,
                subtitle: `${person.firstName} ${person.lastName}`,
                unitPrice: total,
                quantity: 1,
                maxQuantity: 1,
                icon: <span className="flex size-11 items-center justify-center rounded-[12px] bg-zinc-800 text-[20px] ring-1 ring-white/10">🛂</span>,
              },
              taxRate: 0,
              cardLast4: TRAVELER.cardLast4,
              delivery: `Decision in ${rule.processingDays}`,
              feeLine: { label: "Government + service fee", value: `${usd(rule.fee)} + ${usd(SERVICE_FEE)}` },
            }}
            onPay={submit}
          />
        </div>
      </div>
    );
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="relative flex h-full flex-col pt-[max(env(safe-area-inset-top),12px)] md:pt-[54px]">
      <header className="px-4 pb-3">
        <div className="grid grid-cols-[44px_1fr_44px] items-center">
          <button
            type="button"
            aria-label={step === 0 || appId ? "Back to requirements" : "Previous step"}
            onClick={() => (step === 0 || appId ? router.push(`/visa?country=${encodeURIComponent(destination)}`) : go(step - 1))}
            className="glass-thin flex size-11 items-center justify-center rounded-full text-white/85 active:scale-[0.96]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h1 className="text-center text-[17px] text-white">
            {destination} <SerifAccent className="text-[19px]">eVisa</SerifAccent>
          </h1>
        </div>
        <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Application progress">
          {STEPS.map((s, i) => (
            <span key={s} className={cn("h-1 flex-1 rounded-full transition-colors duration-200", i <= step ? "bg-white" : "bg-white/15")} />
          ))}
        </div>
        <p className="mt-2 text-[12.5px] text-white/55">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </header>

      <main className="relative flex-1 overflow-y-auto overflow-x-clip px-4 pb-8 [scrollbar-width:none]">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={{ enter: (d: number) => ({ x: d * 40, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d: number) => ({ x: d * -40, opacity: 0 }) }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: EASE }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </main>

      {(!last || appId) && (
        <div className="relative z-10 border-t border-white/[0.06] bg-[#0b0b0c]/85 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl md:pb-7">
          {appId ? (
            <PrimaryButton className="w-full" onClick={() => router.push(`/visa/status?id=${appId}`)}>
              Track application
            </PrimaryButton>
          ) : (
            <div className="grid grid-cols-[auto_1fr] gap-2.5">
              {step > 0 && <SecondaryButton onClick={() => go(step - 1)}>Back</SecondaryButton>}
              <PrimaryButton className={cn(step === 0 && "col-span-2")} onClick={next} disabled={scan.status === "scanning"}>
                {step === 1 && scan.status === "scanning" ? "Reading…" : "Continue"}
              </PrimaryButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Lead({ children }: { children: ReactNode }) {
  return <p className="mb-1 px-1 text-[15px] leading-relaxed text-white/75">{children}</p>;
}

function Guide({ icon: Icon, text }: { icon: typeof Sun; text: string }) {
  return (
    <li className="glass-thin flex items-start gap-2 rounded-[14px] px-3 py-2.5 text-white/80">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-white/60" /> {text}
    </li>
  );
}

function ReviewBlock({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit?: () => void }) {
  return (
    <section className="glass rounded-[20px] px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[14px] font-medium text-white">{title}</h3>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-[12.5px] text-white/60 underline-offset-2 hover:underline">
            Edit
          </button>
        )}
      </div>
      <dl className="space-y-1 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-white/50">{k}</dt>
            <dd className="truncate text-right text-white/90">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={cn(
          "flex flex-col rounded-[16px] bg-white/[0.06] px-3.5 py-2.5 focus-within:shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.6)]",
          error && "shadow-[inset_0_0_0_1.5px_rgb(251_113_133/0.7)]",
        )}
      >
        <span className="text-[11.5px] text-white/50">{label}</span>
        <input
          id={id}
          type={type}
          value={value}
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
