import test from "node:test";
import assert from "node:assert/strict";
import { ROUTE_PREFIXES } from "./app.ts";
import { RESERVED_CODES } from "./actions/reserved-codes.ts";

test("top-level route prefixes are reserved codes", () => {
  for (const prefix of Object.values(ROUTE_PREFIXES)) {
    const firstSegment = prefix.split("/").filter(Boolean)[0]?.toLowerCase();
    assert.ok(firstSegment, `Expected route prefix "${prefix}" to include a segment`);
    assert.ok(
      RESERVED_CODES.includes(firstSegment),
      `Expected reserved codes to include first segment "${firstSegment}" from prefix "${prefix}"`,
    );
  }
});
