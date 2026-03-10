import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Import, Layers3, Plus, Wallet } from 'lucide-react'
import * as React from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { AppShell } from '../app/shell'
import { BalanceFormDialog } from '../components/balance-form-dialog'
import { BalanceTable } from '../components/balance-table'
import { CsvImportDialog } from '../components/csv-import-dialog'
import { MarketQuotePanel } from '../components/market-quote-panel'
import { PositionFormDialog } from '../components/position-form-dialog'
import { PositionTable } from '../components/position-table'
import { TradingOperationForm } from '../components/trading-operation-form'
import { TradingOperationTable } from '../components/trading-operation-table'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmActionDialog,
  DataAlert,
  LoadingState,
} from '../components/ui'
import { api, toErrorMessage } from '../lib/api'
import { formatCurrency, formatDateTime } from '../lib/format'
import type { BalanceRecord, PositionRecord } from '../types/api'

export function PortfolioDetailPage() {
  const { portfolioId } = useParams<{ portfolioId: string }>()
  const resolvedPortfolioId = portfolioId ?? ''
  const queryClient = useQueryClient()

  const [balanceDialogMode, setBalanceDialogMode] = React.useState<'create' | 'edit'>('create')
  const [balanceDialogOpen, setBalanceDialogOpen] = React.useState(false)
  const [activeBalance, setActiveBalance] = React.useState<BalanceRecord | null>(null)
  const [deletingBalance, setDeletingBalance] = React.useState<BalanceRecord | null>(null)

  const [positionDialogMode, setPositionDialogMode] = React.useState<'create' | 'edit'>('create')
  const [positionDialogOpen, setPositionDialogOpen] = React.useState(false)
  const [activePosition, setActivePosition] = React.useState<PositionRecord | null>(null)
  const [deletingPosition, setDeletingPosition] = React.useState<PositionRecord | null>(null)

  const [csvDialogOpen, setCsvDialogOpen] = React.useState(false)

  const portfolioQuery = useQuery({
    queryKey: ['portfolio', resolvedPortfolioId],
    queryFn: () => api.getPortfolio(resolvedPortfolioId),
    enabled: Boolean(resolvedPortfolioId),
  })

  const balancesQuery = useQuery({
    queryKey: ['portfolio', resolvedPortfolioId, 'balances'],
    queryFn: () => api.listBalances(resolvedPortfolioId),
    enabled: Boolean(resolvedPortfolioId),
  })

  const positionsQuery = useQuery({
    queryKey: ['portfolio', resolvedPortfolioId, 'positions'],
    queryFn: () => api.listPositions(resolvedPortfolioId),
    enabled: Boolean(resolvedPortfolioId),
  })

  const operationsQuery = useQuery({
    queryKey: ['portfolio', resolvedPortfolioId, 'operations'],
    queryFn: () => api.listTradingOperations(resolvedPortfolioId),
    enabled: Boolean(resolvedPortfolioId),
  })

  const symbols = React.useMemo(
    () => (positionsQuery.data ?? []).map((position) => position.symbol),
    [positionsQuery.data],
  )

  const quotesQuery = useQuery({
    queryKey: ['portfolio', resolvedPortfolioId, 'quotes', symbols.join(',')],
    queryFn: () => api.getQuotes(resolvedPortfolioId, symbols),
    enabled: Boolean(resolvedPortfolioId) && symbols.length > 0,
  })

  async function invalidateWorkspace() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['portfolios'] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio', resolvedPortfolioId] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio', resolvedPortfolioId, 'balances'] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio', resolvedPortfolioId, 'positions'] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio', resolvedPortfolioId, 'operations'] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio', resolvedPortfolioId, 'quotes'] }),
    ])
  }

  const createBalanceMutation = useMutation({
    mutationFn: (values: { label: string; amount: string }) => api.createBalance(resolvedPortfolioId, values),
    onSuccess: invalidateWorkspace,
  })

  const updateBalanceMutation = useMutation({
    mutationFn: ({ balanceId, values }: { balanceId: string; values: { label: string; amount: string } }) =>
      api.updateBalance(resolvedPortfolioId, balanceId, values),
    onSuccess: invalidateWorkspace,
  })

  const deleteBalanceMutation = useMutation({
    mutationFn: (balanceId: string) => api.deleteBalance(resolvedPortfolioId, balanceId),
    onSuccess: invalidateWorkspace,
  })

  const createPositionMutation = useMutation({
    mutationFn: (values: { symbol: string; name: string | null; quantity: string; averageCost: string }) =>
      api.createPosition(resolvedPortfolioId, values),
    onSuccess: invalidateWorkspace,
  })

  const updatePositionMutation = useMutation({
    mutationFn: ({ positionId, values }: { positionId: string; values: { name: string | null; quantity: string; averageCost: string } }) =>
      api.updatePosition(resolvedPortfolioId, positionId, values),
    onSuccess: invalidateWorkspace,
  })

  const deletePositionMutation = useMutation({
    mutationFn: (positionId: string) => api.deletePosition(resolvedPortfolioId, positionId),
    onSuccess: invalidateWorkspace,
  })

  if (!portfolioId) {
    return <Navigate replace to="/portfolios" />
  }

  const loading =
    portfolioQuery.isPending ||
    balancesQuery.isPending ||
    positionsQuery.isPending ||
    operationsQuery.isPending

  const firstError =
    portfolioQuery.error || balancesQuery.error || positionsQuery.error || operationsQuery.error || quotesQuery.error

  const portfolio = portfolioQuery.data
  const balances = balancesQuery.data ?? []
  const positions = positionsQuery.data ?? []
  const operations = operationsQuery.data ?? []
  const quotes = quotesQuery.data?.quotes ?? []
  const quoteWarnings = quotesQuery.data?.warnings ?? []

  const cashTotal = balances.reduce((sum, balance) => sum + Number(balance.amount), 0)

  return (
    <AppShell
      backHref="/portfolios"
      eyebrow={portfolio?.baseCurrency ?? 'Portfolio'}
      summary={
        portfolio
          ? `${portfolio.description || 'Isolated workspace'} Last updated ${formatDateTime(portfolio.updatedAt)}.`
          : 'Loading portfolio metadata.'
      }
      title={portfolio?.name ?? 'Portfolio workspace'}
      action={
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setBalanceDialogOpen(true)} variant="secondary">
            <Wallet className="h-4 w-4" />
            Add balance
          </Button>
          <Button onClick={() => setPositionDialogOpen(true)} variant="secondary">
            <Plus className="h-4 w-4" />
            Add position
          </Button>
          <Button onClick={() => setCsvDialogOpen(true)}>
            <Import className="h-4 w-4" />
            Import CSV
          </Button>
        </div>
      }
    >
      {firstError ? (
        <div className="mb-6">
          <DataAlert description={toErrorMessage(firstError)} title="Portfolio workspace unavailable" />
        </div>
      ) : null}

      {loading || !portfolio ? (
        <LoadingState message="Loading portfolio workspace..." />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <MetricCard label="Base currency" value={portfolio.baseCurrency} />
            <MetricCard label="Cash total" value={formatCurrency(String(cashTotal), portfolio.baseCurrency)} />
            <MetricCard label="Tracked symbols" value={String(positions.length)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle>Balances</CardTitle>
                    <CardDescription>Manual cash buckets for settlement and scenario testing.</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setActiveBalance(null)
                      setBalanceDialogMode('create')
                      setBalanceDialogOpen(true)
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add balance
                  </Button>
                </CardHeader>
                <CardContent>
                  <BalanceTable
                    balances={balances}
                    onDelete={setDeletingBalance}
                    onEdit={(balance) => {
                      setActiveBalance(balance)
                      setBalanceDialogMode('edit')
                      setBalanceDialogOpen(true)
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <CardTitle>Positions</CardTitle>
                    <CardDescription>
                      Manual holdings and CSV snapshots aggregate into one current position per symbol.
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setCsvDialogOpen(true)} size="sm" variant="secondary">
                      <Import className="h-3.5 w-3.5" />
                      Import CSV
                    </Button>
                    <Button
                      onClick={() => {
                        setActivePosition(null)
                        setPositionDialogMode('create')
                        setPositionDialogOpen(true)
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add position
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <PositionTable
                    onDelete={setDeletingPosition}
                    onEdit={(position) => {
                      setActivePosition(position)
                      setPositionDialogMode('edit')
                      setPositionDialogOpen(true)
                    }}
                    positions={positions}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <TradingOperationForm balances={balances} onSubmitted={invalidateWorkspace} portfolioId={resolvedPortfolioId} />

              <Card>
                <CardHeader>
                  <CardTitle>Recent trade log</CardTitle>
                  <CardDescription>Append-only simulated trades with the settlement balance snapshot preserved for readability.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TradingOperationTable operations={operations} />
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-6">
            <CardHeader className="sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Indicative market data</CardTitle>
                <CardDescription>
                  Quotes are delayed and non-authoritative. They support visibility, not execution.
                </CardDescription>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                <Layers3 className="h-3.5 w-3.5" />
                Best effort feed
              </div>
            </CardHeader>
            <CardContent>
              {quotesQuery.isPending && symbols.length > 0 ? (
                <LoadingState message="Fetching indicative quotes..." />
              ) : (
                <MarketQuotePanel quotes={quotes} warnings={quoteWarnings} />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <BalanceFormDialog
        currency={portfolio?.baseCurrency ?? 'USD'}
        defaultValues={
          activeBalance
            ? {
                label: activeBalance.label,
                amount: activeBalance.amount,
              }
            : undefined
        }
        mode={balanceDialogMode}
        onOpenChange={(open) => {
          setBalanceDialogOpen(open)
          if (!open) {
            setActiveBalance(null)
          }
        }}
        onSubmit={async (values) => {
          if (balanceDialogMode === 'create') {
            await createBalanceMutation.mutateAsync(values)
            return
          }
          if (activeBalance) {
            await updateBalanceMutation.mutateAsync({ balanceId: activeBalance.id, values })
          }
        }}
        open={balanceDialogOpen}
      />

      <PositionFormDialog
        currency={portfolio?.baseCurrency ?? 'USD'}
        defaultValues={
          activePosition
            ? {
                symbol: activePosition.symbol,
                name: activePosition.name,
                quantity: activePosition.quantity,
                averageCost: activePosition.averageCost,
              }
            : undefined
        }
        mode={positionDialogMode}
        onOpenChange={(open) => {
          setPositionDialogOpen(open)
          if (!open) {
            setActivePosition(null)
          }
        }}
        onSubmit={async (values) => {
          if (positionDialogMode === 'create') {
            await createPositionMutation.mutateAsync(values)
            return
          }
          if (activePosition) {
            await updatePositionMutation.mutateAsync({
              positionId: activePosition.id,
              values: {
                name: values.name,
                quantity: values.quantity,
                averageCost: values.averageCost,
              },
            })
          }
        }}
        open={positionDialogOpen}
      />

      <CsvImportDialog
        onCommitted={invalidateWorkspace}
        onOpenChange={setCsvDialogOpen}
        open={csvDialogOpen}
        portfolioId={resolvedPortfolioId}
      />

      <ConfirmActionDialog
        actionLabel="Delete balance"
        description={`This removes ${deletingBalance?.label ?? 'this balance'} from the workspace. Existing trade history keeps the balance label snapshot.`}
        onConfirm={async () => {
          if (!deletingBalance) {
            return
          }
          await deleteBalanceMutation.mutateAsync(deletingBalance.id)
          setDeletingBalance(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBalance(null)
          }
        }}
        open={Boolean(deletingBalance)}
        title="Delete settlement balance?"
      />

      <ConfirmActionDialog
        actionLabel="Delete position"
        description={`This removes ${deletingPosition?.symbol ?? 'this position'} from the current holdings table.`}
        onConfirm={async () => {
          if (!deletingPosition) {
            return
          }
          await deletePositionMutation.mutateAsync(deletingPosition.id)
          setDeletingPosition(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPosition(null)
          }
        }}
        open={Boolean(deletingPosition)}
        title="Delete current position?"
      />
    </AppShell>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-tile rounded-[1.6rem] px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p className="mt-3 font-display text-4xl tracking-[-0.05em] text-[var(--ink)]">{value}</p>
    </div>
  )
}
