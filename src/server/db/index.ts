import path from "node:path";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { seedDemoTravelers } from "../demo";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * One database for the whole app.
 *
 * - DATABASE_URL set (production, Neon/Supabase/RDS): plain Postgres. Run
 *   `npm run db:migrate` when deploying.
 * - Not set (local dev, tests): embedded Postgres (PGlite) stored in
 *   PGLITE_DIR, default `.data/pglite`, or in memory with `memory://`.
 *   Migrations run automatically.
 */
const g = globalThis as unknown as { __unthinkedDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  g.__unthinkedDb ??= open().catch((err) => {
    g.__unthinkedDb = undefined;
    throw err;
  });
  return g.__unthinkedDb;
}

async function open(): Promise<Db> {
  let db: Db;
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const client = postgres(process.env.DATABASE_URL, { max: Number(process.env.DATABASE_POOL_MAX ?? 5), prepare: false });
    db = drizzle(client, { schema }) as unknown as Db;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
    const client = new PGlite(dir);
    const local = drizzle(client, { schema });
    await migrate(local, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    db = local as unknown as Db;
  }
  if (process.env.UNTHINKED_DEMO !== "0") await seedDemoTravelers(db);
  return db;
}

/** Forget the open database. Tests use it to start from a clean one. */
export function resetDbForTests() {
  g.__unthinkedDb = undefined;
}

export { schema };
