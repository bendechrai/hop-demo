// A short code is 3 to 32 letters, digits or hyphens. Generated codes fit this
// too, so the same rule decides which paths can be redirects.
export const CODE_PATTERN = /^[A-Za-z0-9-]{3,32}$/;

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}
