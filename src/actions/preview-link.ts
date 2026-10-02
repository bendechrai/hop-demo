import { getLink } from "./get-link.ts";
import type { LinkStatus } from "./link-status.ts";
import type { ActionResult } from "./result.ts";
import type { LinksService } from "../services/links.ts";

// Unlike followLink, an expired link is still returned (flagged) and no click
// is counted, so a preview can be opened any number of times.
export function previewLink(
  code: string,
  links: LinksService,
  now: Date = new Date(),
): ActionResult<LinkStatus> {
  return getLink(code, links, now);
}
