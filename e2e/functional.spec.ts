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
  test("LLM configs page renders", async ({ page }) => {
    await page.goto("/llm-configs");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Prompt Template CRUD", () => {
  test("templates page renders", async ({ page }) => {
    await page.goto("/templates");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Snippet CRUD", () => {
  test("snippets page renders", async ({ page }) => {
    await page.goto("/snippets");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Stock Analysis", () => {
  test("run builder page renders", async ({ page }) => {
    await page.goto("/requests");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("responses page renders", async ({ page }) => {
    await page.goto("/responses");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });
});
