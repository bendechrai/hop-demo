import type { Request } from "express";
import type { Link } from "../services/links.ts";

function baseUrl(req: Request): string {
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${req.get("host")}`;
}

export function presentLink<T extends Link>(link: T, req: Request): T & { shortUrl: string } {
  return { ...link, shortUrl: `${baseUrl(req)}/${link.code}` };
}
