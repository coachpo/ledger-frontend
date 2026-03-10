import axios from 'axios'

export type ValueDescriptor = {
  value: string | null
  currency: string | null
  source: string
}

export type Holding = {
  symbol: string
  instrument_name: string | null
  quantity: string
  current_price: ValueDescriptor
  market_value: ValueDescriptor
  cost_basis: ValueDescriptor
  average_purchase_price: ValueDescriptor
  realized_pl: ValueDescriptor
  unrealized_pl: ValueDescriptor
  total_pl: ValueDescriptor
  unrealized_pl_percent: string | null
  portfolio_weight: string | null
  currency: string | null
  last_market_data_update: string | null
  technical_snapshot: {
    source: string
    state: string
    values: Record<string, unknown>
  }
  broker_reported: Record<string, string | null>
}

export type HoldingDetail = {
  holding: Holding
  trades: Array<{
    id: number
    side: string | null
    effective_at: string | null
    effective_date: string
    quantity: string | null
    price: string | null
    proceeds: string | null
    fee: string | null
    code: string | null
  }>
}

export type AccountSummary = {
  cash_balance: ValueDescriptor
  net_asset_value: ValueDescriptor
  market_value_positions: ValueDescriptor
  realized_pl: ValueDescriptor
  unrealized_pl: ValueDescriptor
  total_deposits: ValueDescriptor
  total_withdrawals: ValueDescriptor
  fees_and_commissions: ValueDescriptor
  interest: ValueDescriptor
  base_currency: string | null
  metadata: Record<string, unknown>
}

export type ActivityItem = {
  id: number
  event_type: string
  side: string | null
  symbol: string | null
  currency: string | null
  effective_at: string | null
  effective_date: string
  quantity: string | null
  unit_price: string | null
  amount: string | null
  proceeds: string | null
  fee: string | null
  description: string | null
  code: string | null
  source_section: string
}

export type DashboardData = {
  portfolio_value_over_time: Array<{ date: string | null; value: string | null }>
  cash_vs_invested: Array<{ date: string | null; cash: string | null; invested: string | null }>
  realized_vs_unrealized: Array<{ label: string; value: string | null }>
  deposits_and_withdrawals: Array<{ date: string; deposits: string | null; withdrawals: string | null }>
  current_allocation: Array<{ symbol: string; market_value: string | null; weight: string | null }>
  recent_activity: ActivityItem[]
  chart_availability: Record<string, boolean>
}

export type ChartPayload = {
  symbol: string
  source: string
  available: boolean
  reason: string | null
  bars: Array<{
    timestamp: number
    open: string
    high: string
    low: string
    close: string
    volume: string | null
  }>
  markers: Array<{
    id: number
    side: string
    timestamp: number
    price: string | null
    quantity: string | null
    fee: string | null
    text: string
  }>
}

export type IndicatorPayload = {
  symbol: string
  source: string
  values: {
    source: string
    state: string
    values: Record<string, unknown>
  }
}

export type ImportBatch = {
  id: number
  account_id: string | null
  statement_title: string | null
  period_start: string | null
  period_end: string | null
  generated_at: string | null
  base_currency: string | null
  account_type: string | null
  overlap_detected: boolean
  status: string
  warnings_json: string[]
  error_message: string | null
  imported_event_count: number
  imported_snapshot_count: number
}

export type SimulationRequest = {
  name: string
  canonical_event_id: number
  action: 'skip' | 'modify'
  override_effective_at: string | null
  override_quantity: string | null
  override_price: string | null
  cost_basis_method: 'FIFO' | 'AVERAGE_COST'
  slippage_mode: 'fixed' | 'basis_points' | 'disabled'
  slippage_value: string
}

export type SimulationResponse = {
  scenario_id: number
  name: string
  result: {
    symbol: string
    base_currency: string | null
    actual: Record<string, string>
    hypothetical: Record<string, string>
    delta: Record<string, string>
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
})

export const getAccountSummary = async () => {
  const response = await api.get<AccountSummary>('/account/summary')
  return response.data
}

export const getDashboard = async () => {
  const response = await api.get<DashboardData>('/dashboard')
  return response.data
}

export const getHoldings = async () => {
  const response = await api.get<Holding[]>('/holdings')
  return response.data
}

export const getHoldingDetail = async (symbol: string) => {
  const response = await api.get<HoldingDetail>(`/holdings/${symbol}`)
  return response.data
}

export const getActivity = async (params?: Record<string, string>) => {
  const response = await api.get<{ items: ActivityItem[] }>('/activity', { params })
  return response.data.items
}

export const getChart = async (symbol: string) => {
  const response = await api.get<ChartPayload>(`/chart/${symbol}`)
  return response.data
}

export const getIndicators = async (symbol: string) => {
  const response = await api.get<IndicatorPayload>(`/indicators/${symbol}`)
  return response.data
}

export const getImports = async () => {
  const response = await api.get<{ items: ImportBatch[] }>('/imports')
  return response.data.items
}

export const uploadImport = async (file: File) => {
  const payload = new FormData()
  payload.append('file', file)
  const response = await api.post<ImportBatch>('/imports', payload)
  return response.data
}

export const createSimulation = async (request: SimulationRequest) => {
  const response = await api.post<SimulationResponse>('/simulations', request)
  return response.data
}
