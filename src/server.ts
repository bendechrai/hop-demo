import { createApp } from "./app.ts";
import { DB_PATH, MIGRATIONS_DIR, PORT } from "./config.ts";
import { openDatabase } from "./services/database.ts";
import { createLinksService } from "./services/links.ts";
import { applyMigrations } from "./services/migrations.ts";

const db = openDatabase(DB_PATH);
// Pending migrations run at startup so an in-memory database has its schema.
applyMigrations(db, MIGRATIONS_DIR);

const server = createApp(createLinksService(db)).listen(PORT, () => {
  console.log(`hop listening on http://localhost:${PORT} (db: ${DB_PATH})`);
});

function shutdown(): void {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
