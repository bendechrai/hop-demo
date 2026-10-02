import { randomBytes } from "node:crypto";

// No 0/O/1/l/I so a code read aloud or copied by hand is unambiguous.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  }
  return code;
}
