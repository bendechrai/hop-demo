import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.ts";
import { createLinksService, type Link } from "./services/links.ts";
import { openTestDatabase } from "./services/test-database.ts";

let server: Server;
let base: string;
let db: DatabaseSync;

interface Presented extends Link {
  shortUrl: string;
}

async function postLink(body: Record<string, unknown>): Promise<Response> {
  return fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

before(async () => {
  db = openTestDatabase();
  server = createApp(createLinksService(db)).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No port");
  base = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test("POST /api/links creates a short link", async () => {
  const res = await postLink({ url: "https://example.com/very/long/path" });
  assert.equal(res.status, 201);
  const body = (await res.json()) as Presented;
  assert.match(body.code, /^[a-zA-Z0-9]{6}$/);
  assert.equal(body.url, "https://example.com/very/long/path");
  assert.equal(body.clicks, 0);
  assert.equal(body.shortUrl, `${base}/${body.code}`);
});

test("POST /api/links rejects invalid URLs", async () => {
  const res = await postLink({ url: "nope" });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error?: string };
  assert.ok(body.error);
});

test("GET /:code redirects and counts clicks", async () => {
  const created = (await (await postLink({ url: "https://example.org/landing" })).json()) as Presented;

  for (let i = 0; i < 3; i += 1) {
    const res = await fetch(`${base}/${created.code}`, { redirect: "manual" });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://example.org/landing");
  }

  const detail = (await (await fetch(`${base}/api/links/${created.code}`)).json()) as Presented;
  assert.equal(detail.clicks, 3);

  const list = (await (await fetch(`${base}/api/links`)).json()) as Presented[];
  const found = list.find((link) => link.code === created.code);
  assert.equal(found?.clicks, 3);
});

test("unknown codes return 404", async () => {
  const res = await fetch(`${base}/zzzzzz`, { redirect: "manual" });
  assert.equal(res.status, 404);
  const api = await fetch(`${base}/api/links/zzzzzz`);
  assert.equal(api.status, 404);
});
