import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The embedded Postgres used in local dev loads its own WASM files.
  serverExternalPackages: ["@electric-sql/pglite"],
  // Ship the SQL migrations with the API so local databases can migrate themselves.
  outputFileTracingIncludes: { "/api/v1/**": ["./drizzle/**/*"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
