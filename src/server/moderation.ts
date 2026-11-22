import { findOffensive, OFFENSIVE_MESSAGE } from "@/lib/moderation";
import { HttpError } from "./http";

/**
 * Rejects the request with 422 if any field contains offensive language.
 * The error lists which fields, in the same shape as validation errors, so
 * forms can show it next to the right input.
 */
export function assertClean(fields: Record<string, string | null | undefined>) {
  const bad = Object.entries(fields).filter(([, v]) => v && findOffensive(v));
  if (!bad.length) return;
  throw new HttpError(422, "offensive_content", OFFENSIVE_MESSAGE, {
    fieldErrors: Object.fromEntries(bad.map(([k]) => [k, [OFFENSIVE_MESSAGE]])),
  });
}

/** Emails allowed to review reports, from UNTHINKED_ADMIN_EMAILS (comma-separated). */
export function isModerator(email: string | null) {
  if (!email) return false;
  const list = (process.env.UNTHINKED_ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Tells the team about a new report, so it can be handled within 24 hours as
 * the App Store requires. Posts `{ text }` to MODERATION_WEBHOOK_URL, which
 * works with Slack and Discord incoming webhooks (Discord: append /slack).
 */
export async function notifyModerators(text: string) {
  const url = process.env.MODERATION_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal: AbortSignal.timeout(5000) });
  } catch (err) {
    console.warn("[moderation] webhook failed", err);
  }
}
