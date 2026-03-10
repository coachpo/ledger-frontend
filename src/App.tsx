import { useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  CandlestickChart,
  CircleAlert,
  Compass,
  Database,
  FolderUp,
  LayoutDashboard,
  Radar,
  Sparkles,
} from 'lucide-react'
import { Link, NavLink, Route, Routes, useParams } from 'react-router-dom'

import { ChartPanel } from './components/ChartPanel'
import {
  createSimulation,
  getAccountSummary,
  getActivity,
  getChart,
  getDashboard,
  getHoldingDetail,
  getHoldings,
  getImports,
  getIndicators,
  uploadImport,
  type ActivityItem,
  type ChartPayload,
  type ImportBatch,
  type SimulationRequest,
  type SimulationResponse,
  type ValueDescriptor,
} from './lib/api'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/imports', label: 'Imports', icon: FolderUp },
  { to: '/holdings', label: 'Holdings', icon: CandlestickChart },
  { to: '/activity', label: 'Activity', icon: Activity },
  { to: '/simulations', label: 'Simulation Lab', icon: Compass },
]

const indicatorOptions = [
  { label: 'MA', value: 'MA' as const },
  { label: 'EMA', value: 'EMA' as const },
  { label: 'MACD', value: 'MACD' as const },
  { label: 'BOLL', value: 'BOLL' as const },
]

