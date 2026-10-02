import type { ActionResult } from "./result.ts";
import type { Link, LinksService } from "../services/links.ts";

export function getLink(code: string, links: LinksService): ActionResult<Link> {
  const link = links.get(code);
  if (!link) return { ok: false, reason: "not-found", error: "Not found." };
  return { ok: true, value: link };
}
