import type { StatsService } from "../services/stats.ts";

export interface Health {
  status: "ok";
  links: number;
}

// The count includes expired links: the check says the database answers,
// not how many links are live.
export function getHealth(stats: StatsService): Health {
  return { status: "ok", links: stats.totals().links };
}
