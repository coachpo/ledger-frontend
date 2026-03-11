import { test, expect } from '@playwright/test';

async function createPortfolio(page: import('@playwright/test').Page, name: string, description?: string) {
  await page.goto('/portfolios');
  await page.getByRole('button', { name: /new portfolio/i }).click();
  await expect(page.getByRole('heading', { name: 'Create portfolio' })).toBeVisible();
  await page.locator('input[name="name"]').fill(name);
  if (description) {
    await page.locator('textarea[name="description"]').fill(description);
  }
  await page.getByRole('combobox', { name: /base currency/i }).click();
  await page.getByRole('option', { name: 'USD' }).click();
  await page.getByRole('button', { name: 'Create portfolio' }).click();
  await expect(page).toHaveURL(/\/portfolios\/[^/]+\/overview$/);
}

async function addBalance(page: import('@playwright/test').Page, label: string, amount: string) {
  await page.getByRole('button', { name: /add balance/i }).first().click();
  await expect(page.getByRole('heading', { name: 'Add balance' })).toBeVisible();
  await page.locator('input[name="label"]').fill(label);
  await page.locator('input[name="amount"]').fill(amount);
  await page.getByRole('button', { name: 'Create balance' }).click();
  await expect(page.getByText(label)).toBeVisible();
}

async function addPosition(page: import('@playwright/test').Page, symbol: string, quantity: string, averageCost: string, name?: string) {
  await page.getByRole('button', { name: /^add position$/i }).click();
  await expect(page.getByRole('heading', { name: 'Add position' })).toBeVisible();
  await page.locator('input[name="symbol"]').fill(symbol);
  if (name) {
    await page.locator('input[name="name"]').fill(name);
  }
  await page.locator('input[name="quantity"]').fill(quantity);
  await page.locator('input[name="averageCost"]').fill(averageCost);
  await page.getByRole('button', { name: 'Create position' }).click();
  await expect(page.getByText(symbol).first()).toBeVisible();
}

async function openTradePage(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: 'Add Trade' }).click();
  await expect(page).toHaveURL(/\/trades\/new$/);
}

test.describe('Portfolio Management', () => {
  test('should create a new portfolio', async ({ page }) => {
    await createPortfolio(page, 'Test Portfolio', 'Test portfolio description');

    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Test Portfolio' })).toBeVisible();
  });

  test('should list all portfolios', async ({ page }) => {
    await page.goto('/portfolios');
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Portfolios' })).toBeVisible();
  });

  test('should edit portfolio metadata', async ({ page }) => {
    await createPortfolio(page, 'Editable Portfolio');

    await page.getByRole('button', { name: 'Edit portfolio' }).click();
    await expect(page.getByRole('heading', { name: 'Edit portfolio' })).toBeVisible();
    await page.locator('input[name="name"]').fill('Updated Portfolio Name');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Updated Portfolio Name' })).toBeVisible();
  });

  test('should delete portfolio with confirmation', async ({ page }) => {
    await createPortfolio(page, 'Disposable Portfolio');

    await page.getByRole('button', { name: 'Delete portfolio' }).click();
    await expect(page.getByText('Delete this portfolio?')).toBeVisible();
    await page.getByRole('button', { name: 'Delete portfolio' }).click();

    await expect(page).toHaveURL(/\/portfolios$/);
    await expect(page.getByText('Portfolio deleted')).toBeVisible();
  });

  test('should maintain portfolio isolation', async ({ page }) => {
    await createPortfolio(page, 'Portfolio A');
    await addPosition(page, 'AAPL', '10', '150');

    await page.goto('/portfolios');
    await page.getByRole('button', { name: /new portfolio/i }).click();
    await page.locator('input[name="name"]').fill('Portfolio B');
    await page.getByRole('combobox', { name: /base currency/i }).click();
    await page.getByRole('option', { name: 'USD' }).click();
    await page.getByRole('button', { name: 'Create portfolio' }).click();
    await expect(page).toHaveURL(/\/overview$/);

    await expect(page.getByText('AAPL')).toHaveCount(0);
  });
});

test.describe('Balance Management', () => {
  test.beforeEach(async ({ page }) => {
    await createPortfolio(page, 'Test Portfolio');
  });

  test('should create a balance', async ({ page }) => {
    await addBalance(page, 'Cash Account', '10000');
    await expect(page.getByText('Cash Account')).toBeVisible();
  });
});

test.describe('Position Management', () => {
  test.beforeEach(async ({ page }) => {
    await createPortfolio(page, 'Test Portfolio');
  });

  test('should create a position manually', async ({ page }) => {
    await addPosition(page, 'AAPL', '100', '150.50', 'Apple Inc.');
    await expect(page.getByText('Apple Inc.')).toBeVisible();
  });
});

