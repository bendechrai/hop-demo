import { Router } from "express";
import { listLinks } from "../actions/list-links.ts";
import { linksToCsv } from "../services/csv.ts";
import type { LinksService } from "../services/links.ts";

export function exportRouter(links: LinksService): Router {
  const router = Router();

  router.get("/api/links.csv", (_req, res) => {
    res.type("text/csv").send(linksToCsv(listLinks(links)));
  });

  return router;
}
