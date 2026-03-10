import type {
  ApiErrorEnvelope,
  BalancePayload,
  BalanceRecord,
  CsvCommitResponse,
  CsvPreviewResponse,
  MarketQuoteResponse,
  PortfolioPayload,
  PortfolioSummary,
  PortfolioUpdatePayload,
  PositionPayload,
  PositionRecord,
  PositionUpdatePayload,
  TradingOperation,
  TradingOperationPayload,
  TradingOperationResult,
} from '../types/api'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '')

export class ApiClientError extends Error {
  code: string
  details: ApiErrorEnvelope['details']
  status: number

  constructor(status: number, payload: ApiErrorEnvelope) {
    super(payload.message)
    this.name = 'ApiClientError'
    this.code = payload.code
    this.details = payload.details
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (!(init?.body instanceof FormData) && init?.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json()) as T | ApiErrorEnvelope

  if (!response.ok) {
    throw new ApiClientError(response.status, payload as ApiErrorEnvelope)
  }

  return payload as T
}

function createFilePayload(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export const api = {
  listPortfolios: () => request<PortfolioSummary[]>('/portfolios'),
  getPortfolio: (portfolioId: string) => request<PortfolioSummary>(`/portfolios/${portfolioId}`),
  createPortfolio: (payload: PortfolioPayload) =>
    request<PortfolioSummary>('/portfolios', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePortfolio: (portfolioId: string, payload: PortfolioUpdatePayload) =>
    request<PortfolioSummary>(`/portfolios/${portfolioId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePortfolio: (portfolioId: string) =>
    request<void>(`/portfolios/${portfolioId}`, { method: 'DELETE' }),

  listBalances: (portfolioId: string) => request<BalanceRecord[]>(`/portfolios/${portfolioId}/balances`),
  createBalance: (portfolioId: string, payload: BalancePayload) =>
    request<BalanceRecord>(`/portfolios/${portfolioId}/balances`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBalance: (portfolioId: string, balanceId: string, payload: Partial<BalancePayload>) =>
    request<BalanceRecord>(`/portfolios/${portfolioId}/balances/${balanceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteBalance: (portfolioId: string, balanceId: string) =>
    request<void>(`/portfolios/${portfolioId}/balances/${balanceId}`, { method: 'DELETE' }),

  listPositions: (portfolioId: string) => request<PositionRecord[]>(`/portfolios/${portfolioId}/positions`),
  createPosition: (portfolioId: string, payload: PositionPayload) =>
    request<PositionRecord>(`/portfolios/${portfolioId}/positions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePosition: (portfolioId: string, positionId: string, payload: PositionUpdatePayload) =>
    request<PositionRecord>(`/portfolios/${portfolioId}/positions/${positionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePosition: (portfolioId: string, positionId: string) =>
    request<void>(`/portfolios/${portfolioId}/positions/${positionId}`, { method: 'DELETE' }),
  previewImport: (portfolioId: string, file: File) =>
    request<CsvPreviewResponse>(`/portfolios/${portfolioId}/positions/imports/preview`, {
      method: 'POST',
      body: createFilePayload(file),
    }),
  commitImport: (portfolioId: string, file: File) =>
    request<CsvCommitResponse>(`/portfolios/${portfolioId}/positions/imports/commit`, {
      method: 'POST',
      body: createFilePayload(file),
    }),

  listTradingOperations: (portfolioId: string) =>
    request<TradingOperation[]>(`/portfolios/${portfolioId}/trading-operations`),
  createTradingOperation: (portfolioId: string, payload: TradingOperationPayload) =>
    request<TradingOperationResult>(`/portfolios/${portfolioId}/trading-operations`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getQuotes: (portfolioId: string, symbols: string[]) =>
    request<MarketQuoteResponse>(
      `/portfolios/${portfolioId}/market-data/quotes?symbols=${encodeURIComponent(symbols.join(','))}`,
    ),
}

export function toErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const firstDetail = error.details[0]
    const detailText = firstDetail
      ? Object.entries(firstDetail)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(', ')
      : ''
    return detailText ? `${error.message} (${detailText})` : error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
