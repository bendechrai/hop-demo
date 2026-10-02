import { DB_PATH, MIGRATIONS_DIR } from "./config.ts";
import { openDatabase } from "./services/database.ts";
import { applyMigrations } from "./services/migrations.ts";

const db = openDatabase(DB_PATH);
const count = applyMigrations(db, MIGRATIONS_DIR);
db.close();
console.log(`applied ${count} migration(s)`);
