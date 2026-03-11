import type {
  BalanceRead,
  MarketQuoteRead,
  PositionRead,
  TradingOperationRead,
} from "@/lib/api"
import { decimalToNumber } from "@/lib/format"

export type MarketBucket = "A-Share" | "HK" | "US" | "Other"

export interface AssetAnalysisRow {
  symbol: string
  name: string | null
  market: MarketBucket
  quantity: number
  averageCost: number
  costBasis: number
  currentPrice: number | null
  previousClose: number | null
  currentValue: number
  todayPnl: number
  floatingPnl: number
  floatingPnlRate: number
  realizedPnl: number
  realizedCostBasis: number
  cumulativePnl: number
  cumulativePnlRate: number
  quoteStatus: "delayed" | "stale" | "unavailable"
  updatedAt: string
  tradeCount: number
  isClosed: boolean
}

export interface HoldingGroup {
  market: MarketBucket
  holdings: AssetAnalysisRow[]
  marketValue: number
  floatingPnl: number
  cumulativePnl: number
}

export interface HistoryMonthGroup {
  monthKey: string
  label: string
  operations: TradingOperationRead[]
}

export interface CompositionSlice {
  label: string
  value: number
  percentage: number
}

export interface HistoricalHolding {
  symbol: string
  name: string | null
  market: MarketBucket
  realizedPnl: number
  realizedCostBasis: number
  cumulativePnl: number
  tradeCount: number
  lastExecutedAt: string
}

export interface PortfolioDashboard {
  assetRows: AssetAnalysisRow[]
  holdingGroups: HoldingGroup[]
  historicalHoldings: HistoricalHolding[]
  historyGroups: HistoryMonthGroup[]
  totalMarketValue: number
  cashTotal: number
  stockValueTotal: number
  todayPnl: number
  floatingPnl: number
  floatingPnlRate: number
  cumulativePnl: number
  cumulativePnlRate: number
  totalProfit: number
  totalLoss: number
  winRate: number
  topGains: AssetAnalysisRow[]
  topLosses: AssetAnalysisRow[]
  compositionByAssetClass: CompositionSlice[]
  compositionByMarket: CompositionSlice[]
}

interface RealizedState {
  quantity: number
  averageCost: number
  realizedPnl: number
  realizedCostBasis: number
  tradeCount: number
  lastExecutedAt: string
}

const marketPriority: MarketBucket[] = ["US", "HK", "A-Share", "Other"]

export function inferMarketBucket(symbol: string): MarketBucket {
  const normalized = symbol.trim().toUpperCase()

  if (
    normalized.endsWith(".SS") ||
    normalized.endsWith(".SZ") ||
    normalized.endsWith(".SH") ||
    /^\d{6}$/.test(normalized)
  ) {
    return "A-Share"
  }

  if (normalized.endsWith(".HK") || /^\d{4,5}$/.test(normalized)) {
    return "HK"
  }

  if (/[A-Z]/.test(normalized)) {
    return "US"
  }

  return "Other"
}

export function getAssetDisplayName(name: string | null, symbol: string): string {
  const normalizedName = name?.trim()
  if (!normalizedName) {
    return symbol
  }

  return normalizedName.toUpperCase() === symbol.toUpperCase()
    ? symbol
    : normalizedName
}

export function assetHasDistinctName(name: string | null, symbol: string): boolean {
  return getAssetDisplayName(name, symbol).toUpperCase() !== symbol.toUpperCase()
}

export function getBenchmarkForMarket(market: MarketBucket): {
  label: string
  symbol: string
} | null {
  if (market === "US") {
    return { label: "S&P 500", symbol: "^GSPC" }
  }

  if (market === "HK") {
    return { label: "Hang Seng", symbol: "^HSI" }
  }

  if (market === "A-Share") {
    return { label: "CSI 300", symbol: "000300.SS" }
  }

  return null
}

