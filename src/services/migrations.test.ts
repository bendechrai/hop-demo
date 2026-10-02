import { test } from "node:test";
import assert from "node:assert/strict";
import { MIGRATIONS_DIR } from "../config.ts";
import { openDatabase } from "./database.ts";
import { applyMigrations } from "./migrations.ts";

test("applyMigrations runs each file once", () => {
  const db = openDatabase(":memory:");
  const first = applyMigrations(db, MIGRATIONS_DIR);
  assert.ok(first >= 1);
  assert.equal(applyMigrations(db, MIGRATIONS_DIR), 0);
  assert.ok(db.prepare("SELECT 1 FROM links").all());
  db.close();
});
