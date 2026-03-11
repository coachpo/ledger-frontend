import * as React from "react"
import { ArrowUpDown, CandlestickChart, ChevronDown, Download, FileSpreadsheet, Landmark, Plus, SearchX, Wallet } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { api, type BalanceRead, type PositionRead } from "@/lib/api"
import {
  formatCurrency,
  formatDateTime,
  formatDecimal,
  formatPercentage,
} from "@/lib/format"
import { invalidatePortfolioScope } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BalanceFormDialog,
  ConfirmDeleteDialog,
  CsvImportDialog,
  PositionFormDialog,
} from "@/components/portfolios/dialogs"
import {
  EmptyState,
  FeedStatusBadge,
  RowActionMenu,
} from "@/components/portfolios/shared"
import { usePortfolioWorkspace } from "@/components/portfolios/portfolio-workspace-layout"
import {
  assetHasDistinctName,
  getAssetDisplayName,
  type AssetAnalysisRow,
  type MarketBucket,
} from "@/lib/portfolio-analytics"


export function PortfolioOverviewPage() {
  const queryClient = useQueryClient()
  const {
    balances,
    balancesQuery,
    dashboard,
    isAmountsVisible,
    marketQuery,
    portfolio,
    positionsQuery,
    quotes,
  } = usePortfolioWorkspace()
  const [positionDialog, setPositionDialog] = React.useState<
    PositionRead | null | "create"
  >(null)
  const [deletingPosition, setDeletingPosition] = React.useState<PositionRead | null>(
    null,
  )
  const [balanceDialog, setBalanceDialog] = React.useState<BalanceRead | null | "create">(
    null,
  )
  const [deletingBalance, setDeletingBalance] = React.useState<BalanceRead | null>(
    null,
  )
  const [csvDialogOpen, setCsvDialogOpen] = React.useState(false)
  const [openMarkets, setOpenMarkets] = React.useState<Record<MarketBucket, boolean>>({
    US: true,
    HK: true,
    "A-Share": true,
    Other: true,
  })
  const [sortColumn, setSortColumn] = React.useState<
    "symbol" | "marketValue" | "quantity" | "currentPrice" | "cost" | "cumulativePnl" | "pnlRate" | null
  >(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc")

  if (!portfolio) {
    return null
  }

  const mask = (value: string) => (isAmountsVisible ? value : "••••••")
  const exportHoldingsToCSV = () => {
    const headers = ["Symbol", "Name", "Market", "Quantity", "Current Price", "Market Value", "Cost Basis", "Cumulative P&L", "P&L Rate"]
    const rows = dashboard.assetRows.map(row => [
      row.symbol,
      row.name || "",
      row.market,
      formatDecimal(row.quantity, 4),
      row.currentPrice !== null ? formatDecimal(row.currentPrice, 2) : "--",
      formatDecimal(row.currentValue, 2),
      formatDecimal(row.costBasis, 2),
      formatDecimal(row.cumulativePnl, 2),
      formatPercentage(row.cumulativePnlRate)
    ])
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${portfolio.name}_holdings_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast.success("Holdings exported to CSV")
  }

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("desc")
    }
  }

  const sortHoldings = (holdings: AssetAnalysisRow[]) => {
    if (!sortColumn) return holdings

    return [...holdings].sort((a, b) => {
      let aVal: number | string | null
      let bVal: number | string | null

      switch (sortColumn) {
        case "symbol":
          aVal = a.symbol
          bVal = b.symbol
          break
        case "marketValue":
          aVal = a.currentValue
          bVal = b.currentValue
          break
        case "quantity":
          aVal = a.quantity
          bVal = b.quantity
          break
        case "currentPrice":
          aVal = a.currentPrice ?? -Infinity
          bVal = b.currentPrice ?? -Infinity
          break
        case "cost":
          aVal = a.costBasis
          bVal = b.costBasis
          break
        case "cumulativePnl":
          aVal = a.cumulativePnl
          bVal = b.cumulativePnl
          break
        case "pnlRate":
          aVal = a.cumulativePnlRate
          bVal = b.cumulativePnlRate
          break
        default:
          return 0
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      const aNum = typeof aVal === "number" ? aVal : 0
      const bNum = typeof bVal === "number" ? bVal : 0
      return sortDirection === "asc" ? aNum - bNum : bNum - aNum
    })
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="border-border/80 bg-background/92 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="font-[var(--font-display)] text-3xl">
                Holdings overview
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Grouped by inferred market with manual management and CSV import.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full" onClick={() => setPositionDialog("create")}>
                <Plus className="size-4" />
                Add position
              </Button>
              <Button
                className="rounded-full"
                onClick={() => setCsvDialogOpen(true)}
                variant="outline"
              >
                <FileSpreadsheet className="size-4" />
                Import CSV
              </Button>
              <Button
                className="rounded-full"
                disabled={dashboard.assetRows.length === 0}
                onClick={exportHoldingsToCSV}
                variant="outline"
              >
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            {positionsQuery.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    className="h-24 rounded-[1.5rem] border border-border/70 bg-muted/20"
                    key={index}
                  />
                ))}
              </div>
            ) : dashboard.holdingGroups.length === 0 ? (
              <EmptyState
                action={
                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-full" onClick={() => setPositionDialog("create")}>
                      <Plus className="size-4" />
                      Add manually
                    </Button>
                    <Button
                      className="rounded-full"
                      onClick={() => setCsvDialogOpen(true)}
                      variant="outline"
                    >
                      <FileSpreadsheet className="size-4" />
                      Import CSV
                    </Button>
                  </div>
                }
                icon={Landmark}
                title="No holdings yet"
              >
                Create a position manually or import a snapshot to start the dashboard.
              </EmptyState>
            ) : (
              <div className="space-y-4">
                {dashboard.holdingGroups.map((group) => (
                  <Collapsible
                    key={group.market}
                    onOpenChange={(open) =>
                      setOpenMarkets((current) => ({
                        ...current,
                        [group.market]: open,
                      }))
                    }
                    open={openMarkets[group.market]}
                  >
                    <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/70">
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/20">
                          <div>
                            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                              {group.market}
                            </p>
                            <p className="mt-2 font-[var(--font-display)] text-3xl text-foreground">
                              {mask(
                                formatCurrency(
                                  group.marketValue,
                                  portfolio.baseCurrency,
                                ),
                              )}
                            </p>
                          </div>
                          <div className="grid gap-3 text-right sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
                            <MetricChip
                              label="Floating P&L"
                              value={mask(
                                formatCurrency(
                                  group.floatingPnl,
                                  portfolio.baseCurrency,
                                ),
                              )}
                            />
                            <MetricChip
                              label="Cumulative P&L"
                              value={mask(
                                formatCurrency(
                                  group.cumulativePnl,
                                  portfolio.baseCurrency,
                                ),
                              )}
                            />
                            <div className="flex items-center justify-end gap-2 text-muted-foreground">
                              <span className="text-sm">
                                {group.holdings.length} holding
                                {group.holdings.length === 1 ? "" : "s"}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "size-4 transition-transform",
                                  openMarkets[group.market] && "rotate-180",
                                )}
                              />
                            </div>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border/60 px-5 py-5">
                          <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                            <div className="overflow-x-auto">
                              <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("symbol")}
                                    >
                                      Asset
                                      {sortColumn === "symbol" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("marketValue")}
                                    >
                                      Market value
                                      {sortColumn === "marketValue" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("quantity")}
                                    >
                                      Quantity
                                      {sortColumn === "quantity" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("currentPrice")}
                                    >
                                      Current price
                                      {sortColumn === "currentPrice" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("cost")}
                                    >
                                      Cost
                                      {sortColumn === "cost" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("cumulativePnl")}
                                    >
                                      Cumulative P&L
                                      {sortColumn === "cumulativePnl" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead>
                                    <button
                                      className="flex items-center gap-1 hover:text-foreground"
                                      onClick={() => handleSort("pnlRate")}
                                    >
                                      P&L rate
                                      {sortColumn === "pnlRate" && (
                                        <ArrowUpDown className="size-3" />
                                      )}
                                    </button>
                                  </TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {sortHoldings(group.holdings).map((row) => {
                                  return (
                                    <TableRow key={row.symbol}>
                                      <TableCell>
                                        <Link
                                          className="space-y-1 hover:text-primary"
                                          to={`/portfolios/${portfolio.id}/assets/${encodeURIComponent(
                                            row.symbol,
                                          )}`}
                                        >
                                          <p className="font-medium text-foreground">
                                            {getAssetDisplayName(row.name, row.symbol)}
                                          </p>
                                          {assetHasDistinctName(row.name, row.symbol) ? (
                                            <p className="text-sm text-muted-foreground">
                                              {row.symbol}
                                            </p>
                                          ) : null}
                                        </Link>
                                      </TableCell>
                                      <TableCell>
                                        {mask(
                                          formatCurrency(
                                            row.currentValue,
                                            portfolio.baseCurrency,
                                          ),
                                        )}
                                      </TableCell>
                                      <TableCell>{formatDecimal(row.quantity, 4)}</TableCell>
                                      <TableCell>
                                        {row.currentPrice === null
                                          ? "--"
                                          : mask(
                                              formatCurrency(
                                                row.currentPrice,
                                                portfolio.baseCurrency,
                                              ),
                                            )}
                                      </TableCell>
                                      <TableCell>
                                        {mask(
                                          formatCurrency(
                                            row.costBasis,
                                            portfolio.baseCurrency,
                                          ),
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {mask(
                                          formatCurrency(
                                            row.cumulativePnl,
                                            portfolio.baseCurrency,
                                          ),
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {formatPercentage(row.cumulativePnlRate)}
                                      </TableCell>
                                      <TableCell>
                                        <div className="hidden justify-end gap-1 md:flex">
                                          <Button
                                            className="rounded-full"
                                            onClick={() => {
                                              const selected = portfolio &&
                                                positionsQuery.data?.find(
                                                  (item) => item.symbol === row.symbol,
                                                )
                                              if (selected) {
                                                setPositionDialog(selected)
                                              }
                                            }}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            className="rounded-full text-destructive hover:text-destructive"
                                            onClick={() => {
                                              const selected =
                                                positionsQuery.data?.find(
                                                  (item) => item.symbol === row.symbol,
                                                ) ?? null
                                              setDeletingPosition(selected)
                                            }}
                                            size="sm"
                                            variant="ghost"
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                        <div className="flex justify-end md:hidden">
                                          <RowActionMenu
                                            editLabel="Edit position"
                                            onDelete={() => {
                                              const selected =
                                                positionsQuery.data?.find(
                                                  (item) => item.symbol === row.symbol,
                                                ) ?? null
                                              setDeletingPosition(selected)
                                            }}
                                            onEdit={() => {
                                              const selected =
                                                positionsQuery.data?.find(
                                                  (item) => item.symbol === row.symbol,
                                                ) ?? null
                                              setPositionDialog(selected)
                                            }}
                                          />
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="border-border/80 bg-background/92 shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="font-[var(--font-display)] text-3xl">
                  Balances
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Manage settlement buckets for simulated trades.
                </p>
              </div>
              <Button className="rounded-full" onClick={() => setBalanceDialog("create")}>
                <Plus className="size-4" />
                Add balance
              </Button>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {balancesQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div
                      className="h-16 rounded-[1.25rem] border border-border/70 bg-muted/20"
                      key={index}
                    />
                  ))}
                </div>
              ) : balances.length === 0 ? (
                <EmptyState
                  action={
                    <Button
                      className="rounded-full"
                      onClick={() => setBalanceDialog("create")}
                    >
                      <Plus className="size-4" />
                      Add balance
                    </Button>
                  }
                  icon={Wallet}
                  title="No balances yet"
                >
                  Add at least one settlement balance before entering trades.
                </EmptyState>
              ) : (
                <div className="space-y-3">
                  {balances.map((balance) => (
                    <div
                      className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                      key={balance.id}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {balance.label}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Updated {formatDateTime(balance.updatedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {mask(
                              formatCurrency(balance.amount, balance.currency),
                            )}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {balance.currency}
                          </p>
                        </div>
                        <div className="hidden gap-1 md:flex">
                          <Button
                            className="rounded-full"
                            onClick={() => setBalanceDialog(balance)}
                            size="sm"
                            variant="ghost"
                          >
                            Edit
                          </Button>
                          <Button
                            className="rounded-full text-destructive hover:text-destructive"
                            onClick={() => setDeletingBalance(balance)}
                            size="sm"
                            variant="ghost"
                          >
                            Delete
                          </Button>
                        </div>
                        <div className="md:hidden">
                          <RowActionMenu
                            editLabel="Edit balance"
                            onDelete={() => setDeletingBalance(balance)}
                            onEdit={() => setBalanceDialog(balance)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-background/92 shadow-sm">
            <CardHeader className="border-b border-border/60 px-6 pb-4">
              <CardTitle className="font-[var(--font-display)] text-3xl">
                Quote board
              </CardTitle>
              <p className="text-sm leading-6 text-muted-foreground">
                Delayed reference quotes for active holdings.
              </p>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {dashboard.assetRows.length === 0 ? (
                <EmptyState icon={CandlestickChart} title="No quotes yet">
                  Add a position to populate the quote board.
                </EmptyState>
              ) : marketQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div
                      className="h-16 rounded-[1.25rem] border border-border/70 bg-muted/20"
                      key={index}
                    />
                  ))}
                </div>
              ) : quotes.length === 0 ? (
                <EmptyState icon={SearchX} title="No quotes returned">
                  The dashboard keeps working even when the delayed quote feed is unavailable.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Last price</TableHead>
                        <TableHead>Previous close</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>As of</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow key={quote.symbol}>
                          <TableCell className="font-medium">
                            {quote.symbol}
                          </TableCell>
                          <TableCell>
                            {mask(formatCurrency(quote.price, quote.currency))}
                          </TableCell>
                          <TableCell>
                            {quote.previousClose
                              ? mask(
                                  formatCurrency(
                                    quote.previousClose,
                                    quote.currency,
                                  ),
                                )
                              : "--"}
                          </TableCell>
                          <TableCell>
                            <FeedStatusBadge
                              status={quote.isStale ? "stale" : "delayed"}
                            />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTime(quote.asOf)}
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
        </div>
      </div>
        <Card className="border-border/80 bg-background/92 shadow-sm">
          <CardHeader className="border-b border-border/60 px-6 pb-4">
            <CardTitle className="font-[var(--font-display)] text-3xl">
              Historical holdings
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              Closed positions from past trades.
            </p>
          </CardHeader>
          <CardContent className="px-6 py-5">
            {dashboard.historicalHoldings.length === 0 ? (
              <EmptyState icon={Landmark} title="No closed holdings yet">
                Symbols that are fully closed out through simulated trades will appear here.
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {dashboard.historicalHoldings.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                    key={item.symbol}
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {getAssetDisplayName(item.name, item.symbol)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {assetHasDistinctName(item.name, item.symbol)
                          ? `${item.symbol} • ${item.market} • ${item.tradeCount} trade${item.tradeCount === 1 ? "" : "s"}`
                          : `${item.market} • ${item.tradeCount} trade${item.tradeCount === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {mask(
                          formatCurrency(
                            item.cumulativePnl,
                            portfolio.baseCurrency,
                          ),
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(item.lastExecutedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      <PositionFormDialog
        onOpenChange={(open) => {
          if (!open) {
            setPositionDialog(null)
          }
        }}
        open={Boolean(positionDialog)}
        portfolio={portfolio}
        position={positionDialog === "create" ? null : positionDialog}
      />
      <BalanceFormDialog
        balance={balanceDialog === "create" ? null : balanceDialog}
        onOpenChange={(open) => {
          if (!open) {
            setBalanceDialog(null)
          }
        }}
        open={Boolean(balanceDialog)}
        portfolio={portfolio}
      />
      <CsvImportDialog
        onOpenChange={setCsvDialogOpen}
        open={csvDialogOpen}
        portfolioId={portfolio.id}
      />
      <ConfirmDeleteDialog
        confirmLabel="Delete position"
        description={
          deletingPosition
            ? `Delete ${deletingPosition.symbol} from ${portfolio.name}.`
            : ""
        }
        onConfirm={async () => {
          if (!deletingPosition) {
            return
          }

          await api.deletePosition(portfolio.id, deletingPosition.id)
          await invalidatePortfolioScope(queryClient, portfolio.id)
          toast.success("Position deleted")
          setDeletingPosition(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPosition(null)
          }
        }}
        open={Boolean(deletingPosition)}
        title="Delete this position?"
      />
      <ConfirmDeleteDialog
        confirmLabel="Delete balance"
        description={
          deletingBalance
            ? `Delete ${deletingBalance.label} from ${portfolio.name}.`
            : ""
        }
        onConfirm={async () => {
          if (!deletingBalance) {
            return
          }

          await api.deleteBalance(portfolio.id, deletingBalance.id)
          await invalidatePortfolioScope(queryClient, portfolio.id)
          toast.success("Balance deleted")
          setDeletingBalance(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBalance(null)
          }
        }}
        open={Boolean(deletingBalance)}
        title="Delete this balance?"
      />
    </>
  )
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
