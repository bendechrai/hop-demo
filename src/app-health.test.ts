import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.ts";
import { createLinksService, type LinksService } from "./services/links.ts";
import { createStatsService } from "./services/stats.ts";
import { openTestDatabase } from "./services/test-database.ts";

let server: Server;
let base: string;
let db: DatabaseSync;
let links: LinksService;

before(async () => {
  db = openTestDatabase();
  links = createLinksService(db);
  server = createApp(links, createStatsService(db)).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No port");
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test("GET /health answers 200 JSON with zero links on an empty database", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(await res.text(), '{"status":"ok","links":0}');
});

test("GET /health counts every link, expired included, and counts no click", async () => {
  links.insert("h-one", "https://example.com/1", null);
  links.insert("h-two", "https://example.com/2", null);
  links.insert("h-old", "https://example.com/3", "2020-01-01T00:00:00.000Z");

  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok", links: 3 });
  for (const code of ["h-one", "h-two", "h-old"]) {
    assert.equal(links.get(code)?.clicks, 0, `${code} must have no clicks`);
  }
});

test("the code health is refused and /health still answers", async () => {
  const before = links.list().length;
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/x", code: "health" }),
  });
  assert.equal(res.status, 400);
  assert.equal(links.list().length, before);

  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.equal(((await health.json()) as { status: string }).status, "ok");
});

test("GET /health wins over a stored legacy health code and counts it", async () => {
  const before = links.list().length;
  links.insert("legacy-one", "https://example.com/legacy-1", null);
  links.insert("health", "https://example.com/legacy-health", null);

  const res = await fetch(base + "/health", { redirect: "manual" });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);
  assert.equal(
    await res.text(),
    JSON.stringify({ status: "ok", links: before + 2 }),
  );
});
