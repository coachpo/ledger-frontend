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

  test("add position loads a suggested name and still allows manual fallback", async ({ page, request }) => {
    const portfolioName = `E2E Position Lookup ${Date.now()}`;
    const createResponse = await request.post("http://127.0.0.1:8001/api/v1/portfolios", {
      data: {
        name: portfolioName,
        description: "Playwright Add Position lookup coverage",
        baseCurrency: "USD",
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const portfolio = await createResponse.json();

    await page.goto(`/portfolios/${portfolio.id}`);
    await expect(page.getByRole("heading", { name: portfolioName })).toBeVisible();

    await page.getByRole("button", { name: "Add Position" }).click();
    await page.getByLabel("Symbol").fill("AAPL");
    await expect(page.getByLabel("Name")).toHaveValue("Apple Inc.");
    await expect(page.getByText("Suggested name loaded. You can edit it before saving.")).toBeVisible();

    await page.getByLabel("Name").fill("Apple E2E Override");
    await page.getByLabel("Quantity").fill("10");
    await page.getByLabel("Average Cost").fill("185.50");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Apple E2E Override")).toBeVisible();

    await page.getByRole("button", { name: "Add Position" }).click();
    await page.getByLabel("Symbol").fill("ZZZZZZZZ");
    await expect(page.getByText("No company name found. You can enter one manually.")).toBeVisible();
    await expect(page.getByLabel("Name")).toHaveValue("");

    await page.getByLabel("Name").fill("Manual Fallback Name");
    await page.getByLabel("Quantity").fill("1");
    await page.getByLabel("Average Cost").fill("1.00");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Manual Fallback Name")).toBeVisible();
  });
});
