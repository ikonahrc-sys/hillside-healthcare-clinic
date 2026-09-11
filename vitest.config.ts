import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Loads .env.test (a dedicated hillside_hms_test database, not the dev
    // DB) before any test file runs - lib/db.ts constructs the Postgres
    // adapter at import time by reading process.env.DATABASE_URL, so this
    // has to happen even for tests that never run a query.
    setupFiles: ["./vitest.setup.env.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // server-only throws by design outside Next.js's own RSC build -
      // stand in with a no-op so files that import it are still
      // testable under plain Vitest/Node.
      "server-only": path.resolve(__dirname, "./vitest.setup.server-only.ts"),
    },
  },
});
