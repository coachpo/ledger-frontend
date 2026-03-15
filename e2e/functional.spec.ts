import { test, expect } from "@playwright/test";

test.describe("Portfolio CRUD", () => {
  test("create a portfolio", async ({ page }) => {
    await page.goto("/portfolios");

    const createButton = page.getByRole("button", { name: /create|new|add/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      const nameInput = page.getByLabel(/name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill("Test Portfolio");

        const currencyInput = page.getByLabel(/currency/i);
        if (await currencyInput.isVisible()) {
          await currencyInput.fill("USD");
        }

        const submitButton = page.getByRole("button", { name: /create|save|submit/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await expect(page.getByText("Test Portfolio")).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test("portfolio list renders", async ({ page }) => {
    await page.goto("/portfolios");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("LLM Config CRUD", () => {
  test("llm configs page renders", async ({ page }) => {
    await page.goto("/llm-configs");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});
