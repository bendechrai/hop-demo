import { expect, test } from "@playwright/test";

test("the form refuses a custom code that a page of the app uses", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Long URL").fill("https://example.com/e2e/reserved");
  await page.getByLabel("Custom code (optional)").fill("api");
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toContainText("reserved");
  await expect(page.locator("#rows")).not.toContainText("/api");
});
