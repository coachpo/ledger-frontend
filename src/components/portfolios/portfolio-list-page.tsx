import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  BriefcaseBusiness,
  CandlestickChart,
  FolderOpenDot,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { api, type PortfolioRead } from "@/lib/api"
import {
  formatDate,
  getErrorDetails,
  getErrorMessage,
  pluralize,
} from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { sortPortfolios } from "@/lib/workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ConfirmDeleteDialog,
  PortfolioFormDialog,
} from "@/components/portfolios/dialogs"
import {
  EmptyState,
  MetricCard,
  StatusCallout,
} from "@/components/portfolios/shared"

export function PortfolioListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const portfoliosQuery = useQuery({
    queryKey: queryKeys.portfolios(),
    queryFn: api.listPortfolios,
  })

  const portfolios = React.useMemo(
    () => sortPortfolios(portfoliosQuery.data ?? []),
    [portfoliosQuery.data],
  )

  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedPortfolioIds, setSelectedPortfolioIds] = React.useState<Set<string>>(
    () => new Set(),
  )
  const [editingPortfolio, setEditingPortfolio] = React.useState<PortfolioRead | null>(null)
  const [deletingPortfolio, setDeletingPortfolio] = React.useState<PortfolioRead | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false)

  const totalPositions = portfolios.reduce(
    (total, portfolio) => total + portfolio.positionCount,
    0,
  )
  const totalBalances = portfolios.reduce(
    (total, portfolio) => total + portfolio.balanceCount,
    0,
  )
  const selectedPortfolios = portfolios.filter((portfolio) => selectedPortfolioIds.has(portfolio.id))
  const allSelected = portfolios.length > 0 && selectedPortfolioIds.size === portfolios.length
  const someSelected = selectedPortfolioIds.size > 0 && !allSelected

  React.useEffect(() => {
    setSelectedPortfolioIds((current) => {
      const next = new Set(
        [...current].filter((portfolioId) =>
          portfolios.some((portfolio) => portfolio.id === portfolioId),
        ),
      )

      return next.size === current.size ? current : next
    })
  }, [portfolios])

  const togglePortfolioSelection = React.useCallback((portfolioId: string, checked: boolean) => {
    setSelectedPortfolioIds((current) => {
      const next = new Set(current)

      if (checked) {
        next.add(portfolioId)
      } else {
        next.delete(portfolioId)
      }

      return next
    })
  }, [])

  const toggleAllPortfolios = React.useCallback((checked: boolean) => {
    setSelectedPortfolioIds(
      checked ? new Set(portfolios.map((portfolio) => portfolio.id)) : new Set(),
    )
  }, [portfolios])

  const clearSelection = React.useCallback(() => {
    setSelectedPortfolioIds(new Set())
  }, [])

  const handleBatchDelete = React.useCallback(async () => {
    const failures: Array<{ error: unknown; portfolio: PortfolioRead }> = []

    for (const portfolio of selectedPortfolios) {
      try {
        await api.deletePortfolio(portfolio.id)
      } catch (error) {
        failures.push({ error, portfolio })
      }
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })

    if (failures.length === 0) {
      toast.success(
        `${selectedPortfolios.length} ${pluralize(selectedPortfolios.length, "portfolio")} deleted`,
      )
      setSelectedPortfolioIds(new Set())
      return
    }

    setSelectedPortfolioIds(
      new Set(failures.map(({ portfolio }) => portfolio.id)),
    )

    const deletedCount = selectedPortfolios.length - failures.length
    const failureSummary = failures
      .map(({ error, portfolio }) => `${portfolio.name}: ${getErrorMessage(error)}`)
      .join(" ")

    if (deletedCount > 0) {
      toast.error(
        `${deletedCount} ${pluralize(deletedCount, "portfolio")} deleted, ${failures.length} failed.`,
      )
    }

    throw new Error(failureSummary)
  }, [queryClient, selectedPortfolios])

  const bulkDeleteDescription =
    selectedPortfolios.length <= 3
      ? `Delete ${selectedPortfolios.map((portfolio) => portfolio.name).join(", ")} and all related balances, positions, and simulated trades.`
      : `Delete ${selectedPortfolios.length} selected portfolios and all related balances, positions, and simulated trades.`

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          detail={`${portfolios.length} ${pluralize(portfolios.length, "portfolio")}`}
          icon={BriefcaseBusiness}
          label="Portfolios"
          value={String(portfolios.length)}
        />
        <MetricCard
          detail={`${totalPositions} ${pluralize(totalPositions, "position")}`}
          icon={CandlestickChart}
          label="Positions"
          value={String(totalPositions)}
        />
        <MetricCard
          detail={`${totalBalances} ${pluralize(totalBalances, "balance")}`}
          icon={Wallet}
          label="Balances"
          value={String(totalBalances)}
        />
      </div>

      {portfoliosQuery.error ? (
        <StatusCallout
          details={getErrorDetails(portfoliosQuery.error)}
          title="Portfolios unavailable"
          tone="error"
        >
          {getErrorMessage(portfoliosQuery.error)}
        </StatusCallout>
      ) : null}

      <Card className="border-border/70 bg-background/90 shadow-sm backdrop-blur" id="portfolio-register">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle className="font-[var(--font-display)] text-3xl">Portfolios</CardTitle>
          <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New portfolio
          </Button>
        </CardHeader>
        <CardContent>
          {portfoliosQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="h-16 w-full rounded-2xl" key={index} />
              ))}
            </div>
          ) : portfolios.length === 0 ? (
            <EmptyState
              action={
                <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Create the first portfolio
                </Button>
              }
              icon={FolderOpenDot}
              title="No portfolios yet"
            >
              Create a portfolio to start tracking balances, positions, and trades.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-muted/20 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Batch management</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPortfolioIds.size > 0
                      ? `${selectedPortfolioIds.size} ${pluralize(selectedPortfolioIds.size, "portfolio")} selected`
                      : "Select portfolios to apply bulk actions."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button
                    className="rounded-full"
                    onClick={clearSelection}
                    size="sm"
                    variant="outline"
                  >
                    Clear selection
                  </Button>
                  <Button
                    className="rounded-full text-destructive hover:text-destructive"
                    disabled={selectedPortfolioIds.size === 0}
                    onClick={() => setBulkDeleteOpen(true)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="size-4" />
                    Delete selected
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/70">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        aria-label="Select all portfolios"
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) => toggleAllPortfolios(checked === true)}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Balances</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolios.map((portfolio) => (
                    <TableRow key={portfolio.id}>
                      <TableCell>
                        <Checkbox
                          aria-label={`Select ${portfolio.name}`}
                          checked={selectedPortfolioIds.has(portfolio.id)}
                          onCheckedChange={(checked) =>
                            togglePortfolioSelection(portfolio.id, checked === true)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className={portfolio.description ? "space-y-1" : undefined}>
                          <p className="font-medium text-foreground">{portfolio.name}</p>
                          {portfolio.description ? (
                            <p className="max-w-md text-sm text-muted-foreground">
                              {portfolio.description}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full border border-border/70 bg-foreground px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-background hover:bg-foreground">
                          {portfolio.baseCurrency}
                        </Badge>
                      </TableCell>
                      <TableCell>{portfolio.balanceCount}</TableCell>
                      <TableCell>{portfolio.positionCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(portfolio.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild className="rounded-full" size="sm" variant="outline">
                            <Link to={`/portfolios/${portfolio.id}`}>
                              Open
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                          <Button className="rounded-full" onClick={() => setEditingPortfolio(portfolio)} size="sm" variant="ghost">
                            Edit
                          </Button>
                          <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingPortfolio(portfolio)} size="sm" variant="ghost">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PortfolioFormDialog
        onOpenChange={setCreateOpen}
        onSuccess={(portfolio) => {
          setCreateOpen(false)
          navigate(`/portfolios/${portfolio.id}`)
        }}
        open={createOpen}
      />

      <PortfolioFormDialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingPortfolio(null)
          }
        }}
        onSuccess={() => {
          setEditingPortfolio(null)
        }}
        open={Boolean(editingPortfolio)}
        portfolio={editingPortfolio}
      />

      <ConfirmDeleteDialog
        confirmLabel="Delete portfolio"
        description={
          deletingPortfolio
            ? `Delete ${deletingPortfolio.name} and all related balances, positions, and simulated trades.`
            : ""
        }
        onConfirm={async () => {
          if (!deletingPortfolio) {
            return
          }

          await api.deletePortfolio(deletingPortfolio.id)
          await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })
          toast.success("Portfolio deleted")
          setDeletingPortfolio(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPortfolio(null)
          }
        }}
        open={Boolean(deletingPortfolio)}
        title="Delete portfolio?"
      />
      <ConfirmDeleteDialog
        confirmLabel="Delete selected"
        description={bulkDeleteDescription}
        onConfirm={handleBatchDelete}
        onOpenChange={setBulkDeleteOpen}
        open={bulkDeleteOpen}
        title="Delete selected portfolios?"
      />
    </div>
  )
}
