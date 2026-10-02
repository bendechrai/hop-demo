import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { linksRouter } from "./routes/links.ts";
import { redirectRouter } from "./routes/redirect.ts";
import type { LinksService } from "./services/links.ts";

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

export function createApp(links: LinksService): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(express.static(publicDir));

  app.use("/api/links", linksRouter(links));
  app.use("/", redirectRouter(links));

  app.use((_req, res) => {
    res.status(404).type("text").send("Not found");
  });

  return app;
}
