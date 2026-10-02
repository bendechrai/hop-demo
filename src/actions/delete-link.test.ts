import { test } from "node:test";
import assert from "node:assert/strict";
import { deleteLink } from "./delete-link.ts";
import { fakeLinks } from "./fake-links.ts";

const seed = { url: "https://example.com/", clicks: 0, createdAt: "2026-01-01T00:00:00.000Z" };

test("deleteLink removes an existing link and leaves the others", () => {
  const links = fakeLinks([
    { ...seed, code: "keep" },
    { ...seed, code: "gone" },
  ]);
  const result = deleteLink("gone", links);
  assert.ok(result.ok);
  assert.deepEqual(
    links.rows.map((link) => link.code),
    ["keep"],
  );
});

test("deleteLink reports not-found for a code that does not exist", () => {
  const links = fakeLinks([{ ...seed, code: "keep" }]);
  const result = deleteLink("missing", links);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, "not-found");
  assert.equal(links.rows.length, 1);
});