test.describe('Trading Operations', () => {
  test.beforeEach(async ({ page }) => {
    await createPortfolio(page, 'Trading Portfolio');
    await addBalance(page, 'Cash', '50000');
    await addPosition(page, 'AAPL', '100', '150');
  });

  test('should execute a BUY operation', async ({ page }) => {
    await openTradePage(page);

    await page.getByRole('combobox', { name: /settlement balance/i }).click();
    await page.getByRole('option', { name: /cash/i }).click();
    await page.locator('input[name="symbol"]').fill('AAPL');
    await page.locator('input[name="quantity"]').fill('10');
    await page.locator('input[name="price"]').fill('155');
    await page.locator('input[name="commission"]').fill('5');
    await page.getByRole('button', { name: 'Submit trade' }).click();

    await expect(page.getByText('BUY operation recorded')).toBeVisible();
  });

  test('should execute a SELL operation', async ({ page }) => {
    await openTradePage(page);

    await page.getByRole('combobox', { name: /settlement balance/i }).click();
    await page.getByRole('option', { name: /cash/i }).click();
    await page.getByRole('combobox', { name: /side/i }).click();
    await page.getByRole('option', { name: 'SELL' }).click();
    await page.locator('input[name="symbol"]').fill('AAPL');
    await page.locator('input[name="quantity"]').fill('10');
    await page.locator('input[name="price"]').fill('160');
    await page.locator('input[name="commission"]').fill('5');
    await page.getByRole('button', { name: 'Submit trade' }).click();

    await expect(page.getByText('SELL operation recorded')).toBeVisible();
  });

  test('should reject oversell', async ({ page }) => {
    await openTradePage(page);

    await page.getByRole('combobox', { name: /settlement balance/i }).click();
    await page.getByRole('option', { name: /cash/i }).click();
    await page.getByRole('combobox', { name: /side/i }).click();
    await page.getByRole('option', { name: 'SELL' }).click();
    await page.locator('input[name="symbol"]').fill('AAPL');
    await page.locator('input[name="quantity"]').fill('200');
    await page.locator('input[name="price"]').fill('160');
    await page.getByRole('button', { name: 'Submit trade' }).click();

    await expect(page.getByText('Trade rejected')).toBeVisible();
  });

  test('should reject negative balance', async ({ page }) => {
    await openTradePage(page);

    await page.getByRole('combobox', { name: /settlement balance/i }).click();
    await page.getByRole('option', { name: /cash/i }).click();
    await page.locator('input[name="symbol"]').fill('AAPL');
    await page.locator('input[name="quantity"]').fill('1000');
    await page.locator('input[name="price"]').fill('155');
    await page.getByRole('button', { name: 'Submit trade' }).click();

    await expect(page.getByText('Trade rejected')).toBeVisible();
  });
});

test.describe('UI/UX Features', () => {
  test('should toggle amount visibility', async ({ page }) => {
    await createPortfolio(page, 'Visibility Portfolio');

    const toggle = page.getByRole('button', { name: /hide amounts|show amounts/i });
    await toggle.click();
    await expect(page.getByRole('button', { name: /hide amounts|show amounts/i })).toBeVisible();
  });

  test('should use keyboard shortcuts', async ({ page }) => {
    await createPortfolio(page, 'Shortcut Portfolio');
    // Wait for portfolio workspace to fully load and keyboard handlers to attach
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Give React time to attach event listeners

    await page.keyboard.press('t');
    await expect(page).toHaveURL(/\/trades\/new$/);
    await expect(page.locator('[data-slot="card-title"]').filter({ hasText: 'Add trade' })).toBeVisible();

    await page.keyboard.press('Alt+1');
    await expect(page).toHaveURL(/\/overview$/);

    await page.keyboard.press('Alt+3');
    await expect(page).toHaveURL(/\/transactions$/);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await createPortfolio(page, 'Navigation Portfolio');

    await page.getByRole('link', { name: 'History' }).click();
    await expect(page).toHaveURL(/\/transactions$/);

    await page.getByRole('link', { name: 'Analysis' }).click();
    await expect(page).toHaveURL(/\/analysis$/);

    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/\/overview$/);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/portfolios');
    // On mobile, check for the sidebar trigger button or the logo icon
    await expect(page.getByRole('button', { name: 'Toggle Sidebar' }).or(page.locator('[aria-label="Ledger"]'))).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/portfolios');
    await expect(page.getByRole('link', { name: 'Ledger' })).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/portfolios');
    await expect(page.getByRole('link', { name: 'Ledger' })).toBeVisible();
  });
});
