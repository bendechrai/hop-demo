import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";

// Migrations are plain SQL files named NNN-description.sql, applied in name order.
// Applied names are recorded so each file runs exactly once per database.
export function applyMigrations(db: DatabaseSync, dir: string): number {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)");
  const done = new Set(
    db.prepare("SELECT name FROM schema_migrations").all().map((row) => String(row.name)),
  );
  const record = db.prepare("INSERT INTO schema_migrations (name) VALUES (?)");
  const pending = readdirSync(dir)
    .filter((name) => /^\d+-.*\.sql$/.test(name) && !done.has(name))
    .sort();

  for (const name of pending) {
    const sql = readFileSync(join(dir, name), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      record.run(name);
      db.exec("COMMIT");
    } catch (err) {
      db.exec("ROLLBACK");
      throw err;
    }
  }
  return pending.length;
}
