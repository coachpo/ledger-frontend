const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1"
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
).replace(/\/$/, "")

export interface ApiErrorDetail {
  field?: string
  issue: string
  row?: number
  missing?: string[]
  unexpected?: string[]
  [key: string]: unknown
}

interface ApiErrorEnvelope {
  code: string
  message: string
  details: ApiErrorDetail[]
}

export class ApiRequestError extends Error {
  status: number
  code: string
  details: ApiErrorDetail[]

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[]) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = code
    this.details = details
  }
}

export type TradingSide = "BUY" | "SELL" | "DIVIDEND" | "SPLIT"
export type MarketHistoryRange = "1mo" | "3mo" | "ytd" | "1y" | "max"

export interface PortfolioRead {
  id: string
  name: string
  description: string | null
  baseCurrency: string
  positionCount: number
  balanceCount: number
  createdAt: string
  updatedAt: string
}

export interface PortfolioWriteInput {
  name: string
  description: string | null
  baseCurrency: string
}

export interface PortfolioUpdateInput {
  name?: string
  description?: string | null
}

export interface BalanceRead {
  id: string
  portfolioId: string
  label: string
  amount: string
  currency: string
  createdAt: string
  updatedAt: string
}

export interface BalanceWriteInput {
  label: string
  amount: string
}

export interface PositionRead {
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

export interface PositionWriteInput {
  symbol: string
  name: string | null
  quantity: string
  averageCost: string
}

export interface PositionUpdateInput {
  name?: string | null
  quantity?: string
  averageCost?: string
}

export interface CsvAcceptedRow {
  row: number
  symbol: string
  quantity: string
  averageCost: string
  name: string | null
}

export interface CsvRowError {
  row: number
  field: string
  issue: string
}

export interface CsvPreviewRead {
  fileName: string
  mode: string
  acceptedRows: CsvAcceptedRow[]
  errors: CsvRowError[]
}

export interface CsvCommitRead {
  fileName: string
  mode: string
  inserted: number
  updated: number
  unchanged: number
  errors: CsvRowError[]
}

export interface TradingOperationRead {
  id: string
  portfolioId: string
  balanceId: string | null
  balanceLabel: string
  symbol: string
  side: TradingSide
  quantity: string | null
  price: string | null
  commission: string
  dividendAmount: string | null
  splitRatio: string | null
  currency: string
  executedAt: string
  createdAt: string
}

export interface PositionCompactRead {
  symbol: string
  quantity: string
  averageCost: string
  currency: string
}

export interface BalanceCompactRead {
  id: string
  label: string
  amount: string
  currency: string
}

export interface TradingOperationResult {
  operation: TradingOperationRead
  updatedPosition: PositionCompactRead | null
  updatedBalance: BalanceCompactRead
}

// Base interface for all trading operations
interface TradingOperationBaseInput {
  balanceId: string
  symbol: string
  executedAt: string
}
// BUY operation
export interface BuyOperationInput extends TradingOperationBaseInput {
  side: "BUY"
  quantity: string
  price: string
  commission: string
}
// SELL operation
export interface SellOperationInput extends TradingOperationBaseInput {
  side: "SELL"
  quantity: string
  price: string
  commission: string
}
// DIVIDEND operation
export interface DividendOperationInput extends TradingOperationBaseInput {
  side: "DIVIDEND"
  dividendAmount: string
  commission?: string
}
// SPLIT operation
export interface SplitOperationInput extends TradingOperationBaseInput {
  side: "SPLIT"
  splitRatio: string
}
// Discriminated union for all operation types
export type TradingOperationInput =
  | BuyOperationInput
  | SellOperationInput
  | DividendOperationInput
  | SplitOperationInput

export interface MarketQuoteRead {
  symbol: string
  price: string
  previousClose?: string | null
  currency: string
  provider: string
  asOf: string | null
  isStale: boolean
}

export interface MarketQuoteListRead {
  quotes: MarketQuoteRead[]
  warnings: string[]
}

export interface MarketHistoryPointRead {
  at: string
  close: string
}

export interface MarketHistorySeriesRead {
  symbol: string
  currency: string | null
  provider: string
  points: MarketHistoryPointRead[]
}

export interface MarketHistoryRead {
  range: MarketHistoryRange
  interval: string
  series: MarketHistorySeriesRead[]
  warnings: string[]
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<ApiErrorEnvelope>
  return (
    typeof candidate.code === "string" &&
    typeof candidate.message === "string" &&
    Array.isArray(candidate.details)
  )
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const text = await response.text()
  if (!text) {
    return undefined
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return JSON.parse(text) as unknown
  }

