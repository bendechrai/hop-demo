import type { Request } from "express";
import type { Link } from "../services/links.ts";

function baseUrl(req: Request): string {
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${req.get("host")}`;
}

export function presentLink(link: Link, req: Request) {
  return { ...link, shortUrl: `${baseUrl(req)}/${link.code}` };
}
