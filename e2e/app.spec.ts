import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/portfolios', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'portfolio-1',
            name: 'Core Portfolio',
            description: 'Long-term holdings',
            baseCurrency: 'USD',
            positionCount: 2,
            balanceCount: 1,
            createdAt: '2026-03-10T14:00:00Z',
            updatedAt: '2026-03-10T14:00:00Z',
          },
        ]),
      })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'portfolio-2',
        name: 'Scenario Lab',
        description: 'Paper trading sandbox',
        baseCurrency: 'USD',
        positionCount: 0,
        balanceCount: 0,
        createdAt: '2026-03-10T14:00:00Z',
        updatedAt: '2026-03-10T14:00:00Z',
      }),
    })
  })

  await page.route('**/api/v1/portfolios/portfolio-1', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'portfolio-1',
        name: 'Core Portfolio',
        description: 'Long-term holdings',
        baseCurrency: 'USD',
        positionCount: 2,
        balanceCount: 1,
        createdAt: '2026-03-10T14:00:00Z',
        updatedAt: '2026-03-10T14:00:00Z',
      }),
    })
  })

  await page.route('**/api/v1/portfolios/portfolio-1/balances', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'balance-1',
          portfolioId: 'portfolio-1',
          label: 'Cash',
          amount: '25000.0000',
          currency: 'USD',
          createdAt: '2026-03-10T14:00:00Z',
          updatedAt: '2026-03-10T14:00:00Z',
        },
      ]),
    })
  })

  await page.route('**/api/v1/portfolios/portfolio-1/positions', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'position-1',
          portfolioId: 'portfolio-1',
          symbol: 'AAPL',
          name: 'Apple Inc.',
          quantity: '12.00000000',
          averageCost: '184.10000000',
          currency: 'USD',
          createdAt: '2026-03-10T14:00:00Z',
          updatedAt: '2026-03-10T14:00:00Z',
        },
        {
          id: 'position-2',
          portfolioId: 'portfolio-1',
          symbol: 'MSFT',
          name: 'Microsoft Corp.',
          quantity: '5.00000000',
          averageCost: '400.00000000',
          currency: 'USD',
          createdAt: '2026-03-10T14:00:00Z',
          updatedAt: '2026-03-10T14:00:00Z',
        },
      ]),
    })
  })

  await page.route('**/api/v1/portfolios/portfolio-1/trading-operations', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'trade-1',
          portfolioId: 'portfolio-1',
          balanceId: 'balance-1',
          balanceLabel: 'Cash',
          symbol: 'AAPL',
          side: 'BUY',
          quantity: '2.00000000',
          price: '190.00000000',
          commission: '3.5000',
          currency: 'USD',
          executedAt: '2026-03-10T14:05:00Z',
          createdAt: '2026-03-10T14:05:01Z',
        },
      ]),
    })
  })

  await page.route('**/api/v1/portfolios/portfolio-1/market-data/quotes?symbols=AAPL%2CMSFT', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        quotes: [
          {
            symbol: 'AAPL',
            price: '191.24000000',
            currency: 'USD',
            provider: 'yahoo_finance',
            asOf: '2026-03-10T13:55:00Z',
            isStale: false,
          },
          {
            symbol: 'MSFT',
            price: '403.10000000',
            currency: 'USD',
            provider: 'yahoo_finance',
            asOf: '2026-03-10T13:50:00Z',
            isStale: true,
          },
        ],
        warnings: ['Using cached quote for MSFT'],
      }),
    })
  })
})

test('renders the portfolio list and opens the detail workspace', async ({ page }) => {
  await page.goto('/portfolios')

  await expect(page.getByRole('heading', { name: 'Portfolio map' })).toBeVisible()
  await expect(page.getByText('Core Portfolio')).toBeVisible()
  await expect(page.getByText('Long-term holdings')).toBeVisible()

  await page.getByRole('button', { name: 'New portfolio' }).click()
  await expect(page.getByRole('heading', { name: 'Create a new portfolio' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: /edit/i }).first().click()
  await expect(page.getByRole('heading', { name: 'Refine portfolio details' })).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: /delete/i }).first().click()
  await expect(page.getByRole('heading', { name: 'Delete portfolio and related records?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep it' }).click()

  await page.getByRole('button', { name: /Core Portfolio/i }).click()
  await expect(page.getByRole('heading', { name: 'Core Portfolio' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Balances' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Positions' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Simulated trade' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Indicative market data' })).toBeVisible()
  await expect(page.getByText('Using cached quote for MSFT')).toBeVisible()

  await page.getByRole('button', { name: 'Import CSV' }).first().click()
  await expect(page.getByRole('heading', { name: 'Import position snapshot' })).toBeVisible()
  await expect(page.getByText('symbol,quantity,average_cost,name')).toBeVisible()
})

test('shows quote warnings even when no quote cards render', async ({ page }) => {
  await page.route('**/api/v1/portfolios/portfolio-1/market-data/quotes?symbols=AAPL%2CMSFT', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        quotes: [],
        warnings: ['Using cached quote for AAPL'],
      }),
    })
  })

  await page.goto('/portfolios/portfolio-1')

  await expect(page.getByRole('heading', { name: 'Indicative market data' })).toBeVisible()
  await expect(page.getByText('No indicative quotes yet')).toBeVisible()
  await expect(page.getByText('Using cached quote for AAPL')).toBeVisible()
})

test('keeps the delete dialog open and shows the API error when delete fails', async ({ page }) => {
  await page.route('**/api/v1/portfolios/portfolio-1', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'portfolio_locked',
          message: 'Portfolio cannot be deleted',
          details: [{ reason: 'Contains protected balances' }],
        }),
      })
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'portfolio-1',
        name: 'Core Portfolio',
        description: 'Long-term holdings',
        baseCurrency: 'USD',
        positionCount: 2,
        balanceCount: 1,
        createdAt: '2026-03-10T14:00:00Z',
        updatedAt: '2026-03-10T14:00:00Z',
      }),
    })
  })

  await page.goto('/portfolios')

  await page.getByRole('button', { name: /delete/i }).first().click()
  await page.getByRole('button', { name: 'Delete portfolio' }).click()

  await expect(page.getByRole('heading', { name: 'Delete portfolio and related records?' })).toBeVisible()
  await expect(page.getByText('Portfolio cannot be deleted')).toBeVisible()
})
