import type { ActionResult } from "./result.ts";
import { isValidCode } from "./validate-code.ts";
import type { LinksService } from "../services/links.ts";

// Resolves a short code to its destination and counts the visit.
export function followLink(code: string, links: LinksService): ActionResult<string> {
  if (!isValidCode(code)) {
    return { ok: false, reason: "not-found", error: "Not found." };
  }
  const url = links.recordClick(code);
  if (!url) return { ok: false, reason: "not-found", error: "Not found." };
  return { ok: true, value: url };
}
