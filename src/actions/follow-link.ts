import { isExpired } from "./is-expired.ts";
import type { ActionResult } from "./result.ts";
import { isValidCode } from "./validate-code.ts";
import type { LinksService } from "../services/links.ts";

// Resolves a short code to its destination and counts the visit. An expired
// link is refused before the click is counted.
export function followLink(
  code: string,
  links: LinksService,
  now: Date = new Date(),
): ActionResult<string> {
  if (!isValidCode(code)) {
    return { ok: false, reason: "not-found", error: "Not found." };
  }
  const link = links.get(code);
  if (!link) return { ok: false, reason: "not-found", error: "Not found." };
  if (isExpired(link, now)) {
    return { ok: false, reason: "expired", error: "This link has expired." };
  }
  const url = links.recordClick(code);
  if (!url) return { ok: false, reason: "not-found", error: "Not found." };
  return { ok: true, value: url };
}
