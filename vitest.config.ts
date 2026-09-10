import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // lib/db.ts constructs the Postgres adapter at import time (reading
    // process.env.DATABASE_URL) even though the tests here never run a
    // query - without this, importing any module that transitively
    // imports lib/db.ts fails before a single test runs.
    setupFiles: ["dotenv/config"],
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
