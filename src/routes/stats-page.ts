import { Router } from "express";
import { join } from "node:path";

// The stats page is a static file, like the home page, but it lives at
// /stats rather than /stats.html so the path reads as a page and not a code.
export function statsPageRouter(publicDir: string): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.sendFile(join(publicDir, "stats.html"));
  });

  return router;
}
