import { Router } from "express";
import { followLink } from "../actions/follow-link.ts";
import type { LinksService } from "../services/links.ts";

export function redirectRouter(links: LinksService): Router {
  const router = Router();

  router.get("/:code", (req, res, next) => {
    const result = followLink(req.params.code, links);
    if (!result.ok) {
      next();
      return;
    }
    res.redirect(302, result.value);
  });

  return router;
}
