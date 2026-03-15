import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("app loads and renders dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
  });

  test("sidebar navigation shows the primary routes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Portfolios" })).toBeVisible();
  });

  test("navigate to portfolios page", async ({ page }) => {
    await page.goto("/portfolios");
    await expect(page).toHaveURL(/\/portfolios/);
  });
});
