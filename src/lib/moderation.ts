/**
 * Offensive-content filter for anything one traveler shows another: chat
 * messages, names, bios, interests, group trip titles, plans and expenses.
 * Shared by the app (to warn before sending) and the server (to enforce).
 *
 * It matches whole words after undoing common disguises (leetspeak like
 * sh1t, stretched letters like fuuuck), so place names like Scunthorpe or
 * Essex pass. Words that are also innocent (Dick, cock, MC, porn as in
 * "food porn") are left out.
 * A word list is a first line of defence; reports catch the rest.
 */

/** Matched as a whole word, or with a plural "s". */
const WORDS = [
  // English profanity and sexual terms
  "fuck", "fuk", "fck", "fcuk", "motherfuck", "shit", "bullshit", "bitch", "bastard", "cunt", "dickhead", "cocksucker",
  "pussy", "asshole", "arsehole", "twat", "wanker", "prick", "slut", "whore", "skank", "dildo", "blowjob", "handjob",
  "jizz", "nudes", "boobs", "tits", "sexting", "rape", "rapist", "molest", "pedo", "pedophile", "paedophile",
  // Slurs
  "nigger", "nigga", "faggot", "fag", "dyke", "tranny", "retard", "spastic", "chink", "gook", "kike", "spic", "wetback",
  "paki", "raghead", "towelhead", "coon", "darkie",
  // Threats
  "kys", "killyourself",
  // Hindi and Urdu abuse, as commonly typed in Latin script
  "madarchod", "maderchod", "behenchod", "bhenchod", "benchod", "chutiya", "chutia", "chootiya", "bhosdike",
  "bhosdiwale", "bhosda", "gandu", "gaandu", "loda", "lavda", "chodu", "kamina", "kamine", "jhaat",
  // Left out on purpose: "chod" (as in "chod do", leave it), "lund" (Lund, Sweden), "kutta" (dog).
];

/** Matched anywhere inside a word: too distinctive to hide in an innocent one. */
const ANYWHERE = ["fuck", "motherf", "nigger", "faggot", "madarchod", "behenchod", "bhenchod", "chutiya", "bhosd"];

/** Phrases checked across word gaps. */
const PHRASES = ["kill yourself", "go die", "send nudes", "suck my", "son of a bitch"];

/** Stems that also match with common endings: fucking, shitty, bitches, raped. */
const STEMS = ["fuck", "fuk", "fck", "shit", "bitch", "rape", "molest", "wank", "slut", "whore", "retard"];
const ENDINGS = ["ed", "er", "ers", "ing", "in", "y", "ies", "es", "head", "heads", "face", "hole"];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "!": "i", "|": "i", "+": "t" };

/** Collapse runs of a repeated letter, so "fuuuck" and "fuck" compare equal. */
const squeeze = (s: string) => s.replace(/(.)\1+/g, "$1");
/**
 * Terms with a double letter (nigger, faggot) are only matched as spelled:
 * squeezed, they'd hit innocent words like Niger and Nigeria.
 */
const squeezable = (t: string) => squeeze(t) === t;

const EXACT = new Set([...WORDS.flatMap((w) => [w, w + "s"]), ...STEMS.flatMap((w) => ENDINGS.map((e) => w + e))]);
const SQUEEZED = new Set([...EXACT].filter(squeezable));
const ANYWHERE_SQ = ANYWHERE.filter(squeezable);

function normalise(text: string) {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[0-9@$!|+]/g, (c) => LEET[c] ?? c);
}

/** The first offensive term in `text`, or null if it's clean. */
export function findOffensive(text: string): string | null {
  const words = normalise(text).split(/[^a-z]+/).filter(Boolean);
  for (const w of words) {
    const sq = squeeze(w);
    if (EXACT.has(w) || SQUEEZED.has(sq)) return w;
    const hit = ANYWHERE.find((a) => w.includes(a)) ?? ANYWHERE_SQ.find((a) => sq.includes(a));
    if (hit) return hit;
  }
  const joined = ` ${words.join(" ")} `;
  return PHRASES.find((p) => joined.includes(` ${p} `)) ?? null;
}

export const OFFENSIVE_MESSAGE = "That includes language we don't allow in Unthinked. Please rephrase it.";

/** Why someone is reported. Keep in sync with `ReportReason` in src/server/db/schema.ts. */
export const REPORT_REASONS = [
  { id: "harassment", label: "Harassment or bullying" },
  { id: "hate", label: "Hate speech or discrimination" },
  { id: "sexual", label: "Sexual or explicit content" },
  { id: "safety", label: "Threats, scams or asking for money" },
  { id: "fake", label: "Fake profile or pretending to be someone" },
  { id: "underage", label: "Under 18" },
  { id: "spam", label: "Spam or advertising" },
  { id: "other", label: "Something else" },
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number]["id"];
