import { Router } from "express";
import { createLink } from "../actions/create-link.ts";
import { deleteLink } from "../actions/delete-link.ts";
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
    const field = (name: string): unknown =>
      typeof body === "object" && body !== null ? Reflect.get(body, name) : undefined;
    const result = createLink({ url: field("url"), code: field("code") }, links);
    if (!result.ok) {
      res.status(result.reason === "conflict" ? 409 : 400).json({ error: result.error });
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

  router.delete("/:code", (req, res) => {
    const result = deleteLink(req.params.code, links);
    if (!result.ok) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.status(204).end();
  });

  return router;
}
