import { Router } from "express";
import { createLink } from "../actions/create-link.ts";
import { getLink } from "../actions/get-link.ts";
import { listLinks } from "../actions/list-links.ts";
import type { LinksService } from "../services/links.ts";
import { presentLink } from "./present-link.ts";

export function linksRouter(links: LinksService): Router {
  const router = Router();

  router.get("/", (req, res) => {
    res.json(listLinks(links).map((link) => presentLink(link, req)));
  });

  router.post("/", (req, res) => {
    const body: unknown = req.body;
    const url = typeof body === "object" && body !== null ? Reflect.get(body, "url") : undefined;
    const result = createLink({ url }, links);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json(presentLink(result.value, req));
  });

  router.get("/:code", (req, res) => {
    const result = getLink(req.params.code, links);
    if (!result.ok) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json(presentLink(result.value, req));
  });

  return router;
}
