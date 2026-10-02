import type { ActionResult } from "./result.ts";
import type { LinksService } from "../services/links.ts";

export function deleteLink(code: string, links: LinksService): ActionResult<void> {
  if (!links.remove(code)) return { ok: false, reason: "not-found", error: "Not found." };
  return { ok: true, value: undefined };
}
