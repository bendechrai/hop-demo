import { expect, test } from "@playwright/test";

const stamp = Date.now().toString(36);
const destination = "https://example.com/e2e/labels";
const links = [
  { code: `lab-${stamp}-a`, label: "docs" },
  { code: `lab-${stamp}-b`, label: "Docs team" },
  { code: `lab-${stamp}-c`, label: "sales" },
  { code: `lab-${stamp}-d`, label: "" },
];

const wide = `lab-${stamp}-wide`;
const wideShort = `lab-${stamp}-wide-short`;
const fortyW = "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW";

test.afterAll(async ({ request }) => {
  for (const link of links) await request.delete(`/api/links/${link.code}`);
  await request.delete(`/api/links/${wide}`);
  await request.delete(`/api/links/${wideShort}`);
});

test("labels show as tags and the filter narrows the table", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  for (const link of links) {
    await page.getByLabel("Long URL").fill(destination);
    await page.getByLabel("Custom code (optional)").fill(link.code);
    await page.getByLabel("Label (optional)").fill(link.label);
    await page.getByRole("button", { name: "Shorten" }).click();
    await expect(page.locator("#rows tr", { hasText: link.code })).toHaveCount(1);
    await expect(page.getByLabel("Label (optional)")).toHaveValue("");
  }

  for (const link of links) {
    const tag = page.locator("#rows tr", { hasText: link.code }).locator(".tag");
    if (link.label) await expect(tag).toHaveText(link.label);
    else await expect(tag).toHaveCount(0);
  }

  const mine = page.locator("#rows tr", { hasText: `lab-${stamp}` });
  const filter = page.getByLabel("Filter by label");

  await filter.fill("doc");
  await expect(mine).toHaveCount(2);
  await expect(page.locator("#rows tr", { hasText: links[0].code })).toHaveCount(1);
  await expect(page.locator("#rows tr", { hasText: links[1].code })).toHaveCount(1);

  // The page reloads the list every five seconds; the filter must outlive it.
  // A fake clock runs the refresh now, so the links do not sit in the shared
  // database for five real seconds while other specs count rows.
  const refreshed = page.waitForResponse((res) => res.url().endsWith("/api/links") && res.request().method() === "GET");
  await page.clock.runFor(5000);
  await refreshed;
  await expect(mine).toHaveCount(2);

  await filter.fill("nobody-has-this");
  await expect(page.locator("#rows tr.empty")).toHaveText("No link matches that label.");

  await filter.fill("");
  await expect(mine).toHaveCount(4);
});

test("the tag stays inside the destination cell and the url stays visible", async ({ page }) => {
  const longUrl = "https://example.com/some/very/long/path/that/goes/on/and/on/for/a/while/campaign?utm_source=newsletter&utm_medium=email";
  const shortUrl = "https://example.com/a";
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByLabel("Long URL").fill(longUrl);
  await page.getByLabel("Custom code (optional)").fill(wide);
  await page.getByLabel("Label (optional)").fill(fortyW);
  await page.getByRole("button", { name: "Shorten" }).click();

  const row = page.locator("#rows tr", { hasText: wide });
  await expect(row).toHaveCount(1);
  const tag = row.locator(".tag");
  await expect(tag).toHaveText(fortyW);
  await expect(tag).toBeVisible();
  await expect(row.locator(".dest-url")).toContainText("https://example.com/some/very/long/path");

  // toHaveText passes on a clipped element, so compare the boxes.
  const cell = await row.locator("td.dest").boundingBox();
  const box = await tag.boundingBox();
  if (!cell || !box) throw new Error("the cell or the tag has no box");
  expect(box.x).toBeGreaterThanOrEqual(cell.x);
  expect(box.x + box.width).toBeLessThanOrEqual(cell.x + cell.width);

  const longUrlWidth = (await row.locator(".dest-url").boundingBox())?.width;
  expect(longUrlWidth).toBeGreaterThan(0);

  await page.getByLabel("Long URL").fill(shortUrl);
  await page.getByLabel("Custom code (optional)").fill(wideShort);
  await page.getByLabel("Label (optional)").fill(fortyW);
  await page.getByRole("button", { name: "Shorten" }).click();

  const shortRow = page.locator("#rows tr", { hasText: wideShort });
  await expect(shortRow).toHaveCount(1);
  const shortUrlWidth = (await shortRow.locator(".dest-url").boundingBox())?.width;
  expect(shortUrlWidth).toBeGreaterThan(0);
});
