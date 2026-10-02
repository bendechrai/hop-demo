import { test } from "node:test";
import assert from "node:assert/strict";
import { linksToCsv } from "./csv.ts";
import type { Link } from "./links.ts";

const HEADER = "code,url,clicks,created_at,expires_at";

function link(overrides: Partial<Link> = {}): Link {
  return {
    code: "abc123",
    url: "https://example.com/a",
    clicks: 3,
    createdAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-02-01T00:00:00.000Z",
    label: null,
    ...overrides,
  };
}

test("no links gives only the header row", () => {
  assert.equal(linksToCsv([]), `${HEADER}\r\n`);
});

test("a plain row has no quotes", () => {
  assert.equal(
    linksToCsv([link()]),
    `${HEADER}\r\nabc123,https://example.com/a,3,2026-01-01T00:00:00.000Z,2026-02-01T00:00:00.000Z\r\n`,
  );
});

test("a link that never expires has an empty expires_at", () => {
  const lines = linksToCsv([link({ expiresAt: null })]).split("\r\n");
  assert.equal(lines[1], "abc123,https://example.com/a,3,2026-01-01T00:00:00.000Z,");
});

test("a value with a comma is quoted", () => {
  const lines = linksToCsv([link({ url: "https://example.com/a,b" })]).split("\r\n");
  assert.match(lines[1] ?? "", /^abc123,"https:\/\/example\.com\/a,b",3,/);
});

test("a value with a double quote is quoted and the quote doubled", () => {
  const lines = linksToCsv([link({ url: 'https://example.com/a,b?q="x"' })]).split("\r\n");
  assert.match(lines[1] ?? "", /^abc123,"https:\/\/example\.com\/a,b\?q=""x""",3,/);
});

test("a value with a line break is quoted", () => {
  const csv = linksToCsv([link({ url: "https://example.com/a\nb" })]);
  assert.ok(csv.includes('"https://example.com/a\nb"'));
});
