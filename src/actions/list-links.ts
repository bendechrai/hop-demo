import { withStatus, type LinkStatus } from "./link-status.ts";
import type { LinksService } from "../services/links.ts";

export function listLinks(links: LinksService, now: Date = new Date()): LinkStatus[] {
  return links.list().map((link) => withStatus(link, now));
}
