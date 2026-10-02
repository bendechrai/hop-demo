import { defineConfig, devices } from "@playwright/test";
import { E2E_DB_PATH } from "./e2e/database.ts";

// The port is fixed so Playwright knows which URL to wait for. Set E2E_PORT
// if 4390 is busy on your machine.
const port = Number(process.env.E2E_PORT ?? 4390);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  // Every spec file shares one web server and one throwaway SQLite file, so
  // workers stay at 1 to keep files from racing each other.
  workers: 1,
  retries: 0,
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // The database is a throwaway file rather than :memory: so a test can reach
  // the same rows the server sees, for example to plant an expired link.
  webServer: {
    command: `rm -f ${E2E_DB_PATH} && node src/server.ts`,
    url: baseURL,
    reuseExistingServer: false,
    env: { HOP_DB: E2E_DB_PATH, PORT: String(port) },
    timeout: 30_000,
  },
});
