import { sql } from "drizzle-orm";
import { createRouter, json, route } from "../http";
import { accountRoutes } from "./accounts";
import { bookingRoutes } from "./bookings";
import { reportRoutes } from "./reports";
import { togetherRoutes } from "./together";

/** Every `/api/v1` endpoint. The full list is in docs/backend.md. */
export const handleApi = createRouter([
  route.public("GET", "/health", async ({ db }) => {
    await db.execute(sql`select 1`);
    return json({ ok: true, database: process.env.DATABASE_URL ? "postgres" : "pglite" });
  }),
  ...accountRoutes,
  ...togetherRoutes,
  ...bookingRoutes,
  ...reportRoutes,
]);
