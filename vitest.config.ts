import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Each test file gets its own in-memory Postgres.
    env: { PGLITE_DIR: "memory://" },
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
