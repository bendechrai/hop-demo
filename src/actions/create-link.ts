import type { ActionResult } from "./result.ts";
import type { Link, LinksService } from "../services/links.ts";
import { normaliseUrl } from "../services/normalise-url.ts";
import { generateCode } from "../services/short-code.ts";

const MAX_URL_LENGTH = 2048;
const CODE_ATTEMPTS = 10;

export function createLink(input: { url: unknown }, links: LinksService): ActionResult<Link> {
  const url = normaliseUrl(input.url);
  if (!url) {
    return { ok: false, reason: "invalid", error: "Please provide a valid http or https URL." };
  }
  if (url.length > MAX_URL_LENGTH) {
    return {
      ok: false,
      reason: "invalid",
      error: `URL is too long (max ${MAX_URL_LENGTH} characters).`,
    };
  }
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = generateCode();
    if (links.get(code)) continue;
    return { ok: true, value: links.insert(code, url) };
  }
  throw new Error("Could not generate a unique code");
}
