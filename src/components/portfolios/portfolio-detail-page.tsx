import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useBalances } from "@/hooks/use-balances";
import { useMarketQuotes } from "@/hooks/use-market-data";
import { useDeletePortfolio, usePortfolio, useUpdatePortfolio } from "@/hooks/use-portfolios";
import { usePositions } from "@/hooks/use-positions";
import { useTradingOperations } from "@/hooks/use-trading-operations";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  computePortfolioTotalValue,
  computePositionPnl,
  enrichPositionsWithQuotes,
} from "@/lib/portfolio-analytics";
import type { PortfolioUpdateInput } from "@/lib/api-types";

import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { PortfolioBalancesSection } from "./portfolio-balances-section";
import { PortfolioFormDialog } from "@/components/forms/portfolio-form-dialog";
import { PortfolioPositionsSection } from "./portfolio-positions-section";
import { PortfolioTradesSection } from "./portfolio-trades-section";

export function PortfolioDetailPage() {
  const navigate = useNavigate();
  const { portfolioId } = useParams();
  const portfolioQuery = usePortfolio(portfolioId);
  const positionsQuery = usePositions(portfolioId);
  const balancesQuery = useBalances(portfolioId);
  const tradingQuery = useTradingOperations(portfolioId);
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const positions = useMemo(() => positionsQuery.data ?? [], [positionsQuery.data]);
  const balances = useMemo(() => balancesQuery.data ?? [], [balancesQuery.data]);
  const operations = useMemo(() => tradingQuery.data ?? [], [tradingQuery.data]);
  const symbols = useMemo(() => positions.map((position) => position.symbol), [positions]);
  const quotesQuery = useMarketQuotes(portfolioId, symbols);
  const enrichedPositions = useMemo(
    () => enrichPositionsWithQuotes(positions, quotesQuery.data?.quotes ?? []),
    [positions, quotesQuery.data?.quotes],
  );
  const portfolio = portfolioQuery.data;
  const totalValue = computePortfolioTotalValue(enrichedPositions, balances);
  const cashValue = balances.reduce((sum, balance) => sum + Number.parseFloat(balance.amount), 0);
  const unrealizedPnl = enrichedPositions.reduce(
    (sum, position) => sum + (computePositionPnl(position).unrealized ?? 0),
    0,
  );
  const latestOperation = [...operations].sort((left, right) => right.executedAt.localeCompare(left.executedAt))[0];

  if (!portfolioId) {
    return <div className="p-6 text-muted-foreground">Portfolio route is missing an id.</div>;
  }

  if (portfolioQuery.isPending) {
    return <div className="p-6 text-muted-foreground">Loading portfolio...</div>;
  }

  if (portfolioQuery.isError || !portfolio) {
    return (
      <div className="max-w-4xl space-y-4 p-6">
        <Button variant="outline" onClick={() => navigate("/portfolios")}>
          <ArrowLeft className="mr-1 size-4" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {portfolioQuery.error instanceof Error ? portfolioQuery.error.message : "Portfolio not found."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" className="-ml-3" onClick={() => navigate("/portfolios")}>
            <ArrowLeft className="mr-1 size-4" /> Back to Portfolios
          </Button>
          <div>
            <h1 className="text-2xl tracking-tight">{portfolio.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{portfolio.description || "No description"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Updated {formatDateTime(portfolio.updatedAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditForm(true)}>
            <Pencil className="mr-1 size-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-1 size-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Value" value={formatCurrency(totalValue, portfolio.baseCurrency)} note="Balances plus marked positions" />
        <MetricCard title="Cash Balances" value={formatCurrency(cashValue, portfolio.baseCurrency)} note={`${balances.length} balance accounts`} />
        <MetricCard title="Unrealized P&L" value={formatCurrency(unrealizedPnl, portfolio.baseCurrency)} note={`${positions.length} tracked positions`} />
        <MetricCard title="Latest Activity" value={latestOperation ? latestOperation.side : "None"} note={latestOperation ? formatDateTime(latestOperation.executedAt) : "No operations yet"} />
      </div>

      {positionsQuery.isError || balancesQuery.isError || tradingQuery.isError ? (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Some portfolio sections could not be refreshed. Cached data may still be visible.
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>
        <TabsContent value="positions">
          <PortfolioPositionsSection
            portfolioId={portfolio.id}
            positions={enrichedPositions}
            quoteWarnings={quotesQuery.data?.warnings ?? []}
          />
        </TabsContent>
        <TabsContent value="balances">
          <PortfolioBalancesSection portfolioId={portfolio.id} balances={balances} />
        </TabsContent>
        <TabsContent value="trades">
          <PortfolioTradesSection portfolioId={portfolio.id} balances={balances} operations={operations} />
        </TabsContent>
      </Tabs>

      <PortfolioFormDialog
        open={showEditForm}
        initial={portfolio}
        isPending={updateMutation.isPending}
        onOpenChange={setShowEditForm}
        onSave={(data) => {
          updateMutation.mutate(
            { portfolioId: portfolio.id, data: data as PortfolioUpdateInput },
            {
              onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update portfolio"),
              onSuccess: () => {
                toast.success("Portfolio updated");
                setShowEditForm(false);
              },
            },
          );
        }}
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        title="Delete portfolio"
        description={`Delete ${portfolio.name}? This removes the portfolio shell and invalidates its detail route.`}
        isPending={deleteMutation.isPending}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => {
          deleteMutation.mutate(portfolio.id, {
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to delete portfolio"),
            onSuccess: () => {
              toast.success("Portfolio deleted");
              navigate("/portfolios");
            },
          });
        }}
      />
    </div>
  );
}
