export type PortfolioSummary = {
  id: string
  name: string
  description: string | null
  baseCurrency: string
  positionCount: number
  balanceCount: number
  createdAt: string
  updatedAt: string
}

export type PortfolioPayload = {
  name: string
  description: string | null
  baseCurrency: string
}

export type PortfolioUpdatePayload = {
  name?: string
  description?: string | null
}

export type BalanceRecord = {
  id: string
  portfolioId: string
  label: string
  amount: string
  currency: string
  createdAt: string
  updatedAt: string
}

export type BalanceCompact = {
  id: string
  label: string
  amount: string
  currency: string
}

export type BalancePayload = {
  label: string
  amount: string
}

export type PositionRecord = {
  id: string
  portfolioId: string
  symbol: string
  name: string | null
  quantity: string
  averageCost: string
  currency: string
  createdAt: string
  updatedAt: string
}

export type PositionCompact = {
  symbol: string
  quantity: string
  averageCost: string
  currency: string
}

export type PositionPayload = {
  symbol: string
  name: string | null
  quantity: string
  averageCost: string
}

export type PositionUpdatePayload = {
  name?: string | null
  quantity?: string
  averageCost?: string
}

export type CsvAcceptedRow = {
  row: number
  symbol: string
  quantity: string
  averageCost: string
  name: string | null
}

export type CsvRowError = {
  row: number
  field: string
  issue: string
}

export type CsvPreviewResponse = {
  fileName: string
  mode: string
  acceptedRows: CsvAcceptedRow[]
  errors: CsvRowError[]
}

export type CsvCommitResponse = {
  fileName: string
  mode: string
  inserted: number
  updated: number
  unchanged: number
  errors: CsvRowError[]
}

export type TradingOperation = {
  id: string
  portfolioId: string
  balanceId: string | null
  balanceLabel: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: string
  price: string
  commission: string
  currency: string
  executedAt: string
  createdAt: string
}

export type TradingOperationPayload = {
  balanceId: string
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: string
  price: string
  commission: string
  executedAt: string
}

export type TradingOperationResult = {
  operation: TradingOperation
  updatedPosition: PositionCompact | null
  updatedBalance: BalanceCompact
}

export type MarketQuote = {
  symbol: string
  price: string
  currency: string
  provider: string
  asOf: string | null
  isStale: boolean
}

export type MarketQuoteResponse = {
  quotes: MarketQuote[]
  warnings: string[]
}

export type ApiErrorDetail = Record<string, string | number | boolean | null | string[]>

export type ApiErrorEnvelope = {
  code: string
  message: string
  details: ApiErrorDetail[]
}
