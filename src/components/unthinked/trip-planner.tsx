"use client";

import { ChevronLeft, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { defaultDepartDate, toISODate } from "@/lib/data/search";
import { BUDGETS, PLANNER_COUNTRIES, upcomingMonths, VIBES } from "@/lib/data/planner";
import { cn } from "@/lib/utils";
import { Chip, FadedQuestion } from "./primitives";
import { Stepper } from "./screen";
import { photo } from "@/lib/photo";

type Plan = {
  country?: string;
  cities: string[];
  month?: string;
  nights: number;
  adults: number;
  children: number;
  budget?: (typeof BUDGETS)[number]["id"];
  vibes: string[];
};

const STEPS = ["destination", "cities", "dates", "travelers", "budget", "vibe", "summary"] as const;
type Step = (typeof STEPS)[number];

const QUESTIONS: Record<Step, string> = {
  destination: "Where are you dreaming of going?",
  cities: "Which cities do you want to visit?",
  dates: "When would you like to travel?",
  travelers: "Who is coming along on this trip?",
  budget: "What budget feels right for you?",
  vibe: "What should this trip feel like?",
  summary: "Your trip is starting to take shape",
};

/** How the photo is framed on each step, so the card feels alive as you advance. */
const FRAMES = [
  { scale: 1.05, x: "0%", y: "0%" },
  { scale: 1.18, x: "-4%", y: "3%" },
  { scale: 1.12, x: "5%", y: "-2%" },
  { scale: 1.25, x: "0%", y: "4%" },
  { scale: 1.1, x: "-5%", y: "-3%" },
  { scale: 1.2, x: "4%", y: "2%" },
  { scale: 1.05, x: "0%", y: "0%" },
];

const EASE = [0.32, 0.72, 0, 1] as const;

export function TripPlanner() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [plan, setPlan] = useState<Plan>({ cities: [], nights: 7, adults: 2, children: 0, vibes: [] });
  const step = STEPS[stepIndex];
  const country = PLANNER_COUNTRIES.find((c) => c.id === plan.country) ?? PLANNER_COUNTRIES[0];
  const months = upcomingMonths();

  const canNext: Record<Step, boolean> = {
    destination: Boolean(plan.country),
    cities: plan.cities.length > 0,
    dates: Boolean(plan.month),
    travelers: plan.adults > 0,
    budget: Boolean(plan.budget),
    vibe: true,
    summary: true,
  };

  const go = (delta: number) => {
    setDir(delta);
    setStepIndex((i) => Math.min(STEPS.length - 1, Math.max(0, i + delta)));
  };
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const departDate = () => {
    if (!plan.month) return defaultDepartDate();
    const d = new Date(`${plan.month}-10T00:00:00`);
    return d < new Date() ? defaultDepartDate() : toISODate(d);
  };

  const findFlights = () => {
    const city = country.cities.find((c) => c.name === plan.cities[0]) ?? country.cities[0];
    const cabin = plan.budget === "treat" || plan.budget === "nolimit" ? "Business" : "Economy";
    const q = new URLSearchParams({
      from: "DXB",
      to: city.airport,
      date: departDate(),
      pax: String(plan.adults + plan.children),
      cabin,
    });
    router.push(`/flights/results?${q}`);
  };

  const askAI = () => {
    const budget = BUDGETS.find((b) => b.id === plan.budget);
    const text = `Plan a ${plan.nights}-night trip to ${plan.cities.join(", ")} in ${country.name} for ${plan.adults} adult${plan.adults > 1 ? "s" : ""}${plan.children ? ` and ${plan.children} children` : ""}${budget ? `, budget ${budget.hint}` : ""}${plan.vibes.length ? `, into ${plan.vibes.join(", ").toLowerCase()}` : ""}.`;
    router.push(`/chat?q=${encodeURIComponent(text)}`);
  };

  let body: ReactNode = null;
  if (step === "destination") {
    body = (
      <ChipRow>
        {PLANNER_COUNTRIES.map((c) => (
          <Chip key={c.id} selected={plan.country === c.id} onClick={() => setPlan({ ...plan, country: c.id, cities: [] })}>
            {c.name}
          </Chip>
        ))}
      </ChipRow>
    );
  } else if (step === "cities") {
    body = (
      <ChipRow>
        {country.cities.map((c) => (
          <Chip key={c.name} selected={plan.cities.includes(c.name)} onClick={() => setPlan({ ...plan, cities: toggle(plan.cities, c.name) })}>
            {c.name}
          </Chip>
        ))}
      </ChipRow>
    );
  } else if (step === "dates") {
    body = (
      <div className="space-y-3">
        <ChipRow>
          {months.map((m) => (
            <Chip key={m.id} selected={plan.month === m.id} onClick={() => setPlan({ ...plan, month: m.id })}>
              {m.label}
            </Chip>
          ))}
        </ChipRow>
        <Panel label="Nights">
          <Stepper label="nights" value={plan.nights} min={2} max={30} onChange={(nights) => setPlan({ ...plan, nights })} />
        </Panel>
      </div>
    );
  } else if (step === "travelers") {
    body = (
      <div className="space-y-2">
        <Panel label="Adults" hint="12 and over">
          <Stepper label="adults" value={plan.adults} min={1} max={9} onChange={(adults) => setPlan({ ...plan, adults })} />
        </Panel>
        <Panel label="Children" hint="2 – 11">
          <Stepper label="children" value={plan.children} min={0} max={6} onChange={(children) => setPlan({ ...plan, children })} />
        </Panel>
      </div>
    );
  } else if (step === "budget") {
    body = (
      <div className="grid grid-cols-2 gap-2">
        {BUDGETS.map((b) => {
          const on = plan.budget === b.id;
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={on}
              onClick={() => setPlan({ ...plan, budget: b.id })}
              className={cn(
                "rounded-[18px] px-3.5 py-3 text-left transition-[background,transform] active:scale-[0.97]",
                on ? "bg-white text-black" : "glass-thin text-white",
              )}
            >
              <span className="block text-[14px] font-medium leading-tight">{b.label}</span>
              <span className={cn("mt-1 block text-[12px]", on ? "text-black/60" : "text-white/60")}>{b.hint} per person</span>
            </button>
          );
        })}
      </div>
    );
  } else if (step === "vibe") {
    body = (
      <ChipRow>
        {VIBES.map((v) => (
          <Chip key={v} selected={plan.vibes.includes(v)} onClick={() => setPlan({ ...plan, vibes: toggle(plan.vibes, v) })}>
            {v}
          </Chip>
        ))}
      </ChipRow>
    );
  } else {
    const budget = BUDGETS.find((b) => b.id === plan.budget);
    const month = months.find((m) => m.id === plan.month);
    body = (
      <dl className="glass-thin divide-y divide-white/10 rounded-[20px] px-4 text-[14px]">
        <Row k="Where" v={`${plan.cities.join(", ")}`} />
        <Row k="When" v={`${month?.label ?? "Flexible"} · ${plan.nights} nights`} />
        <Row k="Who" v={`${plan.adults} adult${plan.adults > 1 ? "s" : ""}${plan.children ? `, ${plan.children} child${plan.children > 1 ? "ren" : ""}` : ""}`} />
        <Row k="Budget" v={budget?.hint ?? "Open"} />
        {plan.vibes.length > 0 && <Row k="Vibe" v={plan.vibes.join(", ")} />}
      </dl>
    );
  }

  const last = step === "summary";

  return (
    <div className="relative flex h-full flex-col pt-[max(env(safe-area-inset-top),12px)] md:pt-[54px]">
      <header className="flex items-center justify-between px-4 pb-3">
        <button
          type="button"
          onClick={() => (stepIndex === 0 ? router.back() : go(-1))}
          aria-label={stepIndex === 0 ? "Close planner" : "Previous question"}
          className="glass-thin flex size-11 items-center justify-center rounded-full text-white/85 active:scale-[0.96]"
        >
          {stepIndex === 0 ? <X className="size-5" /> : <ChevronLeft className="size-5" />}
        </button>
        <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={stepIndex + 1} aria-label="Planner progress">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-[width,background-color] duration-200",
                i === stepIndex ? "w-5 bg-white" : i < stepIndex ? "w-1.5 bg-white/70" : "w-1.5 bg-white/20",
              )}
            />
          ))}
        </div>
        <Link href="/chat" className="glass-thin flex h-11 items-center rounded-full px-4 text-[13px] text-white/80">
          Ask AI
        </Link>
      </header>

      {/* Card stack */}
      <div className="relative mx-4 flex-1">
        {/* The next card, peeking behind */}
        {!last && (
          <div aria-hidden className="absolute inset-x-4 -bottom-2.5 top-3 rounded-[34px] bg-[#232325] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]" />
        )}
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.section
            key={step}
            custom={dir}
            aria-labelledby={`q-${step}`}
            variants={{
              enter: (d: number) => ({ x: `${d * 105}%`, rotate: d * 5, opacity: 0.6, scale: 0.96 }),
              center: { x: 0, rotate: 0, opacity: 1, scale: 1 },
              exit: (d: number) => ({ x: `${d * -105}%`, rotate: d * -5, opacity: 0.4, scale: 0.94 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0 overflow-clip rounded-[34px] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]"
          >
            <motion.img
              {...photo(country.image, 460, 640)}
              alt=""
              className="absolute inset-0 size-full object-cover"
              initial={false}
              animate={FRAMES[stepIndex]}
              transition={{ duration: 1.2, ease: EASE }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/5 to-black/80" />
            <div className="relative flex h-full flex-col justify-between p-5">
              <h2 id={`q-${step}`} className="max-w-[15ch] text-[31px] font-medium leading-[1.08] tracking-[-0.02em] text-white drop-shadow-[0_2px_12px_rgb(0_0_0/0.35)]">
                <FadedQuestion text={QUESTIONS[step]} split={0.55} />
              </h2>
              <div>{body}</div>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Previous / Next, as in the reference */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-5 md:pb-8">
        {last ? (
          <>
            <button type="button" onClick={askAI} className="glass h-[72px] rounded-[26px] text-[16px] text-white transition-transform active:scale-[0.97]">
              Plan with AI
            </button>
            <button type="button" onClick={findFlights} className="h-[72px] rounded-[26px] bg-white text-[16px] font-medium text-black transition-transform active:scale-[0.97]">
              Find flights
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={stepIndex === 0}
              className="glass h-[72px] rounded-[26px] text-[16px] text-white transition-[transform,opacity] active:scale-[0.97] disabled:opacity-35"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext[step]}
              className="h-[72px] rounded-[26px] bg-white text-[16px] font-medium text-black transition-[transform,opacity] active:scale-[0.97] disabled:opacity-40"
            >
              {step === "vibe" && plan.vibes.length === 0 ? "Skip" : "Next"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Panel({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="glass-thin flex items-center justify-between rounded-[20px] py-2 pl-4 pr-2">
      <span>
        <span className="block text-[15px] text-white">{label}</span>
        {hint && <span className="block text-[12px] text-white/55">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-white/55">{k}</dt>
      <dd className="text-right text-white">{v}</dd>
    </div>
  );
}
