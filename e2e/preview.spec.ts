import { expect, test } from "@playwright/test";

const code = `pv-${Date.now().toString(36)}`;
const destination = "https://example.com/e2e/preview";

test("a preview page shows the link without counting a click", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Long URL").fill(destination);
  await page.getByLabel("Custom code (optional)").fill(code);
  await page.getByRole("button", { name: "Shorten" }).click();
  await expect(page.locator("#message")).toHaveText("Short link created.");

  await page.goto(`/${code}+`);
  await expect(page).toHaveURL(new RegExp(`/${code}\\+$`));
  await expect(page.locator("#destination")).toHaveText(destination);
  await expect(page.locator("#clicks")).toHaveText("0");
  await expect(page.locator("#expires")).toHaveText("Never");

  await page.reload();
  await expect(page.locator("#clicks")).toHaveText("0");
});
