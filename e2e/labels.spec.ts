import { expect, test } from "@playwright/test";

const stamp = Date.now().toString(36);
const destination = "https://example.com/e2e/labels";
const links = [
  { code: `lab-${stamp}-a`, label: "docs" },
  { code: `lab-${stamp}-b`, label: "Docs team" },
  { code: `lab-${stamp}-c`, label: "sales" },
  { code: `lab-${stamp}-d`, label: "" },
];

test.afterAll(async ({ request }) => {
  for (const link of links) await request.delete(`/api/links/${link.code}`);
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
