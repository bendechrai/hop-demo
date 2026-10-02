import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const PORT = Number(process.env.PORT ?? 4310);
export const DB_PATH = process.env.HOP_DB ?? "./data/hop.sqlite";
export const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
