import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import * as React from 'react'

import { AppShell } from '../app/shell'
import { PortfolioFormDialog } from '../components/portfolio-form-dialog'
import { PortfolioTable } from '../components/portfolio-table'
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
import type { PortfolioSummary } from '../types/api'

export function PortfoliosPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingPortfolio, setEditingPortfolio] = React.useState<PortfolioSummary | null>(null)
  const [deletingPortfolio, setDeletingPortfolio] = React.useState<PortfolioSummary | null>(null)

  const portfoliosQuery = useQuery({
    queryKey: ['portfolios'],
    queryFn: api.listPortfolios,
  })

  const createPortfolioMutation = useMutation({
    mutationFn: api.createPortfolio,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })

  const updatePortfolioMutation = useMutation({
    mutationFn: ({ portfolioId, name, description }: { portfolioId: string; name: string; description: string | null }) =>
      api.updatePortfolio(portfolioId, { name, description }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })

  const deletePortfolioMutation = useMutation({
    mutationFn: (portfolioId: string) => api.deletePortfolio(portfolioId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['portfolios'] })
    },
  })

  const portfolios = portfoliosQuery.data ?? []
  const totalPositions = portfolios.reduce((sum, portfolio) => sum + portfolio.positionCount, 0)
  const totalBalances = portfolios.reduce((sum, portfolio) => sum + portfolio.balanceCount, 0)

  return (
    <AppShell
      eyebrow="Ledger workspace"
      summary="Isolated portfolio workspaces for balances, holdings, CSV snapshots, delayed quotes, and simulated trades. Everything stays obvious, form-driven, and internal-use friendly."
      title="Portfolio map"
      action={
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New portfolio
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Tracked portfolios" value={String(portfolios.length)} />
        <MetricCard label="Aggregate balance buckets" value={String(totalBalances)} />
        <MetricCard label="Aggregate positions" value={String(totalPositions)} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Workspace overview</CardTitle>
          <CardDescription>
            Open a portfolio to manage balances, holdings, CSV imports, simulated trades, and indicative quote context.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {portfoliosQuery.isError ? (
            <DataAlert
              description={toErrorMessage(portfoliosQuery.error)}
              title="Portfolio list unavailable"
            />
          ) : null}

          {portfoliosQuery.isPending ? (
            <LoadingState message="Loading portfolio workspaces..." />
          ) : (
            <PortfolioTable
              onDelete={setDeletingPortfolio}
              onEdit={setEditingPortfolio}
              portfolios={portfolios}
            />
          )}
        </CardContent>
      </Card>

      <PortfolioFormDialog
        mode="create"
        onOpenChange={setCreateOpen}
        onSubmit={async ({ name, description, baseCurrency }) => {
          await createPortfolioMutation.mutateAsync({
            name,
            description,
            baseCurrency: baseCurrency ?? 'USD',
          })
        }}
        open={createOpen}
      />

      <PortfolioFormDialog
        defaultValues={
          editingPortfolio
            ? {
                name: editingPortfolio.name,
                description: editingPortfolio.description,
              }
            : undefined
        }
        mode="edit"
        onOpenChange={(open) => {
          if (!open) {
            setEditingPortfolio(null)
          }
        }}
        onSubmit={async ({ name, description }) => {
          if (!editingPortfolio) {
            return
          }

          await updatePortfolioMutation.mutateAsync({
            portfolioId: editingPortfolio.id,
            name,
            description,
          })
          setEditingPortfolio(null)
        }}
        open={Boolean(editingPortfolio)}
      />

      <ConfirmActionDialog
        actionLabel="Delete portfolio"
        description={`This removes ${deletingPortfolio?.name ?? 'this portfolio'} and all of its balances, positions, and trading history.`}
        onConfirm={async () => {
          if (!deletingPortfolio) {
            return
          }
          await deletePortfolioMutation.mutateAsync(deletingPortfolio.id)
          setDeletingPortfolio(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPortfolio(null)
          }
        }}
        open={Boolean(deletingPortfolio)}
        title="Delete portfolio and related records?"
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
