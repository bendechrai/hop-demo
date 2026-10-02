import type { ActionResult } from "./result.ts";
import type { LinksService } from "../services/links.ts";
import { CODE_LENGTH } from "../services/short-code.ts";

const CODE_PATTERN = new RegExp(`^[a-zA-Z0-9]{${CODE_LENGTH}}$`);

// Resolves a short code to its destination and counts the visit.
export function followLink(code: string, links: LinksService): ActionResult<string> {
  if (!CODE_PATTERN.test(code)) {
    return { ok: false, reason: "not-found", error: "Not found." };
  }
  const url = links.recordClick(code);
  if (!url) return { ok: false, reason: "not-found", error: "Not found." };
  return { ok: true, value: url };
}
