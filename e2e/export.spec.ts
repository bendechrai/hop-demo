import { expect, test } from "@playwright/test";

const code = `csv-${Date.now().toString(36)}`;
const destination = "https://example.com/e2e/csv";

test("the Export CSV link downloads the header row and a new link", async ({ page, request }) => {
  await page.goto("/");
  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(code);
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toHaveText("Short link created.");

  const href = await page.getByRole("link", { name: "Export CSV" }).getAttribute("href");
  expect(href).toBe("/api/links.csv");
  const response = await page.request.get(href ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/csv");
  const body = await response.text();
  expect(body).toContain("code,url,clicks,created_at,expires_at");
  expect(body).toContain(`${code},${destination},0,`);

  // This file runs before hop.spec.ts, whose first scenario needs an empty
  // table, so the link is removed again.
  await request.delete(`/api/links/${code}`);
});
