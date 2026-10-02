import { withStatus, type LinkStatus } from "./link-status.ts";
import type { ActionResult } from "./result.ts";
import { isValidCode } from "./validate-code.ts";
import type { LinksService } from "../services/links.ts";
import { normaliseUrl } from "../services/normalise-url.ts";
import { generateCode } from "../services/short-code.ts";

const MAX_URL_LENGTH = 2048;
const CODE_ATTEMPTS = 10;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 365;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface CreateLinkInput {
  url: unknown;
  code?: unknown;
  expiresInDays?: unknown;
}

function invalid(error: string): ActionResult<never> {
  return { ok: false, reason: "invalid", error };
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function chooseCode(requested: unknown, links: LinksService): ActionResult<string> {
  const custom = typeof requested === "string" ? requested.trim() : requested;
  if (!isBlank(custom)) {
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

// The form sends the days as text, so a numeric string counts as a number.
function chooseExpiry(requested: unknown, now: Date): ActionResult<string | null> {
  if (isBlank(requested)) return { ok: true, value: null };
  const days = typeof requested === "string" ? Number(requested.trim()) : requested;
  if (
    typeof days !== "number" ||
    !Number.isInteger(days) ||
    days < MIN_EXPIRY_DAYS ||
    days > MAX_EXPIRY_DAYS
  ) {
    return invalid(`Expiry must be a whole number of days from ${MIN_EXPIRY_DAYS} to ${MAX_EXPIRY_DAYS}.`);
  }
  return { ok: true, value: new Date(now.getTime() + days * MS_PER_DAY).toISOString() };
}

export function createLink(
  input: CreateLinkInput,
  links: LinksService,
  now: Date = new Date(),
): ActionResult<LinkStatus> {
  const url = normaliseUrl(input.url);
  if (!url) return invalid("Please provide a valid http or https URL.");
  if (url.length > MAX_URL_LENGTH) {
    return invalid(`URL is too long (max ${MAX_URL_LENGTH} characters).`);
  }
  const code = chooseCode(input.code, links);
  if (!code.ok) return code;
  const expiresAt = chooseExpiry(input.expiresInDays, now);
  if (!expiresAt.ok) return expiresAt;
  return { ok: true, value: withStatus(links.insert(code.value, url, expiresAt.value), now) };
}
