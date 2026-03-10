import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  BadgeDollarSign,
  CandlestickChart,
  Coins,
  FileSpreadsheet,
  Landmark,
  MoreHorizontal,
  Plus,
  SearchX,
  Wallet,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import {
  api,
  type BalanceRead,
  type PositionRead,
} from "@/lib/api"
import {
  decimalToNumber,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  getErrorDetails,
  getErrorMessage,
  pluralize,
} from "@/lib/format"
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys"
import {
  buildWorkspaceMetrics,
  sortBalances,
  sortOperations,
  sortPositions,
} from "@/lib/workspace"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  BalanceFormDialog,
  ConfirmDeleteDialog,
  CsvImportDialog,
  PortfolioFormDialog,
  PositionFormDialog,
} from "@/components/portfolios/dialogs"
import {
  type FeedStatus,
  type PositionFilter,
  type PositionSort,
  type PositionTableRow,
  type WorkspaceTab,
} from "@/components/portfolios/model"
import {
  EmptyState,
  FeedStatusBadge,
  RowActionMenu,
  StatusCallout,
  WorkspaceMetricCard,
  formatSignedCurrency,
  getQuoteStatus,
  isNotFoundError,
} from "@/components/portfolios/shared"
import { TradingOperationForm } from "@/components/portfolios/trading-operation-form"

