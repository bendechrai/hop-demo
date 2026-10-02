import { test } from "node:test";
import assert from "node:assert/strict";
import { createLink } from "./create-link.ts";
import { fakeLinks } from "./fake-links.ts";

test("createLink generates a six character code when none is given", () => {
  const links = fakeLinks();
  const result = createLink({ url: "example.com" }, links);
  assert.ok(result.ok);
  assert.match(result.value.code, /^[a-zA-Z0-9]{6}$/);
  assert.equal(result.value.url, "https://example.com/");
  assert.equal(links.rows.length, 1);
});

test("createLink uses a valid custom code", () => {
  const links = fakeLinks();
  const result = createLink({ url: "https://example.com", code: " my-Code-9 " }, links);
  assert.ok(result.ok);
  assert.equal(result.value.code, "my-Code-9");
});

test("createLink treats a blank custom code as none", () => {
  const result = createLink({ url: "https://example.com", code: "   " }, fakeLinks());
  assert.ok(result.ok);
  assert.match(result.value.code, /^[a-zA-Z0-9]{6}$/);
});

test("createLink rejects malformed custom codes without creating a link", () => {
  for (const code of ["ab", "a".repeat(33), "has space", "under_score", "dot.com", 42]) {
    const links = fakeLinks();
    const result = createLink({ url: "https://example.com", code }, links);
    assert.equal(result.ok, false, `expected ${String(code)} to be rejected`);
    if (!result.ok) assert.equal(result.reason, "invalid");
    assert.equal(links.rows.length, 0);
  }
});

test("createLink refuses a custom code that is already taken", () => {
  const links = fakeLinks([
    {
      code: "taken",
      url: "https://a.example",
      clicks: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: null,
      label: null,
    },
  ]);
  const result = createLink({ url: "https://b.example", code: "taken" }, links);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "conflict");
    assert.match(result.error, /already taken/);
  }
  assert.equal(links.rows.length, 1);
});

test("createLink refuses reserved codes and codes ending in a plus sign without storing a link", () => {
  for (const [code, pattern] of [
    ["stats", /reserved/],
    ["API", /reserved/],
    ["abc+", /preview/],
  ] as const) {
    const links = fakeLinks();
    const result = createLink({ url: "https://example.com", code }, links);
    assert.equal(result.ok, false, `expected ${code} to be rejected`);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
      assert.match(result.error, pattern);
    }
    assert.equal(links.rows.length, 0);
  }
});

test("createLink still accepts a code that only contains a reserved word", () => {
  const result = createLink({ url: "https://example.com", code: "my-stats" }, fakeLinks());
  assert.ok(result.ok);
  assert.equal(result.value.code, "my-stats");
});

test("createLink checks the URL before the code", () => {
  const result = createLink({ url: "nope", code: "!!" }, fakeLinks());
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /URL/);
});

const now = new Date("2026-06-01T12:00:00.000Z");

test("createLink stores an expiry the given number of days from now", () => {
  const links = fakeLinks();
  const result = createLink({ url: "https://example.com", expiresInDays: 30 }, links, now);
  assert.ok(result.ok);
  assert.equal(result.value.expiresAt, "2026-07-01T12:00:00.000Z");
  assert.equal(links.rows[0]?.expiresAt, "2026-07-01T12:00:00.000Z");
});

test("createLink accepts the days as text, as the form sends them", () => {
  const result = createLink({ url: "https://example.com", expiresInDays: " 7 " }, fakeLinks(), now);
  assert.ok(result.ok);
  assert.equal(result.value.expiresAt, "2026-06-08T12:00:00.000Z");
});

test("createLink gives no expiry when the days are blank or missing", () => {
  for (const expiresInDays of [undefined, null, "", "   "]) {
    const result = createLink({ url: "https://example.com", expiresInDays }, fakeLinks(), now);
    assert.ok(result.ok);
    assert.equal(result.value.expiresAt, null);
  }
});

test("createLink rejects an expiry outside 1 to 365 whole days without creating a link", () => {
  for (const expiresInDays of [0, 366, 1.5, -3, "abc", "1e2x", true]) {
    const links = fakeLinks();
    const result = createLink({ url: "https://example.com", expiresInDays }, links, now);
    assert.equal(result.ok, false, `expected ${String(expiresInDays)} to be rejected`);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
      assert.match(result.error, /whole number of days from 1 to 365/);
    }
    assert.equal(links.rows.length, 0);
  }
});

test("createLink accepts the edges of the expiry range", () => {
  for (const expiresInDays of [1, 365]) {
    const result = createLink({ url: "https://example.com", expiresInDays }, fakeLinks(), now);
    assert.ok(result.ok, `expected ${expiresInDays} to be accepted`);
  }
});

test("createLink stores a trimmed label", () => {
  const links = fakeLinks();
  const result = createLink({ url: "https://example.com", label: " Docs team " }, links, now);
  assert.ok(result.ok);
  assert.equal(result.value.label, "Docs team");
  assert.equal(links.rows[0]?.label, "Docs team");
});

test("createLink stores a blank or missing label as null", () => {
  for (const label of [undefined, null, "", "   "]) {
    const result = createLink({ url: "https://example.com", label }, fakeLinks(), now);
    assert.ok(result.ok);
    assert.equal(result.value.label, null);
  }
});

test("createLink refuses an invalid label and creates no link", () => {
  for (const label of ["a".repeat(41), "bad!", 5]) {
    const links = fakeLinks();
    const result = createLink({ url: "https://example.com", label }, links, now);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "invalid");
      assert.match(result.error, /Label must be 1 to 40 characters/);
    }
    assert.equal(links.rows.length, 0);
  }
});

test("createLink reports a bad expiry before a bad label", () => {
  const links = fakeLinks();
  const result = createLink({ url: "https://example.com", expiresInDays: 0, label: "bad!" }, links, now);
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /whole number of days from 1 to 365/);
  assert.equal(links.rows.length, 0);
});
