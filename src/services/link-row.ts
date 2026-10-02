import type { SQLOutputValue } from "node:sqlite";

export interface Link {
  code: string;
  url: string;
  clicks: number;
  createdAt: string;
  expiresAt: string | null;
  label: string | null;
}

// The columns every query selects, in the order toLink reads them. Both the
// links and the stats services read link rows, so the mapping lives here.
export const LINK_COLUMNS = "code, url, clicks, created_at, expires_at, label";

export function toLink(row: Record<string, SQLOutputValue>): Link {
  return {
    code: String(row.code),
    url: String(row.url),
    clicks: Number(row.clicks),
    createdAt: String(row.created_at),
    expiresAt: row.expires_at === null ? null : String(row.expires_at),
    label: row.label === null ? null : String(row.label),
  };
}
