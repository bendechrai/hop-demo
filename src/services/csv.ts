import type { Link } from "./links.ts";

const HEADER = "code,url,clicks,created_at,expires_at";

// RFC 4180: quote only when the value would otherwise break the row.
function field(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function linksToCsv(links: Link[]): string {
  const rows = links.map((link) =>
    [link.code, link.url, String(link.clicks), link.createdAt, link.expiresAt ?? ""].map(field).join(","),
  );
  return [HEADER, ...rows].map((line) => `${line}\r\n`).join("");
}
