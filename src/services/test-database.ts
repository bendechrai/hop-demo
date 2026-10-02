import type { DatabaseSync } from "node:sqlite";
import { MIGRATIONS_DIR } from "../config.ts";
import { openDatabase } from "./database.ts";
import { applyMigrations } from "./migrations.ts";

// A throwaway in-memory database with the current schema, for tests.
export function openTestDatabase(): DatabaseSync {
  const db = openDatabase(":memory:");
  applyMigrations(db, MIGRATIONS_DIR);
  return db;
}
