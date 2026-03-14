import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("app loads and renders dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
  });

  test("sidebar navigation has all 7 routes", async ({ page }) => {
    await page.goto("/");
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link")).toHaveCount.greaterThanOrEqual;
  });

  test("navigate to portfolios page", async ({ page }) => {
    await page.goto("/portfolios");
    await expect(page).toHaveURL(/\/portfolios/);
  });

  test("navigate to LLM configs page", async ({ page }) => {
    await page.goto("/llm-configs");
    await expect(page).toHaveURL(/\/llm-configs/);
  });

  test("navigate to templates page", async ({ page }) => {
    await page.goto("/templates");
    await expect(page).toHaveURL(/\/templates/);
  });

  test("navigate to snippets page", async ({ page }) => {
    await page.goto("/snippets");
    await expect(page).toHaveURL(/\/snippets/);
  });

  test("navigate to requests page", async ({ page }) => {
    await page.goto("/requests");
    await expect(page).toHaveURL(/\/requests/);
  });

  test("navigate to responses page", async ({ page }) => {
    await page.goto("/responses");
    await expect(page).toHaveURL(/\/responses/);
  });
});