function App() {
  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />
      <header className="topbar">
        <Link to="/" className="brandmark">
          <div className="brandmark-icon">
            <Radar size={18} />
          </div>
          <div>
            <span className="eyebrow">Ledger command desk</span>
            <strong>Portfolio Control Deck</strong>
          </div>
        </Link>
        <nav className="topnav" aria-label="Primary">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-pill${isActive ? ' active' : ''}`}>
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </header>
      <main className="content-shell">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/imports" element={<ImportsPage />} />
          <Route path="/holdings" element={<HoldingsPage />} />
          <Route path="/holdings/:symbol" element={<HoldingDetailPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/simulations" element={<SimulationPage />} />
        </Routes>
      </main>
    </div>
  )
}

function DashboardPage() {
  const summaryQuery = useQuery({ queryKey: ['account-summary'], queryFn: getAccountSummary })
  const dashboardQuery = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })
  const holdingsQuery = useQuery({ queryKey: ['holdings'], queryFn: getHoldings })

  const isLoading = summaryQuery.isLoading || dashboardQuery.isLoading || holdingsQuery.isLoading
  const isError = summaryQuery.isError || dashboardQuery.isError || holdingsQuery.isError

  if (isLoading) {
    return <PageSkeleton title="Assembling command deck" />
  }

  if (isError || !summaryQuery.data || !dashboardQuery.data || !holdingsQuery.data) {
    return <ErrorPanel title="Dashboard unavailable" description="Start the backend or review the API connection state to hydrate the portfolio cockpit." />
  }

  const summary = summaryQuery.data
  const dashboard = dashboardQuery.data
  const holdings = holdingsQuery.data

  return (
    <PageFrame
      eyebrow="Single-account intelligence"
      title="Portfolio command surface"
      description="Imported broker truth, estimated chart context, and simulation-ready trade intelligence in one dense control room."
    >
      <motion.section className="hero-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="hero-card hero-primary">
          <span className="eyebrow">Live posture</span>
          <h2>High-context monitoring for a single IBKR account.</h2>
          <p>
            This deck separates imported values from derived analytics and estimated chart context so every number retains provenance.
          </p>
          <div className="hero-badges">
            <SourceBadge source={summary.net_asset_value.source} />
            <SourceBadge source={summary.realized_pl.source} />
            <SourceBadge source={holdings[0]?.technical_snapshot.source ?? 'unavailable'} />
          </div>
        </div>
        <div className="metric-grid">
          <MetricCard label="Net asset value" descriptor={summary.net_asset_value} accent="positive" />
          <MetricCard label="Cash balance" descriptor={summary.cash_balance} accent="neutral" />
          <MetricCard label="Realized P/L" descriptor={summary.realized_pl} accent="positive" />
          <MetricCard label="Unrealized P/L" descriptor={summary.unrealized_pl} accent="warning" />
        </div>
      </motion.section>

      <section className="dashboard-grid analytics-grid">
        <Card title="Portfolio value" kicker="Value over time">
          <SeriesChart
            series={[
              {
                key: 'value',
                label: 'NAV',
                color: '#68f3c1',
              },
            ]}
            points={dashboard.portfolio_value_over_time}
            emptyLabel="Import at least one completed statement to render portfolio history."
          />
        </Card>

        <Card title="Cash vs invested" kicker="Capital split">
          <SeriesChart
            series={[
              { key: 'cash', label: 'Cash', color: '#68f3c1' },
              { key: 'invested', label: 'Invested', color: '#ffb648' },
            ]}
            points={dashboard.cash_vs_invested}
            emptyLabel="Cash and invested history will appear after import."
          />
        </Card>

        <Card title="Realized vs unrealized" kicker="Current P/L mix">
          <HorizontalBars
            items={dashboard.realized_vs_unrealized.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            emptyLabel="P/L bars are unavailable until holdings are derived."
          />
        </Card>

        <Card title="Deposits and withdrawals" kicker="Cash flow cadence">
          <HorizontalBars
            items={dashboard.deposits_and_withdrawals.flatMap((item) => [
              { label: `${item.date} deposits`, value: item.deposits },
              { label: `${item.date} withdrawals`, value: item.withdrawals },
            ])}
            emptyLabel="No cash movement events are available for this range."
          />
        </Card>
      </section>

      <section className="dashboard-grid">
        <Card title="Capital mix" kicker="Current allocation">
          <div className="allocation-list">
            {dashboard.current_allocation.slice(0, 6).map((item) => (
              <div key={item.symbol} className="allocation-row">
                <div>
                  <strong>{item.symbol}</strong>
                  <span>{formatPercent(item.weight)}</span>
                </div>
                <span>{formatNumeric(item.market_value)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Recent activity" kicker="Canonical events">
          <div className="activity-stack">
            {dashboard.recent_activity.slice(0, 6).map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </Card>

        <Card title="Holdings watchlist" kicker="Top exposures">
          <div className="watchlist-grid">
            {holdings.slice(0, 4).map((holding) => (
              <Link key={holding.symbol} to={`/holdings/${holding.symbol}`} className="watch-card">
                <div>
                  <strong>{holding.symbol}</strong>
                  <span>{holding.instrument_name ?? 'Imported instrument'}</span>
                </div>
                <div>
                  <span>{formatMoneyDescriptor(holding.market_value)}</span>
                  <SourceBadge source={holding.market_value.source} compact />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Reality check" kicker="Value provenance">
          <ul className="signal-list">
            <li>
              <Sparkles size={16} />
              <span>Imported snapshots drive holdings and account metrics.</span>
            </li>
            <li>
              <Database size={16} />
              <span>Derived cost-basis and simulation math stay visually separated from broker-reported totals.</span>
            </li>
            <li>
              <CircleAlert size={16} />
              <span>KLineCharts runs on statement-derived estimated bars unless a richer feed is approved later.</span>
            </li>
          </ul>
        </Card>
      </section>
    </PageFrame>
  )
}

function ImportsPage() {
  const queryClient = useQueryClient()
  const importsQuery = useQuery({ queryKey: ['imports'], queryFn: getImports })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const uploadMutation = useMutation({
    mutationFn: uploadImport,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['imports'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['holdings'] }),
        queryClient.invalidateQueries({ queryKey: ['activity'] }),
      ])
      setSelectedFile(null)
    },
  })

  return (
    <PageFrame
      eyebrow="Statement ingestion"
      title="Import broker statements"
      description="Upload IBKR CSV files, preserve raw payloads, and inspect overlap warnings before they contaminate downstream analytics."
    >
      <section className="dashboard-grid imports-grid">
        <Card title="Drop zone" kicker="Raw file preservation">
          <label className="upload-dropzone">
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <FolderUp size={20} />
            <strong>{selectedFile?.name ?? 'Choose an IBKR statement CSV'}</strong>
            <span>The backend will preserve the raw payload and deduplicate canonical events during import.</span>
          </label>
          <button
            className="action-button"
            type="button"
            disabled={!selectedFile || uploadMutation.isPending}
            onClick={() => {
              if (selectedFile) {
                uploadMutation.mutate(selectedFile)
              }
            }}
          >
            {uploadMutation.isPending ? 'Importing…' : 'Ingest statement'}
          </button>
          {uploadMutation.data ? (
            <div className="inline-feedback success">
              <strong>Batch #{uploadMutation.data.id}</strong>
              <span>{uploadMutation.data.status}</span>
            </div>
          ) : null}
          {uploadMutation.isError ? (
            <div className="inline-feedback danger">Upload failed. Confirm the backend is reachable.</div>
          ) : null}
        </Card>

        <Card title="Recent batches" kicker="Import ledger">
          {importsQuery.isLoading ? (
            <LoadingRows rows={5} />
          ) : importsQuery.isError || !importsQuery.data ? (
            <ErrorPanel compact title="Import history unavailable" description="The import index could not be loaded from the backend." />
          ) : (
            <div className="batch-stack">
              {importsQuery.data.map((batch) => (
                <ImportBatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          )}
        </Card>
      </section>
    </PageFrame>
  )
}

function HoldingsPage() {
  const holdingsQuery = useQuery({ queryKey: ['holdings'], queryFn: getHoldings })
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'market_value' | 'symbol' | 'total_pl' | 'weight'>(
    'market_value',
  )

  const visibleHoldings =
    holdingsQuery.data
      ?.filter((holding) => {
        const query = search.trim().toLowerCase()
        if (!query) {
          return true
        }
        return (
          holding.symbol.toLowerCase().includes(query) ||
          (holding.instrument_name ?? '').toLowerCase().includes(query)
        )
      })
      .sort((left, right) => {
        if (sortKey === 'symbol') {
          return left.symbol.localeCompare(right.symbol)
        }
        if (sortKey === 'total_pl') {
          return numericValue(right.total_pl.value) - numericValue(left.total_pl.value)
        }
        if (sortKey === 'weight') {
          return numericValue(right.portfolio_weight) - numericValue(left.portfolio_weight)
        }
        return numericValue(right.market_value.value) - numericValue(left.market_value.value)
      }) ?? []

  return (
    <PageFrame
      eyebrow="Current book"
      title="Holdings intelligence"
      description="Review imported market values, derived cost basis, and technical posture before drilling into chart-level context."
    >
      <Card title="Open holdings" kicker="Searchable and sortable">
        {holdingsQuery.isLoading ? (
          <LoadingRows rows={8} />
        ) : holdingsQuery.isError || !holdingsQuery.data ? (
          <ErrorPanel compact title="Holdings unavailable" description="The holdings endpoint did not respond. Start the backend or inspect your API base URL." />
        ) : (
          <div className="table-shell">
            <div className="filter-row">
              <label>
                <span>Search holdings</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Symbol or instrument name"
                />
              </label>
              <label>
                <span>Sort by</span>
                <select
                  value={sortKey}
                  onChange={(event) =>
                    setSortKey(
                      event.target.value as 'market_value' | 'symbol' | 'total_pl' | 'weight',
                    )
                  }
                >
                  <option value="market_value">Market value</option>
                  <option value="total_pl">Total P/L</option>
                  <option value="weight">Portfolio weight</option>
                  <option value="symbol">Symbol</option>
                </select>
              </label>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Quantity</th>
                  <th>Market value</th>
                  <th>Cost basis</th>
                  <th>Total P/L</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {visibleHoldings.map((holding) => (
                  <tr key={holding.symbol}>
                    <td>
                      <Link to={`/holdings/${holding.symbol}`} className="table-link">
                        <strong>{holding.symbol}</strong>
                        <span>{holding.instrument_name ?? 'Imported instrument'}</span>
                      </Link>
                    </td>
                    <td>{holding.quantity}</td>
                    <td>
                      <span>{formatMoneyDescriptor(holding.market_value)}</span>
                      <SourceBadge source={holding.market_value.source} compact />
                    </td>
                    <td>{formatMoneyDescriptor(holding.cost_basis)}</td>
                    <td className={positiveClass(holding.total_pl.value)}>{formatMoneyDescriptor(holding.total_pl)}</td>
                    <td>{formatPercent(holding.portfolio_weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleHoldings.length === 0 ? (
              <div className="inline-feedback">No holdings matched the current search.</div>
            ) : null}
          </div>
        )}
      </Card>
    </PageFrame>
  )
}

function HoldingDetailPage() {
  const { symbol = '' } = useParams()
  const [indicators, setIndicators] = useState<Array<'MA' | 'EMA' | 'MACD' | 'BOLL'>>(['MA', 'EMA', 'MACD'])

  const detailQuery = useQuery({ queryKey: ['holding-detail', symbol], queryFn: () => getHoldingDetail(symbol), enabled: Boolean(symbol) })
  const chartQuery = useQuery({ queryKey: ['chart', symbol], queryFn: () => getChart(symbol), enabled: Boolean(symbol) })
  const indicatorQuery = useQuery({ queryKey: ['indicators', symbol], queryFn: () => getIndicators(symbol), enabled: Boolean(symbol) })

  if (detailQuery.isLoading || chartQuery.isLoading || indicatorQuery.isLoading) {
    return <PageSkeleton title="Rendering detail view" />
  }

  if (detailQuery.isError || chartQuery.isError || indicatorQuery.isError || !detailQuery.data || !chartQuery.data || !indicatorQuery.data) {
    return <ErrorPanel title="Holding detail unavailable" description="The detail, chart, or indicator endpoint could not be resolved for this symbol." />
  }

  const detail = detailQuery.data
  const chart = chartQuery.data
  const indicatorData = indicatorQuery.data
  const indicatorSnapshot = indicatorData.values.values

  return (
    <PageFrame
      eyebrow="Holding focus"
      title={`${detail.holding.symbol} control view`}
      description="Trade markers, estimated bars, and technical posture stay adjacent so every decision keeps accounting context attached."
    >
      <section className="hero-grid detail-grid">
        <div className="hero-card detail-summary">
          <span className="eyebrow">Value provenance</span>
          <h2>{detail.holding.instrument_name ?? detail.holding.symbol}</h2>
          <div className="hero-metrics-inline">
            <div>
              <span>Market value</span>
              <strong>{formatMoneyDescriptor(detail.holding.market_value)}</strong>
            </div>
            <div>
              <span>Total P/L</span>
              <strong className={positiveClass(detail.holding.total_pl.value)}>
                {formatMoneyDescriptor(detail.holding.total_pl)}
              </strong>
            </div>
            <div>
              <span>Quantity</span>
              <strong>{detail.holding.quantity}</strong>
            </div>
          </div>
          <div className="hero-badges">
            <SourceBadge source={detail.holding.market_value.source} />
            <SourceBadge source={chart.source} />
            <SourceBadge source={indicatorData.source} />
          </div>
        </div>
        <Card title="Indicator stack" kicker="Configurable context">
          <div className="inline-feedback warning-feedback">
            Prototype charting is still in place here. The SRS requires a licensed TradingView integration, so these controls only cover the current fallback chart layer.
          </div>
          <div className="indicator-toggle-row">
            {indicatorOptions.map((indicator) => (
              <button
                key={indicator.value}
                type="button"
                className={`indicator-chip${indicators.includes(indicator.value) ? ' active' : ''}`}
                onClick={() => {
                  setIndicators((current) =>
                    current.includes(indicator.value)
                      ? current.filter((item) => item !== indicator.value)
                      : [...current, indicator.value],
                  )
                }}
              >
                {indicator.label}
              </button>
            ))}
          </div>
          <div className="indicator-grid">
            {Object.entries(indicatorSnapshot).slice(0, 8).map(([key, value]) => (
              <div key={key} className="indicator-card">
                <span>{key}</span>
                <strong>{formatUnknown(value)}</strong>
              </div>
            ))}
            <div className="indicator-card unavailable-card">
              <span>Ichimoku pane</span>
              <strong>{chart.available ? 'Snapshot only' : 'Unavailable'}</strong>
            </div>
          </div>
        </Card>
      </section>

      <section className="chart-layout">
        <Card title="Estimated chart feed" kicker="Prototype chart layer">
          <ChartPanel chartData={chart as ChartPayload} indicators={indicators} />
        </Card>
        <Card title="Trade ledger" kicker="Canonical trade events">
          <div className="activity-stack compact-stack">
            {detail.trades.map((trade) => (
              <div key={trade.id} className="trade-ticket">
                <div>
                  <strong>{trade.side?.toUpperCase() ?? 'TRADE'}</strong>
                  <span>{trade.effective_at ?? trade.effective_date}</span>
                </div>
                <div>
                  <span>{trade.quantity ?? '0'} @ {trade.price ?? '0'}</span>
                  <span>Fee {trade.fee ?? '0'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </PageFrame>
  )
}

function ActivityPage() {
  const [symbol, setSymbol] = useState('')
  const [eventType, setEventType] = useState('')
  const [sourceSection, setSourceSection] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const activityQuery = useQuery({
    queryKey: ['activity', symbol, eventType, sourceSection, startDate, endDate],
    queryFn: () =>
      getActivity({
        ...(symbol ? { symbol } : {}),
        ...(eventType ? { event_type: eventType } : {}),
        ...(sourceSection ? { source_section: sourceSection } : {}),
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {}),
      }),
  })

  return (
    <PageFrame
      eyebrow="Chronology"
      title="Activity timeline"
      description="Filter canonical events by symbol or event type without losing the source section behind every line item."
    >
      <Card title="Filters" kicker="Refine the event stream">
        <div className="filter-row">
          <label>
            <span>Symbol</span>
            <input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} placeholder="Filter by symbol" />
          </label>
          <label>
            <span>Event type</span>
            <select value={eventType} onChange={(event) => setEventType(event.target.value)}>
              <option value="">All event types</option>
              <option value="trade">Trade</option>
              <option value="cash">Cash</option>
              <option value="interest">Interest</option>
              <option value="lending">Lending</option>
            </select>
          </label>
        </div>
        <div className="filter-row filter-row-wide">
          <label>
            <span>Source section</span>
            <select value={sourceSection} onChange={(event) => setSourceSection(event.target.value)}>
              <option value="">All sections</option>
              <option value="Trades">Trades</option>
              <option value="Deposits & Withdrawals">Deposits & Withdrawals</option>
              <option value="Interest">Interest</option>
              <option value="Stock Yield Enhancement Program Securities Lent Activity">Lending activity</option>
            </select>
          </label>
          <label>
            <span>Start date</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            <span>End date</span>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>
      </Card>

      <Card title="Event stream" kicker="Most recent first">
        {activityQuery.isLoading ? (
          <LoadingRows rows={10} />
        ) : activityQuery.isError || !activityQuery.data ? (
          <ErrorPanel compact title="Activity unavailable" description="The activity endpoint did not return a usable timeline." />
        ) : (
          <div className="activity-stack">
            {activityQuery.data.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </Card>
    </PageFrame>
  )
}

function SimulationPage() {
  const tradesQuery = useQuery({ queryKey: ['activity', 'trades-only'], queryFn: () => getActivity({ event_type: 'trade' }) })
  const [selectedTradeId, setSelectedTradeId] = useState('')
  const [action, setAction] = useState<'skip' | 'modify'>('skip')
  const [overrideDate, setOverrideDate] = useState('')
  const [overrideQuantity, setOverrideQuantity] = useState('')
  const [overridePrice, setOverridePrice] = useState('')
  const [costBasisMethod, setCostBasisMethod] = useState<'FIFO' | 'AVERAGE_COST'>('FIFO')
  const [slippageMode, setSlippageMode] = useState<'fixed' | 'basis_points' | 'disabled'>(
    'basis_points',
  )
  const [slippageValue, setSlippageValue] = useState('5')

  const effectiveSelectedTradeId = selectedTradeId || (tradesQuery.data?.[0] ? String(tradesQuery.data[0].id) : '')

  const simulationMutation = useMutation({ mutationFn: createSimulation })
  const selectedTrade = useMemo(
    () => tradesQuery.data?.find((item) => item.id === Number(effectiveSelectedTradeId)) ?? null,
    [effectiveSelectedTradeId, tradesQuery.data],
  )

  const submitSimulation = () => {
    if (!effectiveSelectedTradeId) {
      return
    }
    const payload: SimulationRequest = {
      name: action === 'skip' ? 'Skip selected trade' : 'Modify selected trade',
      canonical_event_id: Number(effectiveSelectedTradeId),
      action,
      override_effective_at: overrideDate || null,
      override_quantity: overrideQuantity || null,
      override_price: overridePrice || null,
      cost_basis_method: costBasisMethod,
      slippage_mode: slippageMode,
      slippage_value: slippageValue,
    }
    simulationMutation.mutate(payload)
  }

  return (
    <PageFrame
      eyebrow="Counterfactual engine"
      title="Simulation lab"
      description="Test one trade override at a time and compare the hypothetical position, P/L, and cash effect against imported reality."
    >
      <section className="dashboard-grid simulation-grid">
        <Card title="Scenario builder" kicker="One-trade override">
          <div className="form-grid">
            <label>
              <span>Trade target</span>
              <select value={effectiveSelectedTradeId} onChange={(event) => setSelectedTradeId(event.target.value)}>
                {(tradesQuery.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.symbol} · {item.side} · {item.quantity} · {item.effective_date}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Scenario action</span>
              <select value={action} onChange={(event) => setAction(event.target.value as 'skip' | 'modify')}>
                <option value="skip">Skip trade</option>
                <option value="modify">Modify trade</option>
              </select>
            </label>
            <label>
              <span>Override date/time</span>
              <input type="datetime-local" value={overrideDate} onChange={(event) => setOverrideDate(event.target.value)} disabled={action === 'skip'} />
            </label>
            <label>
              <span>Override quantity</span>
              <input value={overrideQuantity} onChange={(event) => setOverrideQuantity(event.target.value)} placeholder="Optional" disabled={action === 'skip'} />
            </label>
            <label>
              <span>Override price</span>
              <input value={overridePrice} onChange={(event) => setOverridePrice(event.target.value)} placeholder="Optional" disabled={action === 'skip'} />
            </label>
            <label>
              <span>Cost basis</span>
              <select value={costBasisMethod} onChange={(event) => setCostBasisMethod(event.target.value as 'FIFO' | 'AVERAGE_COST')}>
                <option value="FIFO">FIFO</option>
                <option value="AVERAGE_COST">Average cost</option>
              </select>
            </label>
            <label>
              <span>Slippage mode</span>
              <select value={slippageMode} onChange={(event) => setSlippageMode(event.target.value as 'fixed' | 'basis_points' | 'disabled')}>
                <option value="disabled">Disabled</option>
                <option value="fixed">Fixed</option>
                <option value="basis_points">Basis points</option>
              </select>
            </label>
            <label>
              <span>Slippage value</span>
              <input value={slippageValue} onChange={(event) => setSlippageValue(event.target.value)} />
            </label>
          </div>
          <button className="action-button" type="button" onClick={submitSimulation} disabled={!effectiveSelectedTradeId || simulationMutation.isPending}>
            {simulationMutation.isPending ? 'Running scenario…' : 'Run scenario'}
          </button>
        </Card>

        <Card title="Selected trade" kicker="Current target">
          {selectedTrade ? <ActivityRow item={selectedTrade} /> : <LoadingRows rows={2} />}
        </Card>

        <Card title="Scenario result" kicker="Actual vs hypothetical">
          {simulationMutation.isError ? (
            <ErrorPanel compact title="Simulation failed" description="The scenario endpoint rejected the payload or the backend is unavailable." />
          ) : simulationMutation.data ? (
            <SimulationResultCard result={simulationMutation.data} />
          ) : (
            <div className="inline-feedback">No scenario executed yet. Choose a trade and run the lab.</div>
          )}
        </Card>
      </section>
    </PageFrame>
  )
}

type ChartSeries = {
  key: string
  label: string
  color: string
}

function SeriesChart({
  points,
  series,
  emptyLabel,
}: {
  points: Array<Record<string, string | null>>
  series: ChartSeries[]
  emptyLabel: string
}) {
  const usablePoints = points.filter((point) =>
    series.some((entry) => point[entry.key] !== null && point[entry.key] !== undefined),
  )

  if (usablePoints.length === 0) {
    return <div className="chart-note">{emptyLabel}</div>
  }

  const values = usablePoints.flatMap((point) =>
    series
      .map((entry) => numericValue(point[entry.key]))
      .filter((value) => Number.isFinite(value)),
  )
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || 1

  const buildPoints = (seriesKey: string) =>
    usablePoints
      .map((point, index) => {
        const rawValue = point[seriesKey]
        if (rawValue === null || rawValue === undefined) {
          return null
        }
        const x = usablePoints.length === 1 ? 180 : (index / (usablePoints.length - 1)) * 360
        const y = 120 - ((numericValue(rawValue) - min) / spread) * 100
        return `${x},${y}`
      })
      .filter(Boolean)
      .join(' ')

  return (
    <div className="series-chart">
      <svg viewBox="0 0 360 140" className="chart-svg" aria-hidden="true">
        <path d="M0 120 H360" className="chart-gridline" />
        <path d="M0 70 H360" className="chart-gridline" />
        <path d="M0 20 H360" className="chart-gridline" />
        {series.map((entry) => (
          <polyline
            key={entry.key}
            fill="none"
            stroke={entry.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={buildPoints(entry.key)}
          />
        ))}
      </svg>
      <div className="chart-legend">
        {series.map((entry) => (
          <span key={entry.key}>
            <i style={{ backgroundColor: entry.color }} />
            {entry.label}
          </span>
        ))}
      </div>
      <div className="chart-summary-row">
        <span>{String(usablePoints[0]['date'] ?? 'Start')}</span>
        <strong>{String(usablePoints[usablePoints.length - 1]['date'] ?? 'Latest')}</strong>
      </div>
    </div>
  )
}

function HorizontalBars({
  items,
  emptyLabel,
}: {
  items: Array<{ label: string; value: string | null }>
  emptyLabel: string
}) {
  const usableItems = items.filter((item) => item.value !== null && item.value !== undefined)
  const maxMagnitude =
    usableItems.length > 0
      ? Math.max(...usableItems.map((item) => Math.abs(numericValue(item.value))))
      : 0

  if (usableItems.length === 0 || maxMagnitude === 0) {
    return <div className="chart-note">{emptyLabel}</div>
  }

  return (
    <div className="bar-stack">
      {usableItems.map((item) => {
        const value = numericValue(item.value)
        const width = `${Math.max((Math.abs(value) / maxMagnitude) * 100, 4)}%`
        return (
          <div key={item.label} className="bar-row">
            <div>
              <strong>{item.label}</strong>
              <span>{formatNumeric(item.value)}</span>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill${value < 0 ? ' negative' : ''}`}
                style={{ width }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PageFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <motion.section className="page-frame" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="page-head">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </motion.section>
  )
}

