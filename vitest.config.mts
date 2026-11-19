import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      // Date handling is easy to get wrong by a day, so app logic tests run in two time zones:
      // one east of UTC (where the app's users are) and one west of it.
      ...["Asia/Kolkata", "America/New_York"].map((tz) => ({
        resolve: { alias },
        test: { name: tz, include: ["tests/unit/**/*.test.ts"], environment: "node" as const, env: { TZ: tz } },
      })),
      // API tests: each test file gets its own in-memory Postgres.
      {
        resolve: { alias },
        test: {
          name: "api",
          include: ["src/**/*.test.ts", "tests/api/**/*.test.ts"],
          environment: "node" as const,
          env: { PGLITE_DIR: "memory://" },
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
});
