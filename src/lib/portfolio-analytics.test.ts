import { describe, expect, it } from "vitest"

import type {
  BalanceRead,
  MarketQuoteRead,
  PositionRead,
  TradingOperationRead,
} from "@/lib/api"
import {
  buildPortfolioDashboard,
  getBenchmarkForMarket,
  inferMarketBucket,
} from "@/lib/portfolio-analytics"

const balances: BalanceRead[] = [
  {
    id: "balance-1",
    portfolioId: "portfolio-1",
    label: "Cash",
    amount: "910.00",
    currency: "USD",
    createdAt: "2026-03-10T12:00:00Z",
    updatedAt: "2026-03-10T12:00:00Z",
  },
]

const positions: PositionRead[] = [
  {
    id: "position-1",
    portfolioId: "portfolio-1",
    symbol: "AAPL",
    name: "Apple",
    quantity: "1",
    averageCost: "102.50",
    currency: "USD",
    createdAt: "2026-03-10T12:00:00Z",
    updatedAt: "2026-03-10T12:00:00Z",
  },
]

const quotes: MarketQuoteRead[] = [
  {
    symbol: "AAPL",
    price: "120.00",
    previousClose: "118.00",
    currency: "USD",
    provider: "public_delayed_feed",
    asOf: "2026-03-10T13:55:00Z",
    isStale: false,
  },
]

const operations: TradingOperationRead[] = [
  {
    id: "trade-1",
    portfolioId: "portfolio-1",
    balanceId: "balance-1",
    balanceLabel: "Cash",
    symbol: "AAPL",
    side: "BUY",
    quantity: "2",
    price: "100.00",
    commission: "5.00",
    dividendAmount: null,
    splitRatio: null,
    currency: "USD",
    executedAt: "2026-03-10T14:05:00Z",
    createdAt: "2026-03-10T14:05:01Z",
  },
  {
    id: "trade-2",
    portfolioId: "portfolio-1",
    balanceId: "balance-1",
    balanceLabel: "Cash",
    symbol: "AAPL",
    side: "SELL",
    quantity: "1",
    price: "120.00",
    commission: "5.00",
    dividendAmount: null,
    splitRatio: null,
    currency: "USD",
    executedAt: "2026-03-11T14:05:00Z",
    createdAt: "2026-03-11T14:05:01Z",
  },
  {
    id: "trade-3",
    portfolioId: "portfolio-1",
    balanceId: "balance-1",
    balanceLabel: "Cash",
    symbol: "0700.HK",
    side: "BUY",
    quantity: "1",
    price: "50.00",
    commission: "0.00",
    dividendAmount: null,
    splitRatio: null,
    currency: "USD",
    executedAt: "2026-02-01T14:05:00Z",
    createdAt: "2026-02-01T14:05:01Z",
  },
  {
    id: "trade-4",
    portfolioId: "portfolio-1",
    balanceId: "balance-1",
    balanceLabel: "Cash",
    symbol: "0700.HK",
    side: "SELL",
    quantity: "1",
    price: "65.00",
    commission: "1.00",
    dividendAmount: null,
    splitRatio: null,
    currency: "USD",
    executedAt: "2026-02-15T14:05:00Z",
    createdAt: "2026-02-15T14:05:01Z",
  },
]

describe("portfolio analytics", () => {
  it("derives core dashboard metrics, grouped holdings, and historical holdings", () => {
    const dashboard = buildPortfolioDashboard({
      balances,
      positions,
      quotes,
      operations,
    })

    expect(dashboard.totalMarketValue).toBe(1030)
    expect(dashboard.todayPnl).toBe(2)
    expect(dashboard.floatingPnl).toBe(17.5)
    expect(dashboard.cumulativePnl).toBe(44)
    expect(dashboard.topGains[0]?.symbol).toBe("AAPL")
    expect(dashboard.holdingGroups[0]?.market).toBe("US")
    expect(dashboard.historicalHoldings[0]?.symbol).toBe("0700.HK")
    expect(dashboard.historicalHoldings[0]?.realizedPnl).toBe(14)
    expect(dashboard.historyGroups[0]?.monthKey).toBe("2026-03")
  })

  it("infers market buckets and benchmark mappings from symbols", () => {
    expect(inferMarketBucket("AAPL")).toBe("US")
    expect(inferMarketBucket("0700.HK")).toBe("HK")
    expect(inferMarketBucket("600519.SS")).toBe("A-Share")
    expect(getBenchmarkForMarket("US")?.symbol).toBe("^GSPC")
    expect(getBenchmarkForMarket("Other")).toBeNull()
  })
})
