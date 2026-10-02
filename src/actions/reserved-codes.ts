// Every first path segment the app serves itself. A custom code equal to one of
// these would be shadowed by that page and never redirect. When you mount a new
// top-level route or add a file to public/, add its name here; a test checks
// public/.
export const RESERVED_CODES: readonly string[] = ["api", "app", "index", "stats", "style"];

// Express matches routes without regard to case, so "Stats" is shadowed too.
export function reservedCodeError(code: string): string | null {
  if (code.endsWith("+")) {
    return `A custom code cannot end in "+": that address shows the link's preview page.`;
  }
  if (RESERVED_CODES.includes(code.toLowerCase())) {
    return `The code "${code}" is reserved for a page of hop. Choose another code.`;
  }
  return null;
}

export function isReservedCode(code: string): boolean {
  return RESERVED_CODES.includes(code.toLowerCase());
}
