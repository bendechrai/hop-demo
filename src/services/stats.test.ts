import { test } from "node:test";
import assert from "node:assert/strict";
import type { DatabaseSync } from "node:sqlite";
import { createLinksService } from "./links.ts";
import { createStatsService } from "./stats.ts";
import { openTestDatabase } from "./test-database.ts";

// The clicks and the creation time are set straight on the row so the test,
// not the clock, decides the order the service has to produce.
function plant(
  db: DatabaseSync,
  code: string,
  clicks: number,
  createdAt: string,
  expiresAt: string | null = null,
): void {
  createLinksService(db).insert(code, `https://example.com/${code}`, expiresAt);
  db.prepare("UPDATE links SET clicks = ?, created_at = ? WHERE code = ?").run(clicks, createdAt, code);
}

test("totals are 0 links and 0 clicks on an empty table", () => {
  const db = openTestDatabase();
  assert.deepEqual(createStatsService(db).totals(), { links: 0, clicks: 0 });
  db.close();
});

test("totals count every link and sum every click, expired links included", () => {
  const db = openTestDatabase();
  plant(db, "four", 4, "2026-01-01T00:00:00.000Z");
  plant(db, "two-old", 2, "2026-01-02T00:00:00.000Z", "2020-01-01T00:00:00.000Z");
  plant(db, "none", 0, "2026-01-03T00:00:00.000Z");

  assert.deepEqual(createStatsService(db).totals(), { links: 3, clicks: 6 });
  db.close();
});

test("topLinks orders by clicks from most to least and stops at the limit", () => {
  const db = openTestDatabase();
  const counts = [3, 9, 1, 7, 5, 0, 8];
  counts.forEach((clicks, i) => {
    plant(db, `c${clicks}`, clicks, `2026-01-0${i + 1}T00:00:00.000Z`);
  });

  const top = createStatsService(db).topLinks(5);
  assert.deepEqual(
    top.map((link) => link.code),
    ["c9", "c8", "c7", "c5", "c3"],
  );
  assert.equal(top[0]?.url, "https://example.com/c9");
  assert.equal(top[0]?.clicks, 9);
  db.close();
});

test("topLinks returns fewer than the limit when fewer links exist", () => {
  const db = openTestDatabase();
  plant(db, "one", 1, "2026-01-01T00:00:00.000Z");
  plant(db, "two", 2, "2026-01-02T00:00:00.000Z");

  assert.deepEqual(
    createStatsService(db).topLinks(5).map((link) => link.code),
    ["two", "one"],
  );
  db.close();
});

test("topLinks keeps equal counts in the same order on every call, oldest first", () => {
  const db = openTestDatabase();
  plant(db, "newer", 2, "2026-03-01T00:00:00.000Z");
  plant(db, "oldest", 2, "2026-01-01T00:00:00.000Z");
  plant(db, "middle", 2, "2026-02-01T00:00:00.000Z");
  const stats = createStatsService(db);

  const first = stats.topLinks(5).map((link) => link.code);
  assert.deepEqual(first, ["oldest", "middle", "newer"]);
  assert.deepEqual(stats.topLinks(5).map((link) => link.code), first);
  db.close();
});
