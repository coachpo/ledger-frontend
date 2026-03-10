import { describe, expect, it } from 'vitest'

import type { BalanceRead, MarketQuoteRead, PositionRead, TradingOperationRead } from '@/lib/api'
import { buildWorkspaceMetrics, sortOperations, sortPortfolios } from '@/lib/workspace'

describe('workspace metrics', () => {
  const balances: BalanceRead[] = [
    {
      id: 'balance-1',
      portfolioId: 'portfolio-1',
      label: 'Cash',
      amount: '1500.00',
      currency: 'USD',
      createdAt: '2026-03-10T12:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
    },
  ]

  const positions: PositionRead[] = [
    {
      id: 'position-1',
      portfolioId: 'portfolio-1',
      symbol: 'AAPL',
      name: 'Apple',
      quantity: '10',
      averageCost: '100.00',
      currency: 'USD',
      createdAt: '2026-03-10T12:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
    },
    {
      id: 'position-2',
      portfolioId: 'portfolio-1',
      symbol: 'MSFT',
      name: 'Microsoft',
      quantity: '5',
      averageCost: '50.00',
      currency: 'USD',
      createdAt: '2026-03-10T12:00:00Z',
      updatedAt: '2026-03-10T12:00:00Z',
    },
  ]

  const quotes: MarketQuoteRead[] = [
    {
      symbol: 'AAPL',
      price: '110.00',
      currency: 'USD',
      provider: 'public_delayed_feed',
      asOf: '2026-03-10T13:55:00Z',
      isStale: false,
    },
  ]

  const operations: TradingOperationRead[] = [
    {
      id: 'trade-1',
      portfolioId: 'portfolio-1',
      balanceId: 'balance-1',
      balanceLabel: 'Cash',
      symbol: 'AAPL',
      side: 'BUY',
      quantity: '2',
      price: '100.00',
      commission: '5.00',
      currency: 'USD',
      executedAt: '2026-03-10T14:05:00Z',
      createdAt: '2026-03-10T14:05:01Z',
    },
  ]

  it('derives totals and quote coverage from current state', () => {
    const metrics = buildWorkspaceMetrics({
      balances,
      positions,
      quotes,
      warnings: ['Using cached quote for AAPL'],
      operations,
    })

    expect(metrics.cashTotal).toBe(1500)
    expect(metrics.costBasisTotal).toBe(1250)
    expect(metrics.indicativeValueTotal).toBe(1350)
    expect(metrics.quoteCoverage).toBe(0.5)
    expect(metrics.warningCount).toBe(1)
    expect(metrics.allocationRows[0]?.symbol).toBe('AAPL')
    expect(metrics.allocationRows[1]?.currentValue).toBe(250)
  })

  it('treats zero-value quotes as real coverage', () => {
    const metrics = buildWorkspaceMetrics({
      balances: [],
      positions: [positions[0]],
      quotes: [
        {
          symbol: 'AAPL',
          price: '0',
          currency: 'USD',
          provider: 'public_delayed_feed',
          asOf: '2026-03-10T13:55:00Z',
          isStale: false,
        },
      ],
      warnings: [],
      operations: [],
    })

    expect(metrics.indicativeValueTotal).toBe(0)
    expect(metrics.quoteCoverage).toBe(1)
    expect(metrics.allocationRows[0]?.hasQuote).toBe(true)
  })

  it('sorts portfolio operations newest first', () => {
    const sorted = sortOperations([
      operations[0],
      {
        ...operations[0],
        id: 'trade-2',
        executedAt: '2026-03-11T14:05:00Z',
      },
    ])

    expect(sorted[0]?.id).toBe('trade-2')
  })

  it('sorts portfolios by update time descending', () => {
    const sorted = sortPortfolios([
      {
        id: 'portfolio-1',
        name: 'Older',
        description: null,
        baseCurrency: 'USD',
        positionCount: 1,
        balanceCount: 1,
        createdAt: '2026-03-10T12:00:00Z',
        updatedAt: '2026-03-10T12:00:00Z',
      },
      {
        id: 'portfolio-2',
        name: 'Newer',
        description: null,
        baseCurrency: 'USD',
        positionCount: 1,
        balanceCount: 1,
        createdAt: '2026-03-10T12:00:00Z',
        updatedAt: '2026-03-11T12:00:00Z',
      },
    ])

    expect(sorted[0]?.name).toBe('Newer')
  })
})
