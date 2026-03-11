import * as React from "react"
import {
  FolderOpenDot,
  LineChart,
  PieChart as PieChartIcon,
} from "lucide-react"
import { Cell, Pie, PieChart } from "recharts"
import { Link } from "react-router-dom"

import {
  formatCurrency,
  formatPercentage,
} from "@/lib/format"
import {
  assetHasDistinctName,
  getAssetDisplayName,
  type MarketBucket,
} from "@/lib/portfolio-analytics"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { EmptyState } from "@/components/portfolios/shared"
import { usePortfolioWorkspace } from "@/components/portfolios/portfolio-workspace-layout"
import { useUserPreferences } from "@/hooks/use-user-preferences"

const pieConfig = {
  value: { label: "Value" },
  Cash: { color: "var(--chart-2)", label: "Cash" },
  Stocks: { color: "var(--chart-1)", label: "Stocks" },
  US: { color: "var(--chart-1)", label: "US" },
  HK: { color: "var(--chart-2)", label: "HK" },
  "A-Share": { color: "var(--chart-3)", label: "A-Share" },
  Other: { color: "var(--chart-4)", label: "Other" },
} satisfies ChartConfig

export function PortfolioAnalysisPage() {
  const { dashboard, portfolio } = usePortfolioWorkspace()
  const { preferences, updatePreferences } = useUserPreferences()
  const [marketFilter, setMarketFilter] = React.useState<"all" | MarketBucket>(
    "all",
  )
  const [rankingMode, setRankingMode] = React.useState<"gains" | "losses">(
    "gains",
  )
  const [dateFilter, setDateFilter] = React.useState<"all" | "1m" | "3m" | "6m" | "1y">(
    "all",
  )
  const [activeTab, setActiveTab] = React.useState<string>(
    preferences.defaultAnalysisTab || "pnl",
  )
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    updatePreferences({ defaultAnalysisTab: value })
  }

  if (!portfolio) {
    return null
  }

  const filterByDate = (assets: typeof dashboard.assetRows) => {
    if (dateFilter === "all") return assets
    const now = new Date()
    const cutoffDate = new Date()
    switch (dateFilter) {
      case "1m":
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case "1y":
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
    }
    return assets.filter((asset) => {
      const assetOps = dashboard.assetRows.find((a) => a.symbol === asset.symbol)
      return assetOps && new Date(assetOps.updatedAt) >= cutoffDate
    })
  }
  const filteredAssets = filterByDate(
    marketFilter === "all"
      ? dashboard.assetRows
      : dashboard.assetRows.filter((row) => row.market === marketFilter),
  )
  const rankedAssets =
    rankingMode === "gains"
      ? [...filteredAssets].sort(
          (left, right) => right.cumulativePnl - left.cumulativePnl,
        )
      : [...filteredAssets].sort(
          (left, right) => left.cumulativePnl - right.cumulativePnl,
        )

  return (
    <Tabs className="space-y-6" onValueChange={handleTabChange} value={activeTab}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-[var(--font-display)] text-4xl text-foreground">
            Analysis
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Derived insight from current holdings, delayed quotes, and trade history.
          </p>
        </div>
        <TabsList className="h-auto rounded-full bg-secondary/70 p-1" variant="default">
          <TabsTrigger className="rounded-full px-4 py-2" value="pnl">
            P&amp;L
          </TabsTrigger>
          <TabsTrigger className="rounded-full px-4 py-2" value="allocation">
            Allocation
          </TabsTrigger>
          <TabsTrigger className="rounded-full px-4 py-2" value="historical">
            Historical holdings
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent className="space-y-6" value="pnl">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Total profit"
            value={formatCurrency(dashboard.totalProfit, portfolio.baseCurrency)}
          />
          <MetricCard
            label="Total loss"
            value={formatCurrency(dashboard.totalLoss, portfolio.baseCurrency)}
          />
          <MetricCard
            label="Win rate"
            value={formatPercentage(dashboard.winRate)}
          />
        </div>

        <Card className="border-border/80 bg-background/92 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle className="font-[var(--font-display)] text-3xl">
                Ranked securities
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Filter by market and toggle between top gains and top losses.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select
                onValueChange={(value) =>
                  setDateFilter(value as typeof dateFilter)
                }
                value={dateFilter}
              >
                <SelectTrigger className="w-[180px] rounded-full bg-background/80">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="1m">Last month</SelectItem>
                  <SelectItem value="3m">Last 3 months</SelectItem>
                  <SelectItem value="6m">Last 6 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Select
                onValueChange={(value) =>
                  setMarketFilter(value as "all" | MarketBucket)
                }
                value={marketFilter}
              >
                <SelectTrigger className="w-[180px] rounded-full bg-background/80">
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="HK">HK</SelectItem>
                  <SelectItem value="A-Share">A-Share</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Tabs
                onValueChange={(value) =>
                  setRankingMode(value as "gains" | "losses")
                }
                value={rankingMode}
              >
                <TabsList className="h-auto rounded-full bg-secondary/70 p-1" variant="default">
                  <TabsTrigger className="rounded-full px-4 py-2" value="gains">
                    Top gains
                  </TabsTrigger>
                  <TabsTrigger className="rounded-full px-4 py-2" value="losses">
                    Top losses
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-5">
            {rankedAssets.length === 0 ? (
              <EmptyState icon={LineChart} title="No assets match this filter">
                Try a different market filter.
              </EmptyState>
            ) : (
              <div className="space-y-3">
                {rankedAssets.slice(0, 5).map((asset, index) => (
                  <Link
                    className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4 transition-colors hover:bg-muted/20"
                    key={asset.symbol}
                    to={`/portfolios/${portfolio.id}/assets/${encodeURIComponent(asset.symbol)}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {getAssetDisplayName(asset.name, asset.symbol)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {assetHasDistinctName(asset.name, asset.symbol)
                            ? `${asset.symbol} • ${asset.market}`
                            : asset.market}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {formatCurrency(
                          asset.cumulativePnl,
                          portfolio.baseCurrency,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatPercentage(asset.cumulativePnlRate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent className="space-y-6" value="allocation">
        <div className="grid gap-6 xl:grid-cols-2">
          <AllocationCard
            currency={portfolio.baseCurrency}
            data={dashboard.compositionByAssetClass}
            title="By asset class"
          />
          <AllocationCard
            currency={portfolio.baseCurrency}
            data={dashboard.compositionByMarket}
            title="By market"
          />
        </div>
      </TabsContent>

      <TabsContent className="space-y-6" value="historical">
        <Card className="border-border/80 bg-background/92 shadow-sm">
          <CardHeader className="border-b border-border/60 px-6 pb-4">
            <CardTitle className="font-[var(--font-display)] text-3xl">
              Historical holdings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5">
            {dashboard.historicalHoldings.length === 0 ? (
              <EmptyState icon={FolderOpenDot} title="No closed holdings yet">
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
                      <p className="font-medium text-foreground">{item.symbol}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.market} • {item.tradeCount} trade
                        {item.tradeCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {formatCurrency(
                          item.cumulativePnl,
                          portfolio.baseCurrency,
                        )}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.lastExecutedAt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
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

function AllocationCard({
  currency,
  data,
  title,
}: {
  currency: string
  data: Array<{ label: string; value: number; percentage: number }>
  title: string
}) {
  return (
    <Card className="border-border/80 bg-background/92 shadow-sm">
      <CardHeader className="border-b border-border/60 px-6 pb-4">
        <CardTitle className="font-[var(--font-display)] text-3xl">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 px-6 py-5 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:items-center">
        {data.length === 0 ? (
          <EmptyState icon={PieChartIcon} title="No allocation yet">
            Add balances or positions to see composition.
          </EmptyState>
        ) : (
          <>
            <ChartContainer className="mx-auto h-[220px] w-full max-w-[260px]" config={pieConfig}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={54}
                  outerRadius={84}
                  strokeWidth={2}
                >
                  {data.map((item) => (
                    <Cell
                      fill={getPieColor(item.label)}
                      key={item.label}
                    />
                  ))}
                </Pie>
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number, currency)} hideLabel />}
                />
              </PieChart>
            </ChartContainer>
            <div className="space-y-3">
              {data.map((item) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                  key={item.label}
                >
                  <div>
                    <p className="font-medium text-foreground">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatPercentage(item.percentage)}
                    </p>
                  </div>
                  <p className="font-medium text-foreground">
                    {formatCurrency(item.value, currency)}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function getPieColor(label: string) {
  if (label === "Cash") {
    return "var(--chart-2)"
  }

  if (label === "Stocks" || label === "US") {
    return "var(--chart-1)"
  }

  if (label === "HK") {
    return "var(--chart-2)"
  }

  if (label === "A-Share") {
    return "var(--chart-3)"
  }

  return "var(--chart-4)"
}
