// Returns an absolute http(s) URL, adding https:// when the scheme is missing,
// or null when the input cannot be a web address.
export function normaliseUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    if (parsed.hostname !== "localhost") return null;
  }
  return parsed.href;
}
