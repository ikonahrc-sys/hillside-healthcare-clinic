// Test-only database, not the dev DB used for manual/browser verification -
// see hillside_hms_test in the same hillside-postgres container. Keeps
// automated test runs from ever reading or writing demo/seed data, and vice
// versa (e.g. a test's fixture rows never show up while manually verifying
// a feature in the browser).
import { config } from "dotenv";

config({ path: ".env.test" });