  return text
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")

  if (!(init.body instanceof FormData) && init.body !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    const fallbackMessage = response.statusText || "Request failed"
    if (isApiErrorEnvelope(payload)) {
      throw new ApiRequestError(
        response.status,
        payload.code,
        payload.message,
        payload.details,
      )
    }

    throw new ApiRequestError(response.status, "request_failed", fallbackMessage, [])
  }

  return payload as T
}

export const api = {
  listPortfolios: () => request<PortfolioRead[]>("/portfolios"),
  getPortfolio: (portfolioId: string) =>
    request<PortfolioRead>(`/portfolios/${portfolioId}`),
  createPortfolio: (input: PortfolioWriteInput) =>
    request<PortfolioRead>("/portfolios", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updatePortfolio: (portfolioId: string, input: PortfolioUpdateInput) =>
    request<PortfolioRead>(`/portfolios/${portfolioId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deletePortfolio: (portfolioId: string) =>
    request<void>(`/portfolios/${portfolioId}`, { method: "DELETE" }),

  listBalances: (portfolioId: string) =>
    request<BalanceRead[]>(`/portfolios/${portfolioId}/balances`),
  createBalance: (portfolioId: string, input: BalanceWriteInput) =>
    request<BalanceRead>(`/portfolios/${portfolioId}/balances`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateBalance: (
    portfolioId: string,
    balanceId: string,
    input: Partial<BalanceWriteInput>,
  ) =>
    request<BalanceRead>(`/portfolios/${portfolioId}/balances/${balanceId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteBalance: (portfolioId: string, balanceId: string) =>
    request<void>(`/portfolios/${portfolioId}/balances/${balanceId}`, {
      method: "DELETE",
    }),

  listPositions: (portfolioId: string) =>
    request<PositionRead[]>(`/portfolios/${portfolioId}/positions`),
  createPosition: (portfolioId: string, input: PositionWriteInput) =>
    request<PositionRead>(`/portfolios/${portfolioId}/positions`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updatePosition: (
    portfolioId: string,
    positionId: string,
    input: PositionUpdateInput,
  ) =>
    request<PositionRead>(`/portfolios/${portfolioId}/positions/${positionId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deletePosition: (portfolioId: string, positionId: string) =>
    request<void>(`/portfolios/${portfolioId}/positions/${positionId}`, {
      method: "DELETE",
    }),

  previewPositionImport: async (portfolioId: string, file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    return request<CsvPreviewRead>(
      `/portfolios/${portfolioId}/positions/imports/preview`,
      {
        method: "POST",
        body: formData,
      },
    )
  },
  commitPositionImport: async (portfolioId: string, file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    return request<CsvCommitRead>(
      `/portfolios/${portfolioId}/positions/imports/commit`,
      {
        method: "POST",
        body: formData,
      },
    )
  },

  listTradingOperations: (portfolioId: string) =>
    request<TradingOperationRead[]>(`/portfolios/${portfolioId}/trading-operations`),
  createTradingOperation: (portfolioId: string, input: TradingOperationInput) =>
    request<TradingOperationResult>(
      `/portfolios/${portfolioId}/trading-operations`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    ),

  getMarketQuotes: (portfolioId: string, symbols: string[]) =>
    request<MarketQuoteListRead>(
      `/portfolios/${portfolioId}/market-data/quotes?symbols=${encodeURIComponent(
        symbols.join(","),
      )}`,
    ),
  getMarketHistory: (
    portfolioId: string,
    symbols: string[],
    range: MarketHistoryRange,
  ) =>
    request<MarketHistoryRead>(
      `/portfolios/${portfolioId}/market-data/history?symbols=${encodeURIComponent(
        symbols.join(","),
      )}&range=${encodeURIComponent(range)}`,
    ),
}
