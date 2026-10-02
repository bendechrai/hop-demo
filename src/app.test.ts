import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.ts";
import { createLinksService, type Link, type LinksService } from "./services/links.ts";
import { createStatsService } from "./services/stats.ts";
import { openTestDatabase } from "./services/test-database.ts";

let server: Server;
let base: string;
let db: DatabaseSync;
let links: LinksService;

interface Presented extends Link {
  shortUrl: string;
  expired: boolean;
}

interface StatsBody {
  links: number;
  clicks: number;
  top: Array<Link & { expired: boolean }>;
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

test("POST /api/links creates a short link", async () => {
  const res = await postLink({ url: "https://example.com/very/long/path" });
  assert.equal(res.status, 201);
  const body = (await res.json()) as Presented;
  assert.match(body.code, /^[a-zA-Z0-9]{6}$/);
  assert.equal(body.url, "https://example.com/very/long/path");
  assert.equal(body.clicks, 0);
  assert.equal(body.expiresAt, null);
  assert.equal(body.expired, false);
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

test("DELETE /api/links/:code removes the link and then reports 404", async () => {
  const created = (await (await postLink({ url: "https://example.net/gone" })).json()) as Presented;

  const res = await fetch(`${base}/api/links/${created.code}`, { method: "DELETE" });
  assert.equal(res.status, 204);

  const detail = await fetch(`${base}/api/links/${created.code}`);
  assert.equal(detail.status, 404);
  const redirect = await fetch(`${base}/${created.code}`, { redirect: "manual" });
  assert.equal(redirect.status, 404);

  const again = await fetch(`${base}/api/links/${created.code}`, { method: "DELETE" });
  assert.equal(again.status, 404);
});

test("unknown codes return 404", async () => {
  const res = await fetch(`${base}/zzzzzz`, { redirect: "manual" });
  assert.equal(res.status, 404);
  const api = await fetch(`${base}/api/links/zzzzzz`);
  assert.equal(api.status, 404);
});

test("POST /api/links stores an expiry in days and the list reports it", async () => {
  const before = Date.now();
  const res = await postLink({ url: "https://example.com/week", expiresInDays: 7 });
  assert.equal(res.status, 201);
  const body = (await res.json()) as Presented;
  assert.ok(body.expiresAt);
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const expiresIn = Date.parse(body.expiresAt) - before;
  assert.ok(expiresIn >= sevenDays && expiresIn < sevenDays + 5000, `expiry was ${expiresIn}ms away`);
  assert.equal(body.expired, false);

  const list = (await (await fetch(`${base}/api/links`)).json()) as Presented[];
  const found = list.find((link) => link.code === body.code);
  assert.equal(found?.expiresAt, body.expiresAt);
  assert.equal(found?.expired, false);
});

test("POST /api/links rejects an expiry outside 1 to 365 days", async () => {
  for (const expiresInDays of [0, 366, "soon"]) {
    const res = await postLink({ url: "https://example.com/bad", expiresInDays });
    assert.equal(res.status, 400, `expected ${String(expiresInDays)} to be rejected`);
    const body = (await res.json()) as { error?: string };
    assert.match(body.error ?? "", /whole number of days from 1 to 365/);
  }
});

test("GET /:code on an expired link returns 410 with the expired page and counts nothing", async () => {
  // The service is the only honest way to make a link that is already expired.
  links.insert("expired-e2e", "https://example.org/old", "2020-01-01T00:00:00.000Z");

  const res = await fetch(`${base}/expired-e2e`, { redirect: "manual" });
  assert.equal(res.status, 410);
  assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await res.text(), /expired/i);

  const detail = (await (await fetch(`${base}/api/links/expired-e2e`)).json()) as Presented;
  assert.equal(detail.clicks, 0);
  assert.equal(detail.expired, true);

  const missing = await fetch(`${base}/no-such-code`, { redirect: "manual" });
  assert.equal(missing.status, 404);
});

test("GET /api/stats reports the totals and the top links with an expired link flagged", async () => {
  const before = (await (await fetch(`${base}/api/stats`)).json()) as StatsBody;
  const created = (await (await postLink({ url: "https://example.com/stats/live" })).json()) as Presented;
  for (let i = 0; i < 2; i += 1) {
    await fetch(`${base}/${created.code}`, { redirect: "manual" });
  }
  // The service is the only honest way to make an expired link that was
  // clicked while it was live.
  links.insert("stats-old", "https://example.com/stats/old", "2020-01-01T00:00:00.000Z");
  for (let i = 0; i < 9; i += 1) links.recordClick("stats-old");

  const res = await fetch(`${base}/api/stats`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as StatsBody;
  assert.equal(body.links, before.links + 2);
  assert.equal(body.clicks, before.clicks + 11);
  assert.ok(body.top.length <= 5, `top had ${body.top.length} links`);

  const counts = body.top.map((link) => link.clicks);
  assert.deepEqual(counts, [...counts].sort((a, b) => b - a));
  assert.equal(body.top[0]?.code, "stats-old");
  assert.equal(body.top[0]?.url, "https://example.com/stats/old");
  assert.equal(body.top[0]?.clicks, 9);
  assert.equal(body.top[0]?.expired, true);
  const live = body.top.find((link) => link.code === created.code);
  assert.equal(live?.clicks, 2);
  assert.equal(live?.expired, false);
});

test("GET /stats serves the stats page and an unknown code still gets 404", async () => {
  const res = await fetch(`${base}/stats`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  const html = await res.text();
  assert.match(html, /<title>Stats - hop<\/title>/);
  assert.match(html, /href="\/"/);

  const missing = await fetch(`${base}/no-such-code`, { redirect: "manual" });
  assert.equal(missing.status, 404);
});

test("GET /:code+ shows a preview page for a live link and counts nothing", async () => {
  links.insert("prev-live", "https://example.com/a?x=1&y=2", null);
  for (let i = 0; i < 2; i += 1) {
    const res = await fetch(`${base}/prev-live+`, { redirect: "manual" });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type") ?? "", /html/);
    const html = await res.text();
    assert.ok(html.includes("https://example.com/a?x=1&amp;y=2"));
    assert.match(html, /Never/);
    assert.match(html, /Clicks<\/dt><dd id="clicks">0/);
  }
  assert.equal(links.get("prev-live")?.clicks, 0);
});

test("GET /:code+ for an expired link is 200 and marked expired", async () => {
  links.insert("prev-old", "https://example.org/old", "2020-01-01T00:00:00.000Z");
  const res = await fetch(`${base}/prev-old+`, { redirect: "manual" });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /2020-01-01/);
  assert.match(html, /expired/i);
  assert.equal(links.get("prev-old")?.clicks, 0);
});

test("GET /:code+ escapes a hostile destination", async () => {
  links.insert("prev-xss", 'http://x.test/"><script>alert(1)</script>', null);
  const html = await (await fetch(`${base}/prev-xss+`)).text();
  assert.ok(!html.includes("<script>alert"));
});

test("GET /:code+ for an unknown code is 404", async () => {
  const res = await fetch(`${base}/nope123+`);
  assert.equal(res.status, 404);
});

test("GET /:code still redirects and counts while /:code+ does not", async () => {
  links.insert("prev-both", "https://example.com/both", null);
  await fetch(`${base}/prev-both+`);
  assert.equal(links.get("prev-both")?.clicks, 0);
  const res = await fetch(`${base}/prev-both`, { redirect: "manual" });
  assert.equal(res.status, 302);
  assert.equal(links.get("prev-both")?.clicks, 1);
});

test("GET /api/links.csv returns the header and one row per link, expired included", async () => {
  links.insert("csv-live", "https://example.com/csv-live", null);
  links.insert("csv-old", "https://example.com/csv-old", "2020-01-01T00:00:00.000Z");

  const res = await fetch(`${base}/api/links.csv`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type") ?? "", /^text\/csv/);
  const lines = (await res.text()).split("\r\n").filter((line) => line !== "");
  assert.equal(lines[0], "code,url,clicks,created_at,expires_at");
  assert.equal(lines.length - 1, links.list().length);
  const live = lines.find((line) => line.startsWith("csv-live,"));
  const old = lines.find((line) => line.startsWith("csv-old,"));
  assert.ok(live?.endsWith(","), "a link with no expiry has an empty expires_at");
  assert.ok(old?.endsWith(",2020-01-01T00:00:00.000Z"));
});

test("POST /api/links refuses the code stats with 400 and /stats still shows the stats page", async () => {
  const res = await postLink({ url: "https://example.com/reserved", code: "stats" });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.match(body.error, /reserved/);
  assert.equal((await fetch(`${base}/api/links/stats`)).status, 404);

  const page = await fetch(`${base}/stats`, { redirect: "manual" });
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<title>Stats - hop<\/title>/);
});
