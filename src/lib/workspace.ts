import type {
  BalanceRead,
  MarketQuoteRead,
  PortfolioRead,
  PositionRead,
  TradingOperationRead,
} from "@/lib/api"
import { decimalToNumber } from "@/lib/format"

export interface AllocationRow {
  symbol: string
  quantity: number
  averageCost: number
  costBasis: number
  currentValue: number
  quotePrice: number | null
  hasQuote: boolean
}

export interface WorkspaceMetrics {
  cashTotal: number
  costBasisTotal: number
  indicativeValueTotal: number
  balanceCount: number
  positionCount: number
  operationsCount: number
  quoteCoverage: number
  warningCount: number
  allocationRows: AllocationRow[]
}

export function sortPortfolios(portfolios: PortfolioRead[]): PortfolioRead[] {
  return [...portfolios].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )
}

export function sortBalances(balances: BalanceRead[]): BalanceRead[] {
  return [...balances].sort((left, right) =>
    left.label.localeCompare(right.label),
  )
}

export function sortPositions(positions: PositionRead[]): PositionRead[] {
  return [...positions].sort((left, right) =>
    left.symbol.localeCompare(right.symbol),
  )
}

export function sortOperations(
  operations: TradingOperationRead[],
): TradingOperationRead[] {
  return [...operations].sort(
    (left, right) =>
      new Date(right.executedAt).getTime() - new Date(left.executedAt).getTime(),
  )
}

export function buildWorkspaceMetrics({
  balances,
  positions,
  quotes,
  warnings,
  operations,
}: {
  balances: BalanceRead[]
  positions: PositionRead[]
  quotes: MarketQuoteRead[]
  warnings: string[]
  operations: TradingOperationRead[]
}): WorkspaceMetrics {
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]))

  const cashTotal = balances.reduce(
    (total, balance) => total + decimalToNumber(balance.amount),
    0,
  )

  const allocationRows = positions
    .map((position) => {
      const quantity = decimalToNumber(position.quantity)
      const averageCost = decimalToNumber(position.averageCost)
      const costBasis = quantity * averageCost
      const quote = quoteMap.get(position.symbol)
      const quotePrice = quote ? decimalToNumber(quote.price) : null
      const currentValue =
        quotePrice !== null ? quantity * quotePrice : costBasis

      return {
        symbol: position.symbol,
        quantity,
        averageCost,
        costBasis,
        currentValue,
        quotePrice,
        hasQuote: Boolean(quote),
      }
    })
    .sort((left, right) => right.currentValue - left.currentValue)

  const costBasisTotal = allocationRows.reduce(
    (total, row) => total + row.costBasis,
    0,
  )
  const indicativeValueTotal = allocationRows.reduce(
    (total, row) => total + row.currentValue,
    0,
  )
  const quotedPositions = allocationRows.filter((row) => row.hasQuote).length

  return {
    cashTotal,
    costBasisTotal,
    indicativeValueTotal,
    balanceCount: balances.length,
    positionCount: positions.length,
    operationsCount: operations.length,
    quoteCoverage:
      positions.length === 0 ? 0 : quotedPositions / positions.length,
    warningCount: warnings.length,
    allocationRows,
  }
}
