import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { parse } from "node:path";
import { fileURLToPath } from "node:url";
import { RESERVED_CODES, reservedCodeError } from "./reserved-codes.ts";

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

test("reservedCodeError refuses every reserved word", () => {
  for (const code of ["api", "stats", "app", "index", "style"]) {
    assert.match(reservedCodeError(code) ?? "", /reserved/, `expected ${code} to be reserved`);
  }
});

test("reservedCodeError ignores case, as the routes do", () => {
  assert.match(reservedCodeError("Stats") ?? "", /reserved/);
  assert.match(reservedCodeError("API") ?? "", /reserved/);
});

test("reservedCodeError refuses a code ending in a plus sign, naming the preview", () => {
  const error = reservedCodeError("abc+") ?? "";
  assert.match(error, /\+/);
  assert.match(error, /preview/);
});

test("reservedCodeError allows an ordinary code", () => {
  assert.equal(reservedCodeError("my-stats"), null);
  assert.equal(reservedCodeError("statsx"), null);
});

test("every file in public/ has its name in the reserved list", () => {
  for (const file of readdirSync(publicDir)) {
    const name = parse(file).name.toLowerCase();
    assert.ok(RESERVED_CODES.includes(name), `public/${file} is served, so "${name}" must be reserved`);
  }
});
