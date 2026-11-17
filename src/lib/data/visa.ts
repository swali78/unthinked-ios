import { VISA_RULES } from "./seed";
import type { VisaRule } from "./types";

export const NATIONALITIES = ["India", "Pakistan", "Philippines", "Egypt", "United Kingdom", "United States"] as const;
export type Nationality = (typeof NATIONALITIES)[number];

export const VISA_DESTINATIONS = VISA_RULES.map((r) => r.destination).sort();

/** Destinations a UK or US passport can visit without applying (demo approximation). */
const STRONG_PASSPORT_FREE: Record<string, number> = {
  Maldives: 30, Thailand: 60, Indonesia: 30, Türkiye: 90, Greece: 90, France: 90, Italy: 90,
  Japan: 90, Singapore: 90, UAE: 90, Qatar: 90, "United Kingdom": 180, "United States": 90,
};

/**
 * Visa rule for a passport + destination. Seed rules are written for Indian
 * passports; UK/US get visa-free entry where it broadly applies. Everything
 * here is demo data, not legal advice.
 */
export function visaRuleFor(nationality: string, destination: string): VisaRule | undefined {
  const base = VISA_RULES.find((r) => r.destination === destination);
  if (!base) return undefined;
  if (nationality === destination) {
    return { destination, type: "Visa-free", maxStayDays: 0, fee: 0, processingDays: "None", documents: ["Your passport or national ID"], notes: "This is your own country." };
  }
  if ((nationality === "United Kingdom" || nationality === "United States") && STRONG_PASSPORT_FREE[destination]) {
    return {
      destination,
      type: "Visa-free",
      maxStayDays: STRONG_PASSPORT_FREE[destination],
      fee: 0,
      processingDays: "None",
      documents: ["Passport valid for the whole stay", "Return or onward ticket"],
      notes: ["Greece", "France", "Italy"].includes(destination) ? "ETIAS travel authorisation may be required once it launches." : undefined,
    };
  }
  return base;
}

/** Unthinked can file these online. Embassy visas need an appointment, so we only prepare the checklist. */
export const canApplyOnline = (rule: VisaRule) => rule.type === "eVisa";

export const SERVICE_FEE = 900; // cents

/* ---------------- Applications ---------------- */

export type VisaPurpose = "Tourism" | "Business" | "Visiting family";

export type VisaApplication = {
  id: string;
  destination: string;
  nationality: string;
  type: VisaRule["type"];
  fee: number;
  maxStayDays: number;
  submittedAt: number;
  applicant: {
    firstName: string;
    lastName: string;
    dob: string;
    passport: string;
    passportExpiry: string;
    email: string;
  };
  travel: { arrival: string; departure: string; purpose: VisaPurpose; address: string };
};

export const VISA_STAGES = ["Submitted", "In review", "Approved"] as const;
export type VisaStage = (typeof VISA_STAGES)[number];

/**
 * Demo timeline: review starts after 15 seconds and the visa is approved
 * after 45, so the whole journey can be seen in one sitting.
 */
export const STAGE_AT = { "In review": 15_000, Approved: 45_000 } as const;

export function stageOf(app: VisaApplication, now: number): VisaStage {
  const t = now - app.submittedAt;
  if (t >= STAGE_AT.Approved) return "Approved";
  if (t >= STAGE_AT["In review"]) return "In review";
  return "Submitted";
}

export function visaNumber(app: VisaApplication) {
  let h = 7;
  for (const c of app.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${app.destination.slice(0, 2).toUpperCase()}${String(h).slice(0, 8).padStart(8, "0")}`;
}

/** Valid from arrival for 90 days (single entry), as most eVisas in the seed. */
export function visaValidity(app: VisaApplication) {
  const from = new Date(`${app.travel.arrival}T00:00:00`);
  const until = new Date(from);
  until.setDate(until.getDate() + 90);
  return { from, until };
}
