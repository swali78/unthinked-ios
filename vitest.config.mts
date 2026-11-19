import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

// Date handling is easy to get wrong by a day, so unit tests run in two time zones:
// one east of UTC (where the app's users are) and one west of it.
export default defineConfig({
  resolve: { alias },
  test: {
    projects: ["Asia/Kolkata", "America/New_York"].map((tz) => ({
      resolve: { alias },
      test: { name: tz, include: ["tests/unit/**/*.test.ts"], environment: "node", env: { TZ: tz } },
    })),
  },
});
