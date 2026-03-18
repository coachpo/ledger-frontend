import { test, expect } from "@playwright/test";

const API_BASE = "http://127.0.0.1:8001/api/v1";

test.describe("Reports", () => {
  test("navigate to reports page from sidebar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
    await page.getByRole("link", { name: "Reports" }).click();
    await expect(page).toHaveURL(/\/reports/);
  });

  test("generate report from template, view, edit, download, delete", async ({
    page,
    request,
  }) => {
    const templateResponse = await request.post(`${API_BASE}/templates`, {
      data: {
        name: `E2E Report Template ${Date.now()}`,
        content: "# E2E Report\n\nHello world.\n\n- Item one\n- Item two",
      },
    });
    expect(templateResponse.ok()).toBeTruthy();
    const template = await templateResponse.json();

    await page.goto("/reports");
    await page.getByRole("button", { name: /generate report/i }).click();
    await expect(
      page.getByRole("heading", { name: "Generate Report" }),
    ).toBeVisible();

    await page.getByRole("combobox").click();
    await page
      .getByRole("option", { name: new RegExp(template.name) })
      .click();
    await page.getByRole("button", { name: /^generate$/i }).click();

    await page.waitForURL(/\/reports\/\d+/);

    await expect(
      page.getByRole("heading", { name: "E2E Report" }),
    ).toBeVisible();
    await expect(page.getByText("Hello world.")).toBeVisible();
    await expect(page.getByText("Item one")).toBeVisible();

    await page.getByRole("button", { name: /edit/i }).click();
    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill("# Edited E2E Report\n\nEdited content.");
    await page.getByRole("button", { name: /save/i }).click();
    await expect(page.getByText("Report updated")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Edited E2E Report" }),
    ).toBeVisible();
    await expect(page.getByText("Edited content.")).toBeVisible();

    const downloadLink = page.getByRole("link", { name: /download/i });
    await expect(downloadLink).toBeVisible();
    const href = await downloadLink.getAttribute("href");
    expect(href).toContain("/reports/");
    expect(href).toContain("/download");

    const downloadResponse = await request.get(href!);
    expect(downloadResponse.ok()).toBeTruthy();
    expect(downloadResponse.headers()["content-type"]).toContain(
      "text/markdown",
    );
    expect(downloadResponse.headers()["content-disposition"]).toContain(
      "attachment",
    );
    const body = await downloadResponse.text();
    expect(body).toContain("Edited content.");

    await page.goto("/reports");
    await page.waitForLoadState("networkidle");

    const reportCard = page.locator("[data-slot='card']").first();
    await expect(reportCard).toBeVisible();

    await reportCard.getByRole("button", { name: /open actions/i }).click();
    await page.getByRole("menuitem", { name: /delete/i }).click();
    await page.getByRole("button", { name: /^delete$/i }).click();
    await expect(page.getByText("Report deleted")).toBeVisible();
  });

  test("generate report from template editor", async ({ page, request }) => {
    const templateResponse = await request.post(`${API_BASE}/templates`, {
      data: {
        name: `E2E Editor Report ${Date.now()}`,
        content: "# Editor Report\n\nFrom editor.",
      },
    });
    expect(templateResponse.ok()).toBeTruthy();
    const template = await templateResponse.json();

    await page.goto(`/templates/${template.id}/edit`);
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /generate report/i }).click();
    await expect(page.getByText(/generated/i)).toBeVisible({
      timeout: 10000,
    });
  });
});
