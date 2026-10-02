import type { ActionResult } from "./result.ts";

export const LABEL_PATTERN = /^[A-Za-z0-9 -]{1,40}$/;

// Missing, null or blank text means the link has no label. Only leading and
// trailing spaces are trimmed.
export function validateLabel(requested: unknown): ActionResult<string | null> {
  if (requested === undefined || requested === null) return { ok: true, value: null };
  if (typeof requested === "string") {
    const label = requested.trim();
    if (label === "") return { ok: true, value: null };
    if (LABEL_PATTERN.test(label)) return { ok: true, value: label };
  }
  return {
    ok: false,
    reason: "invalid",
    error: "Label must be 1 to 40 characters: letters, digits, spaces and hyphens only.",
  };
}
