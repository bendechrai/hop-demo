import { test } from "node:test";
import assert from "node:assert/strict";
import { fakeStats } from "./fake-stats.ts";
import { getStats } from "./get-stats.ts";

const seed = {
  url: "https://example.com/",
  clicks: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  expiresAt: null,
};

test("getStats asks the service for five links and passes the totals through", () => {
  const seven = ["a", "b", "c", "d", "e", "f", "g"].map((code, i) => ({
    ...seed,
    code,
    clicks: 7 - i,
  }));
  const stats = fakeStats({ links: 7, clicks: 28 }, seven);

  const result = getStats(stats);
  assert.equal(result.links, 7);
  assert.equal(result.clicks, 28);
  assert.deepEqual(stats.askedFor, [5]);
  assert.deepEqual(
    result.top.map((link) => link.code),
    ["a", "b", "c", "d", "e"],
  );
});

test("getStats flags an expired link in the top list and not a live one", () => {
  const now = new Date("2026-06-01T12:00:00.000Z");
  const stats = fakeStats({ links: 3, clicks: 9 }, [
    { ...seed, code: "old", clicks: 5, expiresAt: "2026-05-01T00:00:00.000Z" },
    { ...seed, code: "later", clicks: 3, expiresAt: "2026-07-01T00:00:00.000Z" },
    { ...seed, code: "forever", clicks: 1 },
  ]);

  const result = getStats(stats, now);
  assert.deepEqual(
    result.top.map((link) => [link.code, link.clicks, link.expired]),
    [
      ["old", 5, true],
      ["later", 3, false],
      ["forever", 1, false],
    ],
  );
  assert.equal(result.top[0]?.url, "https://example.com/");
});
