import { Link } from "react-router";
import {
  ArrowUpRight,
  BarChart3,
  Briefcase,
  DollarSign,
  RefreshCw,
} from "lucide-react";

import { usePortfolios } from "@/hooks/use-portfolios";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
        <Link
          to="/portfolios"
          className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border text-left transition-shadow hover:shadow-md"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Active Portfolios
            </CardTitle>
            <Briefcase className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{portfolioCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Portfolio records syncing from the API
            </p>
          </CardContent>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Total Positions
            </CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalPositions}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {averagePositions} positions per portfolio on average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Balance Accounts
            </CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totalBalances}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cash and settlement balances tracked across portfolios
            </p>
          </CardContent>
        </Card>

        {mostRecentlyUpdatedPortfolio ? (
          <Link
            to={`/portfolios/${mostRecentlyUpdatedPortfolio.id}`}
            className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border text-left transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Latest Update
              </CardTitle>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg leading-tight">
                {mostRecentlyUpdatedPortfolio.name}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDateLabel(mostRecentlyUpdatedPortfolio.updatedAt)}
              </p>
            </CardContent>
          </Link>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Latest Update
              </CardTitle>
              <ArrowUpRight className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg leading-tight">No portfolio data</div>
              <p className="mt-1 text-xs text-muted-foreground">No updates yet</p>
            </CardContent>
          </Card>
        )}
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
