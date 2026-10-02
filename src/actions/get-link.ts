import { withStatus, type LinkStatus } from "./link-status.ts";
import type { ActionResult } from "./result.ts";
import type { LinksService } from "../services/links.ts";

export function getLink(
  code: string,
  links: LinksService,
  now: Date = new Date(),
): ActionResult<LinkStatus> {
  const link = links.get(code);
  if (!link) return { ok: false, reason: "not-found", error: "Not found." };
  return { ok: true, value: withStatus(link, now) };
}
