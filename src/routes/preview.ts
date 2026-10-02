import { Router } from "express";
import { previewLink } from "../actions/preview-link.ts";
import type { LinksService } from "../services/links.ts";
import { previewPage } from "./preview-page.ts";

export function previewRouter(links: LinksService): Router {
  const router = Router();

  router.get("/:slug", (req, res, next) => {
    const slug = req.params.slug;
    if (!slug.endsWith("+")) {
      next();
      return;
    }
    const result = previewLink(slug.slice(0, -1), links);
    if (!result.ok) {
      next();
      return;
    }
    res.type("html").send(previewPage(result.value));
  });

  return router;
}
