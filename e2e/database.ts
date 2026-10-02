import { openDatabase } from "../src/services/database.ts";
import { createLinksService } from "../src/services/links.ts";

// The server started by Playwright and the tests share this file. It is
// removed before the server starts, so every run begins empty.
export const E2E_DB_PATH = "data/e2e.sqlite";

// Time cannot be moved in a browser test, so an already-expired link is
// written straight through the links service with an expiry in the past.
export function plantExpiredLink(code: string, url: string): void {
  const db = openDatabase(E2E_DB_PATH);
  try {
    createLinksService(db).insert(code, url, "2020-01-01T00:00:00.000Z");
  } finally {
    db.close();
  }
}
