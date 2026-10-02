import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseUrl } from "./normalise-url.ts";

test("normaliseUrl accepts http(s) and adds a scheme when missing", () => {
  assert.equal(normaliseUrl("https://example.com/a?b=c"), "https://example.com/a?b=c");
  assert.equal(normaliseUrl("example.com/path"), "https://example.com/path");
  assert.equal(normaliseUrl("ftp://example.com"), null);
  assert.equal(normaliseUrl("javascript:alert(1)"), null);
  assert.equal(normaliseUrl("   "), null);
  assert.equal(normaliseUrl("not a url"), null);
});
