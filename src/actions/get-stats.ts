import { withStatus, type LinkStatus } from "./link-status.ts";
import type { StatsService } from "../services/stats.ts";

export interface Stats {
  links: number;
  clicks: number;
  top: LinkStatus[];
}

// The page shows the five most clicked links. How many to show is a rule
// of the page, so it is decided here and the service only takes a limit.
const TOP_LIMIT = 5;

export function getStats(stats: StatsService, now: Date = new Date()): Stats {
  const { links, clicks } = stats.totals();
  const top = stats.topLinks(TOP_LIMIT).map((link) => withStatus(link, now));
  return { links, clicks, top };
}
