import type { DatabaseSync, SQLOutputValue } from "node:sqlite";

export interface Link {
  code: string;
  url: string;
  clicks: number;
  createdAt: string;
  expiresAt: string | null;
}

export interface LinksService {
  insert(code: string, url: string, expiresAt: string | null): Link;
  get(code: string): Link | null;
  list(): Link[];
  recordClick(code: string): string | null;
  remove(code: string): boolean;
}

const COLUMNS = "code, url, clicks, created_at, expires_at";

function toLink(row: Record<string, SQLOutputValue>): Link {
  return {
    code: String(row.code),
    url: String(row.url),
    clicks: Number(row.clicks),
    createdAt: String(row.created_at),
    expiresAt: row.expires_at === null ? null : String(row.expires_at),
  };
}

export function createLinksService(db: DatabaseSync): LinksService {
  const insert = db.prepare("INSERT INTO links (code, url, expires_at) VALUES (?, ?, ?)");
  const selectOne = db.prepare(`SELECT ${COLUMNS} FROM links WHERE code = ?`);
  const selectAll = db.prepare(`SELECT ${COLUMNS} FROM links ORDER BY created_at DESC`);
  const bump = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ? RETURNING url");
  const del = db.prepare("DELETE FROM links WHERE code = ?");

  return {
    insert(code, url, expiresAt) {
      insert.run(code, url, expiresAt);
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
