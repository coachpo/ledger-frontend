import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  DollarSign,
  RefreshCw,
} from "lucide-react";

import { usePortfolios } from "@/hooks/use-portfolios";

import { MetricCard } from "./shared/metric-card";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

function formatDateLabel(value: string | null) {
  if (!value) {
    return "No updates yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data: portfolios = [], error, isError, isPending, refetch } = usePortfolios();

  const portfolioCount = portfolios.length;
  const totalPositions = portfolios.reduce(
    (sum, portfolio) => sum + portfolio.positionCount,
    0,
  );
  const totalBalances = portfolios.reduce(
    (sum, portfolio) => sum + portfolio.balanceCount,
    0,
  );
  const currencies = new Set(portfolios.map((portfolio) => portfolio.baseCurrency));
  const averagePositions = portfolioCount
    ? (totalPositions / portfolioCount).toFixed(1)
    : "0.0";
  const mostPositionedPortfolio = portfolios.reduce<(typeof portfolios)[number] | null>(
    (current, portfolio) => {
      if (!current || portfolio.positionCount > current.positionCount) {
        return portfolio;
      }

      return current;
    },
    null,
  );
  const mostRecentlyUpdatedPortfolio = [...portfolios].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )[0] ?? null;
  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Self-reflection stock analysis loop overview
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-lg">Unable to reach the portfolio API.</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Check the backend connection and try again."}
              </p>
            </div>
            <Button onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live portfolio inventory and stock-analysis workspace health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Briefcase}
          iconClassName="bg-blue-100 text-blue-700"
          note="Portfolio records syncing from the API"
          title="Active Portfolios"
          to="/portfolios"
          value={String(portfolioCount)}
        />
        <MetricCard
          icon={BarChart3}
          iconClassName="bg-emerald-100 text-emerald-700"
          note={`${averagePositions} positions per portfolio on average`}
          title="Total Positions"
          value={String(totalPositions)}
        />
        <MetricCard
          icon={DollarSign}
          iconClassName="bg-amber-100 text-amber-700"
          note="Cash and settlement balances tracked across portfolios"
          title="Balance Accounts"
          value={String(totalBalances)}
        />
        <MetricCard
          icon={ArrowUpRight}
          iconClassName="bg-sky-100 text-sky-700"
          note={formatDateLabel(mostRecentlyUpdatedPortfolio?.updatedAt ?? null)}
          title="Latest Update"
          to={mostRecentlyUpdatedPortfolio ? `/portfolios/${mostRecentlyUpdatedPortfolio.id}` : undefined}
          value={mostRecentlyUpdatedPortfolio?.name ?? "No portfolio data"}
          valueClassName="text-lg leading-tight"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                <Briefcase className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracked Currencies</p>
                <p className="text-lg">{currencies.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Position Load</p>
                <p className="text-lg">{averagePositions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                <ArrowUpRight className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Largest Portfolio Footprint</p>
                <p className="text-lg">
                  {mostPositionedPortfolio?.positionCount ?? 0} positions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
