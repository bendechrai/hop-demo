import type { DatabaseSync } from "node:sqlite";
import { LINK_COLUMNS, toLink, type Link } from "./link-row.ts";

export interface Totals {
  links: number;
  clicks: number;
}

export interface StatsService {
  totals(): Totals;
  topLinks(limit: number): Link[];
}

export function createStatsService(db: DatabaseSync): StatsService {
  // SUM is null on an empty table, so it is folded to 0 here rather than
  // in every caller.
  const totals = db.prepare("SELECT COUNT(*) AS links, COALESCE(SUM(clicks), 0) AS clicks FROM links");
  // Equal counts come back oldest first, so the order is the same on every
  // call and does not depend on how SQLite happens to scan the table.
  const top = db.prepare(
    `SELECT ${LINK_COLUMNS} FROM links ORDER BY clicks DESC, created_at ASC LIMIT ?`,
  );

  return {
    totals() {
      const row = totals.get();
      if (!row) throw new Error("COUNT(*) returned no row");
      return { links: Number(row.links), clicks: Number(row.clicks) };
    },
    topLinks(limit) {
      return top.all(limit).map(toLink);
    },
  };
}