export function PortfolioDetailPage() {
  const navigate = useNavigate()
  const { portfolioId = "" } = useParams()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("overview")
  const [editingPortfolio, setEditingPortfolio] = React.useState(false)
  const [deletingPortfolio, setDeletingPortfolio] = React.useState(false)
  const [balanceDialog, setBalanceDialog] = React.useState<BalanceRead | null | "create">(null)
  const [deletingBalance, setDeletingBalance] = React.useState<BalanceRead | null>(null)
  const [positionDialog, setPositionDialog] = React.useState<PositionRead | null | "create">(null)
  const [deletingPosition, setDeletingPosition] = React.useState<PositionRead | null>(null)
  const [csvDialogOpen, setCsvDialogOpen] = React.useState(false)
  const [tradeSheetOpen, setTradeSheetOpen] = React.useState(false)
  const [positionSearch, setPositionSearch] = React.useState("")
  const [positionFilter, setPositionFilter] = React.useState<PositionFilter>("all")
  const [positionSort, setPositionSort] = React.useState<PositionSort>("largest")

  React.useEffect(() => {
    setActiveTab("overview")
    setEditingPortfolio(false)
    setDeletingPortfolio(false)
    setBalanceDialog(null)
    setDeletingBalance(null)
    setPositionDialog(null)
    setDeletingPosition(null)
    setCsvDialogOpen(false)
    setTradeSheetOpen(false)
    setPositionSearch("")
    setPositionFilter("all")
    setPositionSort("largest")
  }, [portfolioId])

  const portfolioQuery = useQuery({
    enabled: Boolean(portfolioId),
    queryKey: queryKeys.portfolio(portfolioId),
    queryFn: () => api.getPortfolio(portfolioId),
  })

  const balancesQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.balances(portfolioId),
    queryFn: () => api.listBalances(portfolioId),
  })

  const positionsQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.positions(portfolioId),
    queryFn: () => api.listPositions(portfolioId),
  })

  const operationsQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.trades(portfolioId),
    queryFn: () => api.listTradingOperations(portfolioId),
  })

  const symbols = React.useMemo(
    () => sortPositions(positionsQuery.data ?? []).map((position) => position.symbol),
    [positionsQuery.data],
  )

  const marketQuery = useQuery({
    enabled: portfolioQuery.isSuccess && symbols.length > 0,
    queryKey: queryKeys.marketData(portfolioId, symbols),
    queryFn: () => api.getMarketQuotes(portfolioId, symbols),
  })

  const portfolio = portfolioQuery.data
  const balances = React.useMemo(
    () => sortBalances(balancesQuery.data ?? []),
    [balancesQuery.data],
  )
  const positions = React.useMemo(
    () => sortPositions(positionsQuery.data ?? []),
    [positionsQuery.data],
  )
  const operations = React.useMemo(
    () => sortOperations(operationsQuery.data ?? []),
    [operationsQuery.data],
  )
  const quotes = React.useMemo(
    () => marketQuery.data?.quotes ?? [],
    [marketQuery.data?.quotes],
  )
  const warnings = React.useMemo(
    () => marketQuery.data?.warnings ?? [],
    [marketQuery.data?.warnings],
  )
  const quoteMap = React.useMemo(
    () => new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote])),
    [quotes],
  )
  const positionRows = React.useMemo<PositionTableRow[]>(
    () =>
      positions
        .map((position) => {
          const quantity = decimalToNumber(position.quantity)
          const averageCost = decimalToNumber(position.averageCost)
          const quote = quoteMap.get(position.symbol.toUpperCase())
          const indicativePrice = quote ? decimalToNumber(quote.price) : null

          return {
            ...position,
            bookValue: quantity * averageCost,
            indicativePrice,
            indicativeValue:
              indicativePrice === null ? null : quantity * indicativePrice,
            quoteStatus: getQuoteStatus(quote),
          }
        })
        .sort(
          (left, right) =>
            (right.indicativeValue ?? right.bookValue) -
            (left.indicativeValue ?? left.bookValue),
        ),
    [positions, quoteMap],
  )
  const filteredPositions = React.useMemo(() => {
    const searchValue = positionSearch.trim().toLowerCase()

    const rows = positionRows.filter((row) => {
      const matchesSearch =
        searchValue.length === 0 ||
        row.symbol.toLowerCase().includes(searchValue) ||
        row.name?.toLowerCase().includes(searchValue)

      const matchesFilter =
        positionFilter === "all" ||
        (positionFilter === "quoted" && row.indicativeValue !== null) ||
        (positionFilter === "unquoted" && row.indicativeValue === null)

      return matchesSearch && matchesFilter
    })

    return [...rows].sort((left, right) => {
      if (positionSort === "symbol") {
        return left.symbol.localeCompare(right.symbol)
      }

      if (positionSort === "updated") {
        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      }

      return (right.indicativeValue ?? right.bookValue) - (left.indicativeValue ?? left.bookValue)
    })
  }, [positionFilter, positionRows, positionSearch, positionSort])
  const latestQuoteAsOf = React.useMemo(() => {
    const timestamps = quotes
      .map((quote) => quote.asOf)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())

    if (timestamps.length === 0) {
      return null
    }

    return new Date(Math.max(...timestamps)).toISOString()
  }, [quotes])
  const quoteFeedStatus = React.useMemo<FeedStatus>(() => {
    if (symbols.length === 0) {
      return "unavailable"
    }

    if (marketQuery.error || (!marketQuery.isPending && quotes.length === 0)) {
      return "unavailable"
    }

    if (quotes.some((quote) => quote.isStale)) {
      return "stale"
    }

    return "delayed"
  }, [marketQuery.error, marketQuery.isPending, quotes, symbols.length])
  const primaryWarning = React.useMemo(() => {
    if (balances.length === 0) {
      return "Add a settlement balance before running simulated buys or sells."
    }

    if (warnings.length > 0) {
      return warnings[0]
    }

    if (marketQuery.error) {
      return getErrorMessage(marketQuery.error)
    }

    if (symbols.length === 0) {
      return "Add a position to load quotes."
    }

    return "None"
  }, [balances.length, marketQuery.error, symbols.length, warnings])
  const metrics = React.useMemo(
    () =>
      buildWorkspaceMetrics({
        balances,
        positions,
        quotes,
        warnings,
        operations,
      }),
    [balances, operations, positions, quotes, warnings],
  )

  if (portfolioQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-[1.75rem]" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-28 w-full rounded-3xl" key={index} />
          ))}
        </div>
        <Skeleton className="h-14 w-full rounded-[1.5rem]" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.95fr)]">
          <Skeleton className="h-[22rem] w-full rounded-3xl" />
          <Skeleton className="h-[22rem] w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (portfolioQuery.error && isNotFoundError(portfolioQuery.error)) {
    return (
      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardContent className="py-16">
          <EmptyState
            action={
              <Button asChild className="rounded-full">
                <Link to="/portfolios">Return to portfolio register</Link>
              </Button>
            }
            icon={SearchX}
            title="That portfolio no longer exists"
          >
            The selected route is stale or the portfolio was deleted. Choose another portfolio from the sidebar or start a fresh one.
          </EmptyState>
        </CardContent>
      </Card>
    )
  }

  if (!portfolio) {
    return (
      <StatusCallout title="Portfolio unavailable" tone="error">
        {getErrorMessage(portfolioQuery.error)}
      </StatusCallout>
    )
  }

  const chartData = metrics.allocationRows.slice(0, 6).map((row) => ({
    symbol: row.symbol,
    indicativeValue: row.currentValue,
    costBasis: row.costBasis,
  }))

  const chartConfig = {
    indicativeValue: {
      label: "Indicative value",
      color: "var(--chart-1)",
    },
    costBasis: {
      label: "Cost basis",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  const overviewPositions = positionRows.slice(0, 5)
  const overviewBalances = balances.slice(0, 3)
  const recentOperations = operations.slice(0, 5)

  return (
    <div className="space-y-6">
      <Card className="max-w-5xl overflow-hidden border-border/80 bg-background/92 shadow-sm">
        <CardContent className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:px-6">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="min-w-0 font-[var(--font-display)] text-3xl tracking-tight md:text-4xl">
                {portfolio.name}
              </CardTitle>
              <Badge className="rounded-full border border-slate-950/10 bg-slate-950 px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white hover:bg-slate-950">
                {portfolio.baseCurrency}
              </Badge>
              <FeedStatusBadge status={quoteFeedStatus} />
            </div>

            {portfolio.description ? (
              <CardDescription className="max-w-2xl text-sm leading-6 text-slate-700">
                {portfolio.description}
              </CardDescription>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>Updated {formatDateTime(portfolio.updatedAt)}</span>
              <span aria-hidden="true">•</span>
              <span>
                {portfolio.positionCount} {pluralize(portfolio.positionCount, "position")}
              </span>
              <span aria-hidden="true">•</span>
              <span>
                {portfolio.balanceCount} {pluralize(portfolio.balanceCount, "balance")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:max-w-md md:justify-end">
            <Button
              className="rounded-full"
              onClick={() => {
                setActiveTab("positions")
                setPositionDialog("create")
              }}
              size="sm"
            >
              <Plus className="size-4" />
              Add position
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                setActiveTab("balances")
                setBalanceDialog("create")
              }}
              size="sm"
              variant="outline"
            >
              <Wallet className="size-4" />
              Add balance
            </Button>
            <Button
              className="rounded-full"
              onClick={() => {
                setActiveTab("simulation-log")
                setTradeSheetOpen(true)
              }}
              size="sm"
              variant="outline"
            >
              <Coins className="size-4" />
              Simulate trade
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="rounded-full" size="sm" variant="ghost">
                  <MoreHorizontal className="size-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuItem
                  onClick={() => {
                    setActiveTab("positions")
                    setCsvDialogOpen(true)
                  }}
                >
                  Import CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditingPortfolio(true)}>
                  Edit portfolio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeletingPortfolio(true)}
                  variant="destructive"
                >
                  Delete portfolio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {balancesQuery.error || positionsQuery.error || operationsQuery.error ? (
        <StatusCallout title="Some portfolio data failed to load" tone="error">
          {[balancesQuery.error, positionsQuery.error, operationsQuery.error]
            .filter(Boolean)
            .map((error) => getErrorMessage(error))
            .join(" ")}
        </StatusCallout>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          actionLabel="Balances"
          detail={`${metrics.balanceCount} ${pluralize(metrics.balanceCount, "bucket")}`}
          icon={Wallet}
          label="Cash"
          onAction={() => setActiveTab("balances")}
          tone="authoritative"
          value={formatCompactCurrency(metrics.cashTotal, portfolio.baseCurrency)}
        />
        <WorkspaceMetricCard
          actionLabel="Positions"
          detail={`${metrics.positionCount} ${pluralize(metrics.positionCount, "position")}`}
          icon={BadgeDollarSign}
          label="Book value"
          onAction={() => setActiveTab("positions")}
          tone="neutral"
          value={formatCompactCurrency(metrics.costBasisTotal, portfolio.baseCurrency)}
        />
        <WorkspaceMetricCard
          actionLabel="Quotes"
          detail={`${Math.round(metrics.quoteCoverage * 100)}% covered`}
          icon={CandlestickChart}
          label="Indicative"
          onAction={() => setActiveTab("quotes")}
          tone="indicative"
          value={formatCompactCurrency(metrics.indicativeValueTotal, portfolio.baseCurrency)}
        />
        <WorkspaceMetricCard
          actionLabel="Log"
          detail={`${metrics.operationsCount} ${pluralize(metrics.operationsCount, "trade")}`}
          icon={Coins}
          label="Trades"
          onAction={() => setActiveTab("simulation-log")}
          tone="neutral"
          value={String(metrics.operationsCount)}
        />
      </div>

      <Tabs className="space-y-6" onValueChange={(value) => setActiveTab(value as WorkspaceTab)} value={activeTab}>
        <div className="rounded-[1.5rem] border border-border/80 bg-background/85 px-4 py-3 shadow-sm">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-none bg-transparent p-0" variant="line">
            <TabsTrigger className="rounded-full px-4 py-2 data-active:bg-background data-active:shadow-sm" value="overview">
              Overview
            </TabsTrigger>
            <TabsTrigger className="rounded-full px-4 py-2 data-active:bg-background data-active:shadow-sm" value="positions">
              Positions
            </TabsTrigger>
            <TabsTrigger className="rounded-full px-4 py-2 data-active:bg-background data-active:shadow-sm" value="balances">
              Balances
            </TabsTrigger>
            <TabsTrigger className="rounded-full px-4 py-2 data-active:bg-background data-active:shadow-sm" value="simulation-log">
              Simulation log
            </TabsTrigger>
            <TabsTrigger className="rounded-full px-4 py-2 data-active:bg-background data-active:shadow-sm" value="quotes">
              Quotes
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent className="space-y-4" value="overview">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
            <Card className="border-border/80 bg-background/92 shadow-sm">
              <CardContent className="px-6 py-5">
                <Tabs className="space-y-4" defaultValue="exposure">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <CardTitle className="font-[var(--font-display)] text-3xl">Exposure</CardTitle>
                    <TabsList className="h-auto rounded-full bg-secondary/70 p-1" variant="default">
                      <TabsTrigger className="rounded-full px-4 py-2" value="exposure">
                        Chart
                      </TabsTrigger>
                      <TabsTrigger className="rounded-full px-4 py-2" value="quote-board">
                        Quotes
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="exposure">
                    {chartData.length === 0 ? (
                      <EmptyState icon={CandlestickChart} title="No positions">
                        Add a position or import CSV.
                      </EmptyState>
                    ) : (
                      <ChartContainer className="h-[280px] w-full" config={chartConfig}>
                        <BarChart accessibilityLayer data={chartData} margin={{ left: 8, right: 8, top: 12 }}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="symbol" tickLine={false} axisLine={false} tickMargin={8} />
                          <YAxis hide />
                          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={false} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Bar dataKey="indicativeValue" fill="var(--color-indicativeValue)" radius={[10, 10, 0, 0]} />
                          <Bar dataKey="costBasis" fill="var(--color-costBasis)" radius={[10, 10, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </TabsContent>

                  <TabsContent value="quote-board">
                    {symbols.length === 0 ? (
                      <EmptyState icon={CandlestickChart} title="No quotes">
                        Add a position.
                      </EmptyState>
                    ) : marketQuery.isPending ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }, (_, index) => (
                          <Skeleton className="h-24 w-full rounded-2xl" key={index} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {warnings.length > 0 ? (
                          <StatusCallout title="Quote warning" tone="warning">
                            {warnings.join(" ")}
                          </StatusCallout>
                        ) : null}
                        {marketQuery.error ? (
                          <StatusCallout details={getErrorDetails(marketQuery.error)} title="Quotes unavailable" tone="error">
                            {getErrorMessage(marketQuery.error)}
                          </StatusCallout>
                        ) : null}
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {quotes.map((quote) => (
                            <Card className="border-border/70 bg-[rgba(237,244,246,0.72)] shadow-none" key={quote.symbol}>
                              <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                                      {quote.provider.replaceAll("_", " ")}
                                    </p>
                                    <p className="mt-1 font-[var(--font-display)] text-3xl">{quote.symbol}</p>
                                  </div>
                                  <FeedStatusBadge status={getQuoteStatus(quote)} />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-2xl font-semibold text-foreground">
                                    {formatCurrency(quote.price, quote.currency)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    As of {formatDateTime(quote.asOf)}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-background/92 shadow-sm">
              <CardHeader className="border-b border-border/60 px-6 pb-4">
                <CardTitle className="font-[var(--font-display)] text-3xl">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-6 py-5">
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Balance readiness
                    </p>
                    <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", balances.length > 0 ? "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10" : "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10")}>
                      {balances.length > 0 ? "Ready" : "Missing"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {balances.length > 0
                      ? `${balances.length} ${pluralize(balances.length, "balance")}`
                      : "Add a balance to trade."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Trade simulation
                    </p>
                    <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", balances.length > 0 ? "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10" : "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10")}>
                      {balances.length > 0 ? "Enabled" : "Blocked"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {balances.length > 0 ? "Use Simulate trade." : "Add a balance first."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 bg-[rgba(237,244,246,0.72)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Latest quote state
                    </p>
                    <FeedStatusBadge status={quoteFeedStatus} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {latestQuoteAsOf
                      ? `Updated ${formatDateTime(latestQuoteAsOf)}`
                      : "No quote data."}
                  </p>
                </div>

                {primaryWarning !== "None" ? (
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Warnings
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{primaryWarning}</p>
                    {!balances.length ? (
                      <Button
                        className="mt-4 rounded-full"
                        onClick={() => {
                          setActiveTab("balances")
                          setBalanceDialog("create")
                        }}
                        size="sm"
                      >
                        <Plus className="size-4" />
                        Add balance
                      </Button>
                    ) : warnings.length > 0 || marketQuery.error ? (
                      <Button className="mt-4 rounded-full" onClick={() => setActiveTab("quotes")} size="sm" variant="outline">
                        Review quotes
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/80 bg-background/92 shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
              <CardTitle className="font-[var(--font-display)] text-3xl">Positions</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" onClick={() => setActiveTab("positions")} size="sm" variant="outline">
                  View all
                </Button>
                <Button
                  className="rounded-full"
                  onClick={() => {
                    setActiveTab("positions")
                    setPositionDialog("create")
                  }}
                  size="sm"
                >
                  <Plus className="size-4" />
                  Add position
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {positionsQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : overviewPositions.length === 0 ? (
                <EmptyState
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="rounded-full"
                        onClick={() => {
                          setActiveTab("positions")
                          setPositionDialog("create")
                        }}
                      >
                        <Plus className="size-4" />
                        Add manually
                      </Button>
                      <Button
                        className="rounded-full"
                        onClick={() => {
                          setActiveTab("positions")
                          setCsvDialogOpen(true)
                        }}
                        variant="outline"
                      >
                        <FileSpreadsheet className="size-4" />
                        Import CSV
                      </Button>
                    </div>
                  }
                  icon={Landmark}
                  title="No positions yet"
                >
                  Add a position or import CSV.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead className="hidden lg:table-cell">Name</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Avg cost</TableHead>
                        <TableHead>Book value</TableHead>
                        <TableHead>Indicative px</TableHead>
                        <TableHead>Indicative value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overviewPositions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">{position.symbol}</TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                            {position.name || "-"}
                          </TableCell>
                          <TableCell>{formatDecimal(position.quantity, 4)}</TableCell>
                          <TableCell>{formatCurrency(position.averageCost, position.currency)}</TableCell>
                          <TableCell>{formatCurrency(position.bookValue, position.currency)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {position.indicativePrice === null
                              ? "--"
                              : formatCurrency(position.indicativePrice, position.currency)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {position.indicativeValue === null
                                  ? "--"
                                  : formatCurrency(position.indicativeValue, position.currency)}
                              </span>
                              <FeedStatusBadge status={position.quoteStatus} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80 bg-background/92 shadow-sm">
              <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
                <CardTitle className="font-[var(--font-display)] text-3xl">Balances</CardTitle>
                <Button className="rounded-full" onClick={() => setActiveTab("balances")} size="sm" variant="outline">
                  View all
                </Button>
              </CardHeader>
              <CardContent className="px-6 py-5">
                {balancesQuery.isPending ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                    ))}
                  </div>
                ) : overviewBalances.length === 0 ? (
                  <EmptyState
                    action={
                      <Button
                        className="rounded-full"
                        onClick={() => {
                          setActiveTab("balances")
                          setBalanceDialog("create")
                        }}
                      >
                        <Plus className="size-4" />
                        Add balance
                      </Button>
                    }
                    icon={Wallet}
                    title="No settlement balances yet"
                  >
                    Add at least one balance before running simulated buys or sells.
                  </EmptyState>
                ) : (
                  <div className="space-y-3">
                    {overviewBalances.map((balance) => (
                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-4" key={balance.id}>
                        <div>
                          <p className="font-medium text-foreground">{balance.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Updated {formatDate(balance.updatedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {formatCurrency(balance.amount, balance.currency)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{balance.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-background/92 shadow-sm">
              <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
                <CardTitle className="font-[var(--font-display)] text-3xl">Simulations</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full" onClick={() => setActiveTab("simulation-log")} size="sm" variant="outline">
                    Open log
                  </Button>
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setActiveTab("simulation-log")
                      setTradeSheetOpen(true)
                    }}
                    size="sm"
                  >
                    Simulate trade
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-5">
                {operationsQuery.isPending ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }, (_, index) => (
                      <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                    ))}
                  </div>
                ) : recentOperations.length === 0 ? (
                  <EmptyState icon={Coins} title="No trades">
                    Use Simulate trade.
                  </EmptyState>
                ) : (
                  <div className="space-y-3">
                    {recentOperations.map((operation) => {
                      const gross =
                        decimalToNumber(operation.quantity) * decimalToNumber(operation.price)
                      const cashImpact =
                        operation.side === "SELL"
                          ? gross - decimalToNumber(operation.commission)
                          : -1 * (gross + decimalToNumber(operation.commission))

                      return (
                        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-4" key={operation.id}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", operation.side === "BUY" ? "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10" : "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10")}>
                                {operation.side}
                              </Badge>
                              <p className="font-medium text-foreground">{operation.symbol}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(operation.executedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">
                              {formatSignedCurrency(cashImpact, operation.currency)}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {operation.balanceLabel}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="positions">
          <Card className="border-border/80 bg-background/92 shadow-sm">
            <CardHeader className="gap-4 border-b border-border/60 px-6 pb-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <CardTitle className="font-[var(--font-display)] text-3xl">Positions</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Button className="rounded-full" onClick={() => setCsvDialogOpen(true)} size="sm" variant="outline">
                    <FileSpreadsheet className="size-4" />
                    Import CSV
                  </Button>
                  <Button className="rounded-full" onClick={() => setPositionDialog("create")} size="sm">
                    <Plus className="size-4" />
                    Add position
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_180px_220px]">
                <Input onChange={(event) => setPositionSearch(event.target.value)} placeholder="Search symbol or name" value={positionSearch} />
                <Select onValueChange={(value) => setPositionFilter(value as PositionFilter)} value={positionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All positions</SelectItem>
                    <SelectItem value="quoted">Quoted only</SelectItem>
                    <SelectItem value="unquoted">Awaiting quotes</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={(value) => setPositionSort(value as PositionSort)} value={positionSort}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="largest">Largest position</SelectItem>
                    <SelectItem value="symbol">Symbol A-Z</SelectItem>
                    <SelectItem value="updated">Recently updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {positionsQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : positions.length === 0 ? (
                <EmptyState
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button className="rounded-full" onClick={() => setPositionDialog("create")}>
                        <Plus className="size-4" />
                        Add manually
                      </Button>
                      <Button className="rounded-full" onClick={() => setCsvDialogOpen(true)} variant="outline">
                        <FileSpreadsheet className="size-4" />
                        Import CSV
                      </Button>
                    </div>
                  }
                  icon={Landmark}
                  title="No positions yet"
                >
                  Add a position or import CSV.
                </EmptyState>
              ) : filteredPositions.length === 0 ? (
                <EmptyState
                  action={
                    <Button
                      className="rounded-full"
                      onClick={() => {
                        setPositionSearch("")
                        setPositionFilter("all")
                        setPositionSort("largest")
                      }}
                      variant="outline"
                    >
                      Reset filters
                    </Button>
                  }
                  icon={SearchX}
                  title="No positions match this view"
                >
                  Try another filter.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Avg cost</TableHead>
                        <TableHead>Book value</TableHead>
                        <TableHead>Indicative px</TableHead>
                        <TableHead>Indicative value</TableHead>
                        <TableHead className="hidden xl:table-cell">Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPositions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">{position.symbol}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{position.name || "-"}</TableCell>
                          <TableCell>{formatDecimal(position.quantity, 4)}</TableCell>
                          <TableCell>{formatCurrency(position.averageCost, position.currency)}</TableCell>
                          <TableCell>{formatCurrency(position.bookValue, position.currency)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {position.indicativePrice === null ? "--" : formatCurrency(position.indicativePrice, position.currency)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>
                                {position.indicativeValue === null ? "--" : formatCurrency(position.indicativeValue, position.currency)}
                              </span>
                              <FeedStatusBadge status={position.quoteStatus} />
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                            {formatDate(position.updatedAt)}
                          </TableCell>
                          <TableCell>
                            <div className="hidden justify-end gap-1 md:flex">
                              <Button className="rounded-full" onClick={() => setPositionDialog(position)} size="sm" variant="ghost">
                                Edit
                              </Button>
                              <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingPosition(position)} size="sm" variant="ghost">
                                Delete
                              </Button>
                            </div>
                            <div className="flex justify-end md:hidden">
                              <RowActionMenu editLabel="Edit position" onDelete={() => setDeletingPosition(position)} onEdit={() => setPositionDialog(position)} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="balances">
          <Card className="border-border/80 bg-background/92 shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-5 md:flex-row md:items-end md:justify-between">
              <CardTitle className="font-[var(--font-display)] text-3xl">Balances</CardTitle>
              <Button className="rounded-full" onClick={() => setBalanceDialog("create")} size="sm">
                <Plus className="size-4" />
                Add balance
              </Button>
            </CardHeader>
            <CardContent className="px-6 py-5">
              {balancesQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : balances.length === 0 ? (
                <EmptyState
                  action={
                    <Button className="rounded-full" onClick={() => setBalanceDialog("create")}>
                      <Plus className="size-4" />
                      Add balance
                    </Button>
                  }
                  icon={Wallet}
                  title="No settlement balances yet"
                >
                  Add a balance.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead className="hidden lg:table-cell">Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances.map((balance) => (
                        <TableRow key={balance.id}>
                          <TableCell className="font-medium">{balance.label}</TableCell>
                          <TableCell>{formatCurrency(balance.amount, balance.currency)}</TableCell>
                          <TableCell>{balance.currency}</TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                            {formatDateTime(balance.updatedAt)}
                          </TableCell>
                          <TableCell>
                            <div className="hidden justify-end gap-1 md:flex">
                              <Button className="rounded-full" onClick={() => setBalanceDialog(balance)} size="sm" variant="ghost">
                                Edit
                              </Button>
                              <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingBalance(balance)} size="sm" variant="ghost">
                                Delete
                              </Button>
                            </div>
                            <div className="flex justify-end md:hidden">
                              <RowActionMenu editLabel="Edit balance" onDelete={() => setDeletingBalance(balance)} onEdit={() => setBalanceDialog(balance)} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="simulation-log">
          <Card className="border-border/80 bg-background/92 shadow-sm">
            <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-5 md:flex-row md:items-end md:justify-between">
              <CardTitle className="font-[var(--font-display)] text-3xl">Simulation log</CardTitle>
              <div className="flex flex-wrap gap-2">
                {!balances.length ? (
                  <Button className="rounded-full" onClick={() => setBalanceDialog("create")} size="sm" variant="outline">
                    <Plus className="size-4" />
                    Add balance
                  </Button>
                ) : null}
                <Button className="rounded-full" onClick={() => setTradeSheetOpen(true)} size="sm">
                  Simulate trade
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-5">
              {!balances.length ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-950">
                  Add a balance to trade.
                </div>
              ) : null}

              {operationsQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : operations.length === 0 ? (
                <EmptyState icon={Coins} title="No trades">
                  Use Simulate trade.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Executed</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Cash impact</TableHead>
                        <TableHead className="hidden lg:table-cell">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.map((operation) => {
                        const gross = decimalToNumber(operation.quantity) * decimalToNumber(operation.price)
                        const cashImpact =
                          operation.side === "SELL"
                            ? gross - decimalToNumber(operation.commission)
                            : -1 * (gross + decimalToNumber(operation.commission))

                        return (
                          <TableRow key={operation.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDateTime(operation.executedAt)}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", operation.side === "BUY" ? "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10" : "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10")}>
                                {operation.side}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{operation.symbol}</TableCell>
                            <TableCell>{formatDecimal(operation.quantity, 4)}</TableCell>
                            <TableCell>{formatCurrency(operation.price, operation.currency)}</TableCell>
                            <TableCell>{formatCurrency(operation.commission, operation.currency)}</TableCell>
                            <TableCell>{formatSignedCurrency(cashImpact, operation.currency)}</TableCell>
                            <TableCell className="hidden lg:table-cell">{operation.balanceLabel}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="quotes">
          <Card className="border-border/80 bg-[rgba(237,244,246,0.72)] shadow-none">
            <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-5 md:flex-row md:items-end md:justify-between">
              <CardTitle className="font-[var(--font-display)] text-3xl">Quotes</CardTitle>
              <FeedStatusBadge status={quoteFeedStatus} />
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-5">
              {symbols.length === 0 ? (
                <EmptyState icon={CandlestickChart} title="No quotes">
                  Add a position.
                </EmptyState>
              ) : marketQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : (
                <>
                  {warnings.length > 0 ? (
                    <StatusCallout title="Quote warning" tone="warning">
                      {warnings.join(" ")}
                    </StatusCallout>
                  ) : null}
                  {marketQuery.error ? (
                    <StatusCallout details={getErrorDetails(marketQuery.error)} title="Quotes unavailable" tone="error">
                      {getErrorMessage(marketQuery.error)}
                    </StatusCallout>
                  ) : null}
                  {quotes.length === 0 ? (
                    <EmptyState icon={SearchX} title="No quotes returned">
                      No quote data.
                    </EmptyState>
                  ) : (
                    <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/70">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Last price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotes.map((quote) => (
                            <TableRow key={quote.symbol}>
                              <TableCell className="font-medium">{quote.symbol}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {quote.provider.replaceAll("_", " ")}
                              </TableCell>
                              <TableCell>{formatCurrency(quote.price, quote.currency)}</TableCell>
                              <TableCell>
                                <FeedStatusBadge status={getQuoteStatus(quote)} />
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDateTime(quote.asOf)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet onOpenChange={setTradeSheetOpen} open={tradeSheetOpen}>
        <SheetContent
          className={cn(
            "gap-0 overflow-hidden border-border/80 p-0",
            isMobile ? "h-[100dvh] max-h-[100dvh] w-full rounded-none" : "w-full sm:max-w-2xl",
          )}
          side={isMobile ? "bottom" : "right"}
        >
          <SheetHeader className="border-b border-border/70 px-6 py-5">
            <SheetTitle className="font-[var(--font-display)] text-3xl">Simulate trade</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <TradingOperationForm
              balances={balances}
              currency={portfolio.baseCurrency}
              onCancel={() => setTradeSheetOpen(false)}
              onSubmitted={() => {
                setTradeSheetOpen(false)
                setActiveTab("simulation-log")
              }}
              portfolioId={portfolio.id}
              positions={positions}
            />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <PortfolioFormDialog
        onOpenChange={setEditingPortfolio}
        onSuccess={() => setEditingPortfolio(false)}
        open={editingPortfolio}
        portfolio={portfolio}
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
      <CsvImportDialog onOpenChange={setCsvDialogOpen} open={csvDialogOpen} portfolioId={portfolio.id} />

      <ConfirmDeleteDialog
        confirmLabel="Delete portfolio"
        description="This removes the portfolio and its related balances, positions, and simulated trade history."
        onConfirm={async () => {
          await api.deletePortfolio(portfolio.id)
          await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })
          toast.success("Portfolio deleted")
          navigate("/portfolios")
        }}
        onOpenChange={setDeletingPortfolio}
        open={deletingPortfolio}
        title="Delete this portfolio?"
      />
      <ConfirmDeleteDialog
        confirmLabel="Delete balance"
        description={deletingBalance ? `Delete ${deletingBalance.label} from ${portfolio.name}.` : ""}
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
      <ConfirmDeleteDialog
        confirmLabel="Delete position"
        description={deletingPosition ? `Delete ${deletingPosition.symbol} from ${portfolio.name}.` : ""}
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
    </div>
  )
}
