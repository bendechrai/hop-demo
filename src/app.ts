import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { exportRouter } from "./routes/export.ts";
import { healthRouter } from "./routes/health.ts";
import { linksRouter } from "./routes/links.ts";
import { previewRouter } from "./routes/preview.ts";
import { redirectRouter } from "./routes/redirect.ts";
import { statsPageRouter } from "./routes/stats-page.ts";
import { statsRouter } from "./routes/stats.ts";
import type { LinksService } from "./services/links.ts";
import type { StatsService } from "./services/stats.ts";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// Keep top-level route prefixes here so every mount is reserved as a code.
// Add any new top-level mount here, or a custom code could shadow it.
export const ROUTE_PREFIXES = {
  health: "/health",
  linksApi: "/api/links",
  statsApi: "/api/stats",
  statsPage: "/stats",
} as const;

export function createApp(links: LinksService, stats: StatsService): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(express.static(publicDir));

  // Mounted before the redirect so "health" is never read as a short code.
  app.use(ROUTE_PREFIXES.health, healthRouter(stats));
  app.use(exportRouter(links));
  app.use(ROUTE_PREFIXES.linksApi, linksRouter(links));
  app.use(ROUTE_PREFIXES.statsApi, statsRouter(stats));
  // The stats page is mounted before the redirect so "stats" is never read
  // as a short code.
  app.use(ROUTE_PREFIXES.statsPage, statsPageRouter(publicDir));
  // The preview is mounted before the redirect so "abc+" is never read as a
  // short code.
  app.use("/", previewRouter(links));
  app.use("/", redirectRouter(links));

  app.use((_req, res) => {
    res.status(404).type("text").send("Not found");
  });

  return app;
}
