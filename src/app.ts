import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { linksRouter } from "./routes/links.ts";
import { redirectRouter } from "./routes/redirect.ts";
import { statsPageRouter } from "./routes/stats-page.ts";
import { statsRouter } from "./routes/stats.ts";
import type { LinksService } from "./services/links.ts";
import type { StatsService } from "./services/stats.ts";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

export function createApp(links: LinksService, stats: StatsService): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(express.static(publicDir));

  app.use("/api/links", linksRouter(links));
  app.use("/api/stats", statsRouter(stats));
  // The stats page is mounted before the redirect so "stats" is never read
  // as a short code.
  app.use("/stats", statsPageRouter(publicDir));
  app.use("/", redirectRouter(links));

  app.use((_req, res) => {
    res.status(404).type("text").send("Not found");
  });

  return app;
}
