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
    { code: "taken", url: "https://a.example", clicks: 0, createdAt: "2026-01-01T00:00:00.000Z" },
  ]);
  const result = createLink({ url: "https://b.example", code: "taken" }, links);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.reason, "conflict");
    assert.match(result.error, /already taken/);
  }
  assert.equal(links.rows.length, 1);
});

test("createLink checks the URL before the code", () => {
  const result = createLink({ url: "nope", code: "!!" }, fakeLinks());
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /URL/);
});
