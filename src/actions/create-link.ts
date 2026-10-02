import type { ActionResult } from "./result.ts";
import { isValidCode } from "./validate-code.ts";
import type { Link, LinksService } from "../services/links.ts";
import { normaliseUrl } from "../services/normalise-url.ts";
import { generateCode } from "../services/short-code.ts";

const MAX_URL_LENGTH = 2048;
const CODE_ATTEMPTS = 10;

export interface CreateLinkInput {
  url: unknown;
  code?: unknown;
}

function invalid(error: string): ActionResult<never> {
  return { ok: false, reason: "invalid", error };
}

function chooseCode(requested: unknown, links: LinksService): ActionResult<string> {
  const custom = typeof requested === "string" ? requested.trim() : requested;
  if (custom !== undefined && custom !== null && custom !== "") {
    if (typeof custom !== "string" || !isValidCode(custom)) {
      return invalid("Custom code must be 3 to 32 characters: letters, digits and hyphens only.");
    }
    if (links.get(custom)) {
      return { ok: false, reason: "conflict", error: `The code "${custom}" is already taken.` };
    }
    return { ok: true, value: custom };
  }
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = generateCode();
    if (!links.get(code)) return { ok: true, value: code };
  }
  throw new Error("Could not generate a unique code");
}

export function createLink(input: CreateLinkInput, links: LinksService): ActionResult<Link> {
  const url = normaliseUrl(input.url);
  if (!url) return invalid("Please provide a valid http or https URL.");
  if (url.length > MAX_URL_LENGTH) {
    return invalid(`URL is too long (max ${MAX_URL_LENGTH} characters).`);
  }
  const code = chooseCode(input.code, links);
  if (!code.ok) return code;
  return { ok: true, value: links.insert(code.value, url) };
}
