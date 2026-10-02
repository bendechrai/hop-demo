import { Router } from "express";
import { getHealth } from "../actions/get-health.ts";
import type { StatsService } from "../services/stats.ts";

export function healthRouter(stats: StatsService): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(getHealth(stats));
  });

  return router;
}
