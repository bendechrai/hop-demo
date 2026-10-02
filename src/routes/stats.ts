import { Router } from "express";
import { getStats } from "../actions/get-stats.ts";
import type { StatsService } from "../services/stats.ts";

export function statsRouter(stats: StatsService): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    res.json(getStats(stats));
  });

  return router;
}
