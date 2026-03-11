import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import { useParams } from "react-router-dom"

import { api, type MarketHistoryRange } from "@/lib/api"
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPercentage,
} from "@/lib/format"
import {
  assetHasDistinctName,
  getAssetDisplayName,
  getBenchmarkForMarket,
  type AssetAnalysisRow,
} from "@/lib/portfolio-analytics"
import { queryKeys } from "@/lib/query-keys"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  EmptyState,
  FeedStatusBadge,
  StatusCallout,
  formatSignedCurrency,
} from "@/components/portfolios/shared"
import { usePortfolioWorkspace } from "@/components/portfolios/portfolio-workspace-layout"
import { Link } from "react-router-dom"

const trendConfig = {
  asset: { color: "var(--chart-1)", label: "Asset" },
  benchmark: { color: "var(--chart-2)", label: "Benchmark" },
} satisfies ChartConfig

const historyRanges: Array<{ label: string; value: MarketHistoryRange }> = [
  { label: "1M", value: "1mo" },
  { label: "3M", value: "3mo" },
  { label: "YTD", value: "ytd" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "max" },
]

export function AssetDetailPage() {
  const { symbol = "" } = useParams()
  const { dashboard, operations, portfolio } = usePortfolioWorkspace()
  const [range, setRange] = React.useState<MarketHistoryRange>("3mo")

  const decodedSymbol = decodeURIComponent(symbol).toUpperCase()
  const asset =
    dashboard.assetRows.find((row) => row.symbol === decodedSymbol) ?? null

  const benchmark = asset ? getBenchmarkForMarket(asset.market) : null
  const historySymbols = benchmark
    ? [asset?.symbol ?? decodedSymbol, benchmark.symbol]
    : [asset?.symbol ?? decodedSymbol]
  const historyQuery = useQuery({
    enabled: Boolean(portfolio?.id) && Boolean(asset?.symbol),
    queryKey: queryKeys.marketHistory(portfolio?.id ?? "", historySymbols, range),
    queryFn: () => api.getMarketHistory(portfolio!.id, historySymbols, range),
  })
  const trendRows = React.useMemo(
    () => buildTrendRows(asset, historyQuery.data, benchmark?.symbol ?? null),
    [asset, benchmark?.symbol, historyQuery.data],
  )
  const assetOperations = operations.filter(
    (operation) => operation.symbol.toUpperCase() === decodedSymbol,
  )

  if (!portfolio) {
    return null
  }

  if (!asset) {
    return (
      <Card className="border-border/80 bg-background/92 shadow-sm">
        <CardContent className="py-16">
          <EmptyState icon={() => null} title="Asset not found">
            The requested symbol is not available in this portfolio anymore.
          </EmptyState>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Current market value"
          value={formatCurrency(asset.currentValue, portfolio.baseCurrency)}
        />
        <MetricCard
          label="Floating P&L"
          value={formatSignedCurrency(asset.floatingPnl, portfolio.baseCurrency)}
        />
        <MetricCard
          label="Floating P&L rate"
          value={formatPercentage(asset.floatingPnlRate)}
        />
        <MetricCard
          label="Cumulative P&L"
          value={formatSignedCurrency(asset.cumulativePnl, portfolio.baseCurrency)}
        />
      </div>

      <Card className="border-border/80 bg-background/92 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-[var(--font-display)] text-3xl">
              {getAssetDisplayName(asset.name, asset.symbol)}
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {assetHasDistinctName(asset.name, asset.symbol) ? (
                <>
                  <span>{asset.symbol}</span>
                  <span aria-hidden="true">•</span>
                </>
              ) : null}
              <span>{asset.market}</span>
              <FeedStatusBadge status={asset.quoteStatus} />
            </div>
          </div>
          <Tabs onValueChange={(value) => setRange(value as MarketHistoryRange)} value={range}>
            <TabsList className="h-auto rounded-full bg-secondary/70 p-1" variant="default">
              {historyRanges.map((item) => (
                <TabsTrigger className="rounded-full px-4 py-2" key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-5 px-6 py-5">
          {historyQuery.error ? (
            <StatusCallout title="Trend unavailable" tone="warning">
              Historical prices are reference-only and may be temporarily unavailable.
            </StatusCallout>
          ) : null}
          {historyQuery.data?.warnings.length ? (
            <StatusCallout title="History warning" tone="warning">
              {historyQuery.data.warnings.join(" ")}
            </StatusCallout>
          ) : null}

          {historyQuery.isPending ? (
            <div className="h-[22rem] rounded-[1.75rem] border border-border/70 bg-muted/20" />
          ) : trendRows.length === 0 ? (
            <EmptyState icon={() => null} title="No trend data">
              Historical prices were not available for the selected range.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>
                  Asset return {formatPercentage(trendRows[trendRows.length - 1]?.asset ?? 0)}
                </span>
                {benchmark ? (
                  <span>
                    {benchmark.label} {formatPercentage(trendRows[trendRows.length - 1]?.benchmark ?? 0)}
                  </span>
                ) : null}
              </div>
              <ChartContainer className="h-[22rem] w-full" config={trendConfig}>
                <LineChart accessibilityLayer data={trendRows} margin={{ left: 12, right: 12, top: 12 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={32}
                  />
                  <YAxis
                    tickFormatter={(value) => formatPercentage(value as number)}
                    tickLine={false}
                    axisLine={false}
                    width={64}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatPercentage(value as number)}
                        indicator="line"
                      />
                    }
                  />
                  <Line
                    dataKey="asset"
                    dot={false}
                    stroke="var(--color-asset)"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                  {benchmark ? (
                    <Line
                      dataKey="benchmark"
                      dot={false}
                      stroke="var(--color-benchmark)"
                      strokeWidth={2}
                      type="monotone"
                    />
                  ) : null}
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-background/92 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
          <CardTitle className="font-[var(--font-display)] text-3xl">
            Asset history
          </CardTitle>
          <Button asChild className="rounded-full" size="sm" variant="outline">
            <Link to={`/portfolios/${portfolio.id}/transactions`}>
              Open full history
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 px-6 py-5">
          {assetOperations.length === 0 ? (
            <EmptyState icon={() => null} title="No transactions for this asset">
              Once this symbol is traded in the simulator, the records will appear here.
            </EmptyState>
          ) : (
            assetOperations.map((operation) => {
              // Calculate cash impact based on operation type
              let cashImpact: number
              if (operation.side === "BUY" || operation.side === "SELL") {
                const gross = Number(operation.quantity) * Number(operation.price)
                cashImpact =
                  operation.side === "SELL"
                    ? gross - Number(operation.commission)
                    : -1 * (gross + Number(operation.commission))
              } else if (operation.side === "DIVIDEND") {
                cashImpact = Number(operation.dividendAmount) - Number(operation.commission)
              } else {
                cashImpact = 0
              }
              return (
                <div
                  className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                  key={operation.id}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {operation.side} {operation.symbol}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
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
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/80 bg-background/92 shadow-sm">
      <CardContent className="px-5 py-5">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 font-[var(--font-display)] text-4xl tracking-tight text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function buildTrendRows(
  asset: AssetAnalysisRow | null,
  historyData:
    | Awaited<ReturnType<typeof api.getMarketHistory>>
    | undefined,
  benchmarkSymbol: string | null,
) {
  if (!asset || !historyData) {
    return []
  }

  const assetSeries = historyData.series.find((series) => series.symbol === asset.symbol)
  const benchmarkSeries = benchmarkSymbol
    ? historyData.series.find((series) => series.symbol === benchmarkSymbol)
    : null

  if (!assetSeries || assetSeries.points.length === 0) {
    return []
  }

  const assetStart = Number(assetSeries.points[0]?.close ?? 0)
  const benchmarkStart = benchmarkSeries?.points[0]
    ? Number(benchmarkSeries.points[0].close)
    : 0
  const benchmarkMap = new Map(
    (benchmarkSeries?.points ?? []).map((point) => [point.at, Number(point.close)]),
  )

  return assetSeries.points.map((point) => ({
    asset:
      assetStart > 0 ? Number(point.close) / assetStart - 1 : 0,
    benchmark:
      benchmarkStart > 0 && benchmarkMap.has(point.at)
        ? benchmarkMap.get(point.at)! / benchmarkStart - 1
        : null,
    label: formatDate(point.at),
  }))
}
