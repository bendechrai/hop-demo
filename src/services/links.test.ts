import { test } from "node:test";
import assert from "node:assert/strict";
import { createLinksService } from "./links.ts";
import { openTestDatabase } from "./test-database.ts";

test("remove deletes the row and says whether anything was there", () => {
  const db = openTestDatabase();
  const links = createLinksService(db);
  links.insert("abc123", "https://example.com/", null);

  assert.equal(links.remove("abc123"), true);
  assert.equal(links.get("abc123"), null);
  assert.equal(links.remove("abc123"), false);
  db.close();
});

test("insert stores the expiry and get and list read it back", () => {
  const db = openTestDatabase();
  const links = createLinksService(db);
  const expiresAt = "2030-01-01T00:00:00.000Z";

  const timed = links.insert("timed", "https://example.com/a", expiresAt);
  const forever = links.insert("forever", "https://example.com/b", null);
  assert.equal(timed.expiresAt, expiresAt);
  assert.equal(forever.expiresAt, null);

  assert.equal(links.get("timed")?.expiresAt, expiresAt);
  assert.equal(links.get("forever")?.expiresAt, null);
  const byCode = new Map(links.list().map((link) => [link.code, link.expiresAt]));
  assert.equal(byCode.get("timed"), expiresAt);
  assert.equal(byCode.get("forever"), null);
  db.close();
});

test("insert stores a label and get and list read it back, null without one", () => {
  const db = openTestDatabase();
  const links = createLinksService(db);

  const tagged = links.insert("tagged", "https://example.com/a", null, "Docs team");
  const plain = links.insert("plain", "https://example.com/b", null);
  assert.equal(tagged.label, "Docs team");
  assert.equal(plain.label, null);

  assert.equal(links.get("tagged")?.label, "Docs team");
  assert.equal(links.get("plain")?.label, null);
  const byCode = new Map(links.list().map((link) => [link.code, link.label]));
  assert.equal(byCode.get("tagged"), "Docs team");
  assert.equal(byCode.get("plain"), null);
  db.close();
});
