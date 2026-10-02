import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeLinks } from "./fake-links.ts";
import { followLink } from "./follow-link.ts";

const seed = {
  url: "https://example.com/",
  clicks: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: null,
  label: null,
};

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

test("followLink refuses an expired link and does not count the click", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");
  const links = fakeLinks([{ ...seed, code: "old-one", expiresAt: "2026-05-01T00:00:00.000Z" }]);
  const result = followLink("old-one", links, now);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "expired");
    assert.match(result.error, /expired/);
  }
  assert.equal(links.get("old-one")?.clicks, 0);
});

test("followLink redirects and counts when the expiry is still ahead or there is none", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");
  const links = fakeLinks([
    { ...seed, code: "later", expiresAt: "2026-06-01T12:00:00.001Z" },
    { ...seed, code: "forever", expiresAt: null },
  ]);
  for (const code of ["later", "forever"]) {
    const result = followLink(code, links, now);
    assert.ok(result.ok, `expected ${code} to redirect`);
    assert.equal(links.get(code)?.clicks, 1);
  }
});
