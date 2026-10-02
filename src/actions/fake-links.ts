import type { Link, LinksService } from "../services/links.ts";

// An in-memory stand-in for the links service so action tests need no database.
export function fakeLinks(seed: Link[] = []): LinksService & { rows: Link[] } {
  const rows = [...seed];
  return {
    rows,
    insert(code, url) {
      const link: Link = { code, url, clicks: 0, createdAt: "2026-01-01T00:00:00.000Z" };
      rows.push(link);
      return link;
    },
    get(code) {
      return rows.find((row) => row.code === code) ?? null;
    },
    list() {
      return [...rows];
    },
    recordClick(code) {
      const row = rows.find((link) => link.code === code);
      if (!row) return null;
      row.clicks += 1;
      return row.url;
    },
  };
}