export function buildPortfolioDashboard({
  balances,
  positions,
  quotes,
  operations,
}: {
  balances: BalanceRead[]
  positions: PositionRead[]
  quotes: MarketQuoteRead[]
  operations: TradingOperationRead[]
}): PortfolioDashboard {
  const quoteBySymbol = new Map(
    quotes.map((quote) => [quote.symbol.toUpperCase(), quote]),
  )
  const positionBySymbol = new Map(
    positions.map((position) => [position.symbol.toUpperCase(), position]),
  )
  const realizedStateBySymbol = replayTradingOperations(operations)
  const symbols = new Set<string>([
    ...Array.from(positionBySymbol.keys()),
    ...Array.from(realizedStateBySymbol.keys()),
  ])

  const assetRows = Array.from(symbols)
    .map((symbol) => {
      const position = positionBySymbol.get(symbol)
      const quote = quoteBySymbol.get(symbol)
      const realizedState = realizedStateBySymbol.get(symbol)
      const quantity = decimalToNumber(position?.quantity)
      const averageCost = decimalToNumber(position?.averageCost)
      const costBasis = quantity * averageCost
      const currentPrice = quote ? decimalToNumber(quote.price) : null
      const previousClose = quote?.previousClose
        ? decimalToNumber(quote.previousClose)
        : null
      const currentValue =
        currentPrice === null ? costBasis : quantity * currentPrice
      const todayPnl =
        currentPrice !== null && previousClose !== null
          ? quantity * (currentPrice - previousClose)
          : 0
      const floatingPnl = currentValue - costBasis
      const floatingPnlRate = costBasis > 0 ? floatingPnl / costBasis : 0
      const realizedPnl = realizedState?.realizedPnl ?? 0
      const realizedCostBasis = realizedState?.realizedCostBasis ?? 0
      const cumulativePnl = realizedPnl + floatingPnl
      const cumulativeCostBasis = costBasis + realizedCostBasis
      const cumulativePnlRate =
        cumulativeCostBasis > 0 ? cumulativePnl / cumulativeCostBasis : 0

      return {
        symbol,
        name: position?.name ?? null,
        market: inferMarketBucket(symbol),
        quantity,
        averageCost,
        costBasis,
        currentPrice,
        previousClose,
        currentValue,
        todayPnl,
        floatingPnl,
        floatingPnlRate,
        realizedPnl,
        realizedCostBasis,
        cumulativePnl,
        cumulativePnlRate,
        quoteStatus: getQuoteStatus(quote),
        updatedAt: position?.updatedAt ?? realizedState?.lastExecutedAt ?? "",
        tradeCount: realizedState?.tradeCount ?? 0,
        isClosed: !position,
      } satisfies AssetAnalysisRow
    })
    .sort((left, right) => right.currentValue - left.currentValue)

  const holdings = assetRows.filter((row) => !row.isClosed)
  const historicalHoldings = assetRows
    .filter((row) => row.isClosed)
    .map((row) => ({
      symbol: row.symbol,
      name: row.name,
      market: row.market,
      realizedPnl: row.realizedPnl,
      realizedCostBasis: row.realizedCostBasis,
      cumulativePnl: row.cumulativePnl,
      tradeCount: row.tradeCount,
      lastExecutedAt: row.updatedAt,
    }))
    .sort(
      (left, right) =>
        new Date(right.lastExecutedAt).getTime() -
        new Date(left.lastExecutedAt).getTime(),
    )

  const holdingGroups = marketPriority
    .map((market) => {
      const groupedHoldings = holdings.filter((row) => row.market === market)
      if (groupedHoldings.length === 0) {
        return null
      }

      return {
        market,
        holdings: groupedHoldings,
        marketValue: groupedHoldings.reduce(
          (total, row) => total + row.currentValue,
          0,
        ),
        floatingPnl: groupedHoldings.reduce(
          (total, row) => total + row.floatingPnl,
          0,
        ),
        cumulativePnl: groupedHoldings.reduce(
          (total, row) => total + row.cumulativePnl,
          0,
        ),
      } satisfies HoldingGroup
    })
    .filter((group): group is HoldingGroup => group !== null)

  const cashTotal = balances.reduce(
    (total, balance) => total + decimalToNumber(balance.amount),
    0,
  )
  const stockValueTotal = holdings.reduce(
    (total, row) => total + row.currentValue,
    0,
  )
  const totalMarketValue = cashTotal + stockValueTotal
  const todayPnl = holdings.reduce((total, row) => total + row.todayPnl, 0)
  const floatingPnl = holdings.reduce(
    (total, row) => total + row.floatingPnl,
    0,
  )
  const floatingCostBasis = holdings.reduce(
    (total, row) => total + row.costBasis,
    0,
  )
  const cumulativePnl = assetRows.reduce(
    (total, row) => total + row.cumulativePnl,
    0,
  )
  const cumulativeCostBasis = assetRows.reduce(
    (total, row) => total + row.costBasis + row.realizedCostBasis,
    0,
  )
  const totalProfit = assetRows.reduce(
    (total, row) => total + Math.max(row.cumulativePnl, 0),
    0,
  )
  const totalLoss = assetRows.reduce(
    (total, row) => total + Math.abs(Math.min(row.cumulativePnl, 0)),
    0,
  )
  const winRate =
    assetRows.length === 0
      ? 0
      : assetRows.filter((row) => row.cumulativePnl > 0).length /
        assetRows.length

  return {
    assetRows,
    holdingGroups,
    historicalHoldings,
    historyGroups: groupOperationsByMonth(operations),
    totalMarketValue,
    cashTotal,
    stockValueTotal,
    todayPnl,
    floatingPnl,
    floatingPnlRate:
      floatingCostBasis > 0 ? floatingPnl / floatingCostBasis : 0,
    cumulativePnl,
    cumulativePnlRate:
      cumulativeCostBasis > 0 ? cumulativePnl / cumulativeCostBasis : 0,
    totalProfit,
    totalLoss,
    winRate,
    topGains: [...assetRows]
      .sort((left, right) => right.cumulativePnl - left.cumulativePnl)
      .slice(0, 5),
    topLosses: [...assetRows]
      .sort((left, right) => left.cumulativePnl - right.cumulativePnl)
      .slice(0, 5),
    compositionByAssetClass: buildComposition([
      { label: "Cash", value: cashTotal },
      { label: "Stocks", value: stockValueTotal },
    ]),
    compositionByMarket: buildComposition(
      holdingGroups.map((group) => ({
        label: group.market,
        value: group.marketValue,
      })),
    ),
  }
}

