import { expect, test } from '@playwright/test'

test('renders dashboard, holding detail, and simulation flow with mocked API', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    const { pathname } = url

    if (pathname.endsWith('/account/summary')) {
      await route.fulfill({
        json: {
          cash_balance: { value: '29009.37', currency: 'USD', source: 'imported' },
          net_asset_value: { value: '60626.67', currency: 'USD', source: 'imported' },
          market_value_positions: { value: '31616.2', currency: 'USD', source: 'imported' },
          realized_pl: { value: '708.25', currency: 'USD', source: 'derived' },
          unrealized_pl: { value: '-1792.94', currency: 'USD', source: 'derived' },
          total_deposits: { value: '24185.82', currency: 'USD', source: 'derived' },
          total_withdrawals: { value: '0', currency: 'USD', source: 'derived' },
          fees_and_commissions: { value: '43.59', currency: 'USD', source: 'derived' },
          interest: { value: '0.05', currency: 'USD', source: 'derived' },
          base_currency: 'USD',
          metadata: { latest_import_batch_id: 1 },
        },
      })
      return
    }

    if (pathname.endsWith('/dashboard')) {
      await route.fulfill({
        json: {
          portfolio_value_over_time: [{ date: '2026-02-28', value: '60626.67' }],
          cash_vs_invested: [{ date: '2026-02-28', cash: '29009.37', invested: '31616.20' }],
          realized_vs_unrealized: [{ label: 'realized', value: '708.25' }, { label: 'unrealized', value: '-1792.94' }],
          deposits_and_withdrawals: [{ date: '2026-02-11', deposits: '5000', withdrawals: '0' }],
          current_allocation: [{ symbol: 'AAPL', market_value: '777.09', weight: '2.56' }],
          recent_activity: [{ id: 1, event_type: 'trade', side: 'buy', symbol: 'AAPL', currency: 'USD', effective_at: '2026-02-24T19:49:54Z', effective_date: '2026-02-24', quantity: '0.7335', unit_price: '272.64', amount: '-200.33', proceeds: '-199.98', fee: '-0.35', description: 'AAPL', code: 'O;RI', source_section: 'Trades' }],
          chart_availability: { AAPL: true },
        },
      })
      return
    }

    if (pathname.endsWith('/holdings')) {
      await route.fulfill({
        json: [{
          symbol: 'AAPL',
          instrument_name: 'Apple Inc.',
          quantity: '2.9415',
          current_price: { value: '264.18', currency: 'USD', source: 'imported' },
          market_value: { value: '777.09', currency: 'USD', source: 'imported' },
          cost_basis: { value: '801.34', currency: 'USD', source: 'derived' },
          average_purchase_price: { value: '272.42', currency: 'USD', source: 'derived' },
          realized_pl: { value: '0', currency: 'USD', source: 'derived' },
          unrealized_pl: { value: '-24.25', currency: 'USD', source: 'derived' },
          total_pl: { value: '-24.25', currency: 'USD', source: 'derived' },
          unrealized_pl_percent: '-3.02',
          portfolio_weight: '2.56',
          currency: 'USD',
          last_market_data_update: '2026-02-28T00:00:00Z',
          technical_snapshot: { source: 'estimated', state: 'available', values: { sma7: '270', macd_signal: 'bearish' } },
          broker_reported: { cost_basis: '801.34', unrealized_pl: '-24.25' },
        }],
      })
      return
    }

    if (pathname.endsWith('/holdings/AAPL')) {
      await route.fulfill({
        json: {
          holding: {
            symbol: 'AAPL',
            instrument_name: 'Apple Inc.',
            quantity: '2.9415',
            current_price: { value: '264.18', currency: 'USD', source: 'imported' },
            market_value: { value: '777.09', currency: 'USD', source: 'imported' },
            cost_basis: { value: '801.34', currency: 'USD', source: 'derived' },
            average_purchase_price: { value: '272.42', currency: 'USD', source: 'derived' },
            realized_pl: { value: '0', currency: 'USD', source: 'derived' },
            unrealized_pl: { value: '-24.25', currency: 'USD', source: 'derived' },
            total_pl: { value: '-24.25', currency: 'USD', source: 'derived' },
            unrealized_pl_percent: '-3.02',
            portfolio_weight: '2.56',
            currency: 'USD',
            last_market_data_update: '2026-02-28T00:00:00Z',
            technical_snapshot: { source: 'estimated', state: 'available', values: { sma7: '270', macd_signal: 'bearish' } },
            broker_reported: { cost_basis: '801.34', unrealized_pl: '-24.25' },
          },
          trades: [{ id: 1, side: 'buy', effective_at: '2026-02-24T19:49:54Z', effective_date: '2026-02-24', quantity: '0.7335', price: '272.64', proceeds: '-199.98', fee: '-0.35', code: 'O;RI' }],
        },
      })
      return
    }

    if (pathname.endsWith('/activity')) {
      await route.fulfill({
        json: {
          items: [{ id: 1, event_type: 'trade', side: 'buy', symbol: 'AAPL', currency: 'USD', effective_at: '2026-02-24T19:49:54Z', effective_date: '2026-02-24', quantity: '0.7335', unit_price: '272.64', amount: '-200.33', proceeds: '-199.98', fee: '-0.35', description: 'AAPL', code: 'O;RI', source_section: 'Trades' }],
        },
      })
      return
    }

    if (pathname.endsWith('/chart/AAPL')) {
      await route.fulfill({
        json: {
          symbol: 'AAPL',
          source: 'estimated',
          available: true,
          reason: null,
          bars: [
            { timestamp: 1708732800000, open: '270', high: '274', low: '268', close: '272', volume: '1000' },
            { timestamp: 1708819200000, open: '272', high: '275', low: '269', close: '274', volume: '900' },
            { timestamp: 1708905600000, open: '274', high: '276', low: '263', close: '264.18', volume: '750' },
          ],
          markers: [{ id: 1, side: 'buy', timestamp: 1708804194000, price: '272.64', quantity: '0.7335', fee: '-0.35', text: 'BUY 0.7335' }],
        },
      })
      return
    }

    if (pathname.endsWith('/indicators/AAPL')) {
      await route.fulfill({
        json: {
          symbol: 'AAPL',
          source: 'estimated',
          values: {
            source: 'estimated',
            state: 'available',
            values: {
              sma7: '270.10',
              ema20: '269.42',
              macd_signal: 'bearish',
              rsi_state: 'neutral',
              ichimoku_state: 'below',
            },
          },
        },
      })
      return
    }

    if (pathname.endsWith('/imports')) {
      await route.fulfill({ json: { items: [{ id: 1, account_id: 'U12098900', statement_title: 'Activity Statement', period_start: '2026-02-01', period_end: '2026-02-28', generated_at: '2026-03-09T17:42:23Z', base_currency: 'USD', account_type: 'Individual', overlap_detected: false, status: 'completed', warnings_json: [], error_message: null, imported_event_count: 42, imported_snapshot_count: 58 }] } })
      return
    }

    if (pathname.endsWith('/simulations') && route.request().method() === 'POST') {
      await route.fulfill({
        json: {
          scenario_id: 7,
          name: 'Skip selected trade',
          result: {
            symbol: 'AAPL',
            base_currency: 'USD',
            actual: { quantity: '2.9415', market_value: '777.09', total_pl: '-24.25' },
            hypothetical: { quantity: '2.208', market_value: '583.30', total_pl: '-19.12' },
            delta: { quantity: '-0.7335', market_value: '-193.79', total_pl: '5.13', cash_impact: '200.33' },
          },
        },
      })
      return
    }

    await route.fulfill({ status: 404, json: { detail: 'Unhandled mock route' } })
  })

  await page.goto('/')
  await expect(page.getByText('Portfolio command surface')).toBeVisible()
  await expect(page.getByText('Net asset value')).toBeVisible()

  await page.getByRole('link', { name: /Holdings/i }).click()
  await expect(page.getByRole('link', { name: /AAPL/i }).first()).toBeVisible()
  await page.getByRole('link', { name: /AAPL/i }).first().click()

  await expect(page.getByText('Estimated chart feed')).toBeVisible()
  await expect(page.getByText('Indicator stack')).toBeVisible()

  await page.getByRole('link', { name: /Simulation Lab/i }).click()
  await page.getByRole('button', { name: /Run scenario/i }).click()
  await expect(page.getByText('Scenario result')).toBeVisible()
  await expect(page.getByText('cash_impact')).toBeVisible()
})
