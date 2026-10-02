import { isExpired } from "./is-expired.ts";
import type { Link } from "../services/links.ts";

// A link as the API reports it: the stored row plus whether it has expired
// right now, so clients never need a clock of their own.
export interface LinkStatus extends Link {
  expired: boolean;
}

export function withStatus(link: Link, now: Date): LinkStatus {
  return { ...link, expired: isExpired(link, now) };
}
