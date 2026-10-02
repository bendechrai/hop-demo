import type { Link } from "../services/links.ts";
import type { StatsService, Totals } from "../services/stats.ts";

// An in-memory stand-in for the stats service so action tests need no
// database. It records every limit it was asked for, so a test can check
// that the action, not the service, decided how many links to show.
export function fakeStats(totals: Totals, top: Link[]): StatsService & { askedFor: number[] } {
  const askedFor: number[] = [];
  return {
    askedFor,
    totals() {
      return { ...totals };
    },
    topLinks(limit) {
      askedFor.push(limit);
      return top.slice(0, limit);
    },
  };
}
