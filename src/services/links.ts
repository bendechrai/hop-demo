import type { DatabaseSync } from "node:sqlite";
import { LINK_COLUMNS, toLink, type Link } from "./link-row.ts";

export type { Link } from "./link-row.ts";

export interface LinksService {
  insert(code: string, url: string, expiresAt: string | null, label?: string | null): Link;
  get(code: string): Link | null;
  list(): Link[];
  recordClick(code: string): string | null;
  remove(code: string): boolean;
}

export function createLinksService(db: DatabaseSync): LinksService {
  const insert = db.prepare("INSERT INTO links (code, url, expires_at, label) VALUES (?, ?, ?, ?)");
  const selectOne = db.prepare(`SELECT ${LINK_COLUMNS} FROM links WHERE code = ?`);
  const selectAll = db.prepare(`SELECT ${LINK_COLUMNS} FROM links ORDER BY created_at DESC`);
  const bump = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ? RETURNING url");
  const del = db.prepare("DELETE FROM links WHERE code = ?");

  return {
    insert(code, url, expiresAt, label = null) {
      insert.run(code, url, expiresAt, label);
      const row = selectOne.get(code);
      if (!row) throw new Error(`Link ${code} vanished after insert`);
      return toLink(row);
    },
    get(code) {
      const row = selectOne.get(code);
      return row ? toLink(row) : null;
    },
    list() {
      return selectAll.all().map(toLink);
    },
    recordClick(code) {
      const row = bump.get(code);
      return row ? String(row.url) : null;
    },
    remove(code) {
      return del.run(code).changes > 0;
    },
  };
}