function getQuoteStatus(
  quote: MarketQuoteRead | undefined,
): "delayed" | "stale" | "unavailable" {
  if (!quote) {
    return "unavailable"
  }

  return quote.isStale ? "stale" : "delayed"
}

function replayTradingOperations(
  operations: TradingOperationRead[],
): Map<string, RealizedState> {
  const stateBySymbol = new Map<string, RealizedState>()

  for (const operation of [...operations].sort(byExecutedAtAscending)) {
    const symbol = operation.symbol.toUpperCase()
    const existing = stateBySymbol.get(symbol) ?? {
      quantity: 0,
      averageCost: 0,
      realizedPnl: 0,
      realizedCostBasis: 0,
      tradeCount: 0,
      lastExecutedAt: operation.executedAt,
    }
    if (operation.side === "BUY") {
      const quantity = decimalToNumber(operation.quantity!)
      const price = decimalToNumber(operation.price!)
      const fee = decimalToNumber(operation.commission)
      const newQuantity = existing.quantity + quantity
      const newBookCost =
        existing.quantity * existing.averageCost + quantity * price + fee
      existing.quantity = newQuantity
      existing.averageCost = newQuantity > 0 ? newBookCost / newQuantity : 0
    } else if (operation.side === "SELL") {
      const quantity = decimalToNumber(operation.quantity!)
      const price = decimalToNumber(operation.price!)
      const fee = decimalToNumber(operation.commission)
      const sellQuantity = Math.min(quantity, existing.quantity)
      const realizedCost = sellQuantity * existing.averageCost
      existing.realizedPnl += sellQuantity * price - realizedCost - fee
      existing.realizedCostBasis += realizedCost
      existing.quantity = Math.max(existing.quantity - sellQuantity, 0)
      if (existing.quantity === 0) {
        existing.averageCost = 0
      }
    } else if (operation.side === "DIVIDEND") {
      const dividendAmount = decimalToNumber(operation.dividendAmount!)
      const fee = decimalToNumber(operation.commission)
      // Dividend increases realized P&L without changing position
      existing.realizedPnl += dividendAmount - fee
    } else if (operation.side === "SPLIT") {
      const splitRatio = decimalToNumber(operation.splitRatio!)
      // Split adjusts quantity and average cost
      existing.quantity = existing.quantity * splitRatio
      existing.averageCost = existing.averageCost / splitRatio
    }

    existing.tradeCount += 1
    existing.lastExecutedAt = operation.executedAt
    stateBySymbol.set(symbol, existing)
  }

  return stateBySymbol
}

function groupOperationsByMonth(
  operations: TradingOperationRead[],
): HistoryMonthGroup[] {
  const groups = new Map<string, TradingOperationRead[]>()

  for (const operation of [...operations].sort(byExecutedAtDescending)) {
    const monthKey = operation.executedAt.slice(0, 7)
    const existing = groups.get(monthKey) ?? []
    existing.push(operation)
    groups.set(monthKey, existing)
  }

  return Array.from(groups.entries())
    .map(([monthKey, groupedOperations]) => ({
      monthKey,
      label: new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(new Date(`${monthKey}-01T00:00:00Z`)),
      operations: groupedOperations,
    }))
    .sort((left, right) => right.monthKey.localeCompare(left.monthKey))
}

function buildComposition(
  items: Array<{ label: string; value: number }>,
): CompositionSlice[] {
  const total = items.reduce((sum, item) => sum + item.value, 0)
  return items
    .filter((item) => item.value > 0)
    .map((item) => ({
      label: item.label,
      value: item.value,
      percentage: total > 0 ? item.value / total : 0,
    }))
}

function byExecutedAtAscending(
  left: TradingOperationRead,
  right: TradingOperationRead,
): number {
  return (
    new Date(left.executedAt).getTime() - new Date(right.executedAt).getTime()
  )
}

function byExecutedAtDescending(
  left: TradingOperationRead,
  right: TradingOperationRead,
): number {
  return (
    new Date(right.executedAt).getTime() - new Date(left.executedAt).getTime()
  )
}
