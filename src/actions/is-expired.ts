import type { Link } from "../services/links.ts";

// A link with no expiry never expires. One with an expiry is expired from
// that moment on, so a visit exactly at the expiry is already too late.
export function isExpired(link: Pick<Link, "expiresAt">, now: Date): boolean {
  if (link.expiresAt === null) return false;
  return Date.parse(link.expiresAt) <= now.getTime();
}
