import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeLinks } from "./fake-links.ts";
import { previewLink } from "./preview-link.ts";

const now = new Date("2026-06-01T12:00:00.000Z");
const seed = {
  url: "https://example.com/",
  clicks: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: null,
};

test("previewLink returns a live link that is not flagged expired", () => {
  const links = fakeLinks([{ ...seed, code: "abc123" }]);
  const result = previewLink("abc123", links, now);
  assert.ok(result.ok);
  assert.equal(result.value.url, "https://example.com/");
  assert.equal(result.value.expired, false);
});

test("previewLink still returns an expired link and flags it", () => {
  const links = fakeLinks([{ ...seed, code: "old-one", expiresAt: "2026-05-01T00:00:00.000Z" }]);
  const result = previewLink("old-one", links, now);
  assert.ok(result.ok);
  assert.equal(result.value.expired, true);
});

test("previewLink reports not-found for an unknown code", () => {
  const result = previewLink("zzzzzz", fakeLinks([{ ...seed, code: "abc123" }]), now);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "not-found");
});

test("previewLink never counts a click", () => {
  const links = fakeLinks([{ ...seed, code: "abc123" }]);
  previewLink("abc123", links, now);
  previewLink("abc123", links, now);
  assert.equal(links.get("abc123")?.clicks, 0);
});
