import { test } from "node:test";
import assert from "node:assert/strict";
import { createLinksService } from "./links.ts";
import { openTestDatabase } from "./test-database.ts";

test("remove deletes the row and says whether anything was there", () => {
  const db = openTestDatabase();
  const links = createLinksService(db);
  links.insert("abc123", "https://example.com/");

  assert.equal(links.remove("abc123"), true);
  assert.equal(links.get("abc123"), null);
  assert.equal(links.remove("abc123"), false);
  db.close();
});
