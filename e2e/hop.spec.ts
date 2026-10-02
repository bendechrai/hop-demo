import { expect, test } from "@playwright/test";
import { plantExpiredLink } from "./database.ts";

const code = `e2e-${Date.now().toString(36)}`;
const destination = "https://example.com/e2e/landing";

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