function Card({ title, kicker, children }: { title: string; kicker: string; children: ReactNode }) {
  return (
    <section className="card-panel">
      <div className="card-head">
        <span className="eyebrow">{kicker}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function MetricCard({ label, descriptor, accent }: { label: string; descriptor: ValueDescriptor; accent: 'positive' | 'neutral' | 'warning' }) {
  return (
    <div className={`metric-card ${accent}`}>
      <span>{label}</span>
      <strong>{formatMoneyDescriptor(descriptor)}</strong>
      <SourceBadge source={descriptor.source} compact />
    </div>
  )
}

function SourceBadge({ source, compact = false }: { source: string; compact?: boolean }) {
  return <span className={`source-badge ${source.toLowerCase()}${compact ? ' compact' : ''}`}>{source}</span>
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const positive = (item.amount ?? item.proceeds ?? '0').startsWith('-') ? false : true
  const Icon = positive ? ArrowUpRight : ArrowDownLeft
  return (
    <div className="activity-row">
      <div className={`activity-icon ${positive ? 'positive' : 'negative'}`}>
        <Icon size={15} />
      </div>
      <div className="activity-copy">
        <strong>{item.symbol ?? item.event_type.toUpperCase()}</strong>
        <span>{item.description ?? item.source_section}</span>
      </div>
      <div className="activity-meta">
        <strong>{item.quantity ?? item.amount ?? item.proceeds ?? '0'}</strong>
        <span>{item.effective_at ?? item.effective_date}</span>
      </div>
    </div>
  )
}

function ImportBatchCard({ batch }: { batch: ImportBatch }) {
  return (
    <div className="batch-card">
      <div>
        <strong>Batch #{batch.id}</strong>
        <span>{batch.statement_title ?? 'IBKR statement import'}</span>
      </div>
      <div>
        <SourceBadge source={batch.status} compact />
        <span>{batch.period_end ?? 'No period end'}</span>
      </div>
    </div>
  )
}

function SimulationResultCard({ result }: { result: SimulationResponse }) {
  return (
    <div className="simulation-result-grid">
      <div className="simulation-column">
        <span className="eyebrow">Actual</span>
        {Object.entries(result.result.actual).map(([key, value]) => (
          <div key={key} className="comparison-row">
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="simulation-column">
        <span className="eyebrow">Hypothetical</span>
        {Object.entries(result.result.hypothetical).map(([key, value]) => (
          <div key={key} className="comparison-row">
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="simulation-column delta-column">
        <span className="eyebrow">Delta</span>
        {Object.entries(result.result.delta).map(([key, value]) => (
          <div key={key} className="comparison-row">
            <span>{key}</span>
            <strong className={positiveClass(value)}>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function PageSkeleton({ title }: { title: string }) {
  return (
    <PageFrame eyebrow="Loading state" title={title} description="The control surface is waiting on the backend contract.">
      <div className="skeleton-grid">
        <LoadingRows rows={3} />
        <LoadingRows rows={6} />
      </div>
    </PageFrame>
  )
}

function LoadingRows({ rows }: { rows: number }) {
  return (
    <div className="loading-stack">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton-block" />
      ))}
    </div>
  )
}

function ErrorPanel({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className={`error-panel${compact ? ' compact' : ''}`}>
      <CircleAlert size={18} />
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  )
}

function formatMoneyDescriptor(descriptor: ValueDescriptor) {
  if (descriptor.value === null) {
    return 'Unavailable'
  }
  const prefix = descriptor.currency ? `${descriptor.currency} ` : ''
  return `${prefix}${formatNumeric(descriptor.value)}`
}

function formatNumeric(value: string | null | undefined) {
  if (!value) {
    return '0'
  }
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return String(value)
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numeric)
}

function numericValue(value: string | null | undefined) {
  if (!value) {
    return 0
  }
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatPercent(value: string | null | undefined) {
  if (!value) {
    return '—'
  }
  return `${formatNumeric(value)}%`
}

function positiveClass(value: string | null | undefined) {
  if (!value) {
    return ''
  }
  return value.startsWith('-') ? 'negative-text' : 'positive-text'
}

function formatUnknown(value: unknown) {
  if (value === null || value === undefined) {
    return 'Unavailable'
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export default App
