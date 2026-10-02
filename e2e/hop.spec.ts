import { expect, test } from "@playwright/test";
import { plantExpiredLink } from "./database.ts";

const code = `e2e-${Date.now().toString(36)}`;
const destination = "https://example.com/e2e/landing";

// Runs first, while the throwaway database is still empty.
test("the stats page shows zeros and a note when there are no links", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.locator("#total-links")).toHaveText("0");
  await expect(page.locator("#total-clicks")).toHaveText("0");
  await expect(page.locator("#top tr.empty")).toHaveText("No links yet.");
});

test("a link can be created, followed, and shows its click count", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "hop" })).toBeVisible();

  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(code);
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toHaveText("Short link created.");

  const row = page.locator("#rows tr", { hasText: code });
  await expect(row).toHaveCount(1);
  await expect(row.locator("td.dest")).toHaveText(destination);
  await expect(row.locator("td.num")).toHaveText("0");

  // The destination is served by the test itself so the browser follows the
  // redirect without touching the network.
  await page.route(destination, (route) => route.fulfill({ body: "landed" }));
  await page.goto(`/${code}`);
  await expect(page).toHaveURL(destination);

  await page.goto("/");
  await expect(page.locator("#rows tr", { hasText: code }).locator("td.num")).toHaveText("1");
});

test("a link can be deleted from the table after confirming", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(`${code}-del`);
  await page.getByRole("button", { name: "Shorten" }).click();
  const row = page.locator("#rows tr", { hasText: `${code}-del` });
  await expect(row).toHaveCount(1);

  page.once("dialog", (dialog) => {
    expect(dialog.type()).toBe("confirm");
    void dialog.accept();
  });
  await row.getByRole("button", { name: `Delete ${code}-del` }).click();
  await expect(row).toHaveCount(0);

  const gone = await page.request.delete(`/api/links/${code}-del`);
  expect(gone.status()).toBe(404);
});

test("a link can be given an expiry in days when it is created", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(`${code}-30d`);
  await page.getByLabel("Expires in days (optional)").fill("30");
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toHaveText("Short link created.");

  const row = page.locator("#rows tr", { hasText: `${code}-30d` });
  await expect(row).toHaveCount(1);
  await expect(row).not.toHaveClass(/expired/);
  await expect(row.locator("td.num")).toHaveText("0");

  const detail = await (await page.request.get(`/api/links/${code}-30d`)).json();
  expect(detail.expiresAt).toBeTruthy();
  expect(detail.expired).toBe(false);
  const daysAway = (Date.parse(detail.expiresAt) - Date.now()) / 86_400_000;
  expect(daysAway).toBeGreaterThan(29.9);
  expect(daysAway).toBeLessThanOrEqual(30);
});

test("an expired link is greyed out, answers 410, and can still be deleted", async ({ page }) => {
  const expired = `${code}-old`;
  plantExpiredLink(expired, destination);

  await page.goto("/");
  const row = page.locator("#rows tr", { hasText: expired });
  await expect(row).toHaveCount(1);
  await expect(row).toHaveClass(/expired/);
  await expect(row.locator("td.num")).toHaveText("Expired");

  const response = await page.goto(`/${expired}`);
  expect(response?.status()).toBe(410);
  await expect(page.getByText("This link has expired.")).toBeVisible();

  await page.goto("/");
  await expect(row.locator("td.num")).toHaveText("Expired");
  page.once("dialog", (dialog) => {
    void dialog.accept();
  });
  await row.getByRole("button", { name: `Delete ${expired}` }).click();
  await expect(row).toHaveCount(0);
});

test("the stats page shows the totals and the most clicked links, expired ones marked", async ({ page }) => {
  // Earlier scenarios leave links behind, so the test checks what it adds.
  const before = await (await page.request.get("/api/stats")).json();

  await page.goto("/");
  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(`${code}-top`);
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toHaveText("Short link created.");

  await page.route(destination, (route) => route.fulfill({ body: "landed" }));
  for (let i = 0; i < 3; i += 1) {
    await page.goto(`/${code}-top`);
    await expect(page).toHaveURL(destination);
  }
  plantExpiredLink(`${code}-stale`, destination);

  await page.goto("/");
  await page.getByRole("link", { name: "Stats" }).click();
  await expect(page).toHaveURL(/\/stats$/);
  await expect(page.locator("#total-links")).toHaveText(String(before.links + 2));
  await expect(page.locator("#total-clicks")).toHaveText(String(before.clicks + 3));

  const rows = page.locator("#top tr");
  await expect(rows.first()).toContainText(`${code}-top`);
  expect(await rows.count()).toBeLessThanOrEqual(5);

  const top = page.locator("#top tr", { hasText: `${code}-top` });
  await expect(top).not.toHaveClass(/expired/);
  await expect(top.locator("td.dest")).toHaveText(destination);
  await expect(top.locator("td.num")).toHaveText("3");

  const stale = page.locator("#top tr", { hasText: `${code}-stale` });
  await expect(stale).toHaveCount(1);
  await expect(stale).toHaveClass(/expired/);
  await expect(stale.locator("td.num")).toHaveText("0 Expired");

  await page.getByRole("link", { name: "Home" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "hop" })).toBeVisible();
});
