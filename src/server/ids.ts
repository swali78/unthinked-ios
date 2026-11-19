import { randomBytes } from "node:crypto";

/** Short random ids with a readable prefix, e.g. `usr_3f9a…`. */
export const newId = (prefix: string) => `${prefix}_${randomBytes(10).toString("hex")}`;

/** Booking-style reference, e.g. `UT7K2QX`. */
export function bookingRef() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  return `UT${[...bytes].map((b) => abc[b % abc.length]).join("")}`;
}
