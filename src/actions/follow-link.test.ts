import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeLinks } from "./fake-links.ts";
import { followLink } from "./follow-link.ts";

const seed = { url: "https://example.com/", clicks: 0, createdAt: "2026-01-01T00:00:00.000Z" };

test("followLink resolves generated and custom codes and counts the click", () => {
  const links = fakeLinks([
    { ...seed, code: "abc123" },
    { ...seed, code: "my-custom-code" },
  ]);
  for (const code of ["abc123", "my-custom-code"]) {
    const result = followLink(code, links);
    assert.ok(result.ok);
    assert.equal(result.value, "https://example.com/");
    assert.equal(links.get(code)?.clicks, 1);
  }
});

test("followLink reports not-found for unknown or malformed codes", () => {
  const links = fakeLinks([{ ...seed, code: "abc123" }]);
  for (const code of ["zzzzzz", "ab", "style.css"]) {
    const result = followLink(code, links);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "not-found");
  }
});
