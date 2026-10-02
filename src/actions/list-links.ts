import type { Link, LinksService } from "../services/links.ts";

export function listLinks(links: LinksService): Link[] {
  return links.list();
}
