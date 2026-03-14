import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  useCreatePortfolio,
  useDeletePortfolio,
  usePortfolios,
  useUpdatePortfolio,
} from "@/hooks/use-portfolios";
import { formatDateTime } from "@/lib/format";
import type { PortfolioRead, PortfolioUpdateInput, PortfolioWriteInput } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { PortfolioFormDialog } from "./portfolio-form-dialog";

export function PortfolioListPage() {
  const navigate = useNavigate();
  const portfoliosQuery = usePortfolios();
  const createMutation = useCreatePortfolio();
  const updateMutation = useUpdatePortfolio();
  const deleteMutation = useDeletePortfolio();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortfolioRead | null>(null);
  const [deleting, setDeleting] = useState<PortfolioRead | null>(null);

  const portfolios = useMemo(
    () => [...(portfoliosQuery.data ?? [])].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [portfoliosQuery.data],
  );

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Portfolios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage live portfolio records and jump into detailed position, balance, and trade views.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="mr-1 size-4" /> New Portfolio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {portfoliosQuery.isPending ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-12 text-center text-muted-foreground">Loading portfolios...</CardContent>
          </Card>
        ) : null}
        {portfoliosQuery.isError ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-12 text-center text-muted-foreground">
              {portfoliosQuery.error instanceof Error ? portfoliosQuery.error.message : "Failed to load portfolios."}
            </CardContent>
          </Card>
        ) : null}
        {!portfoliosQuery.isPending && !portfoliosQuery.isError && portfolios.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-12 text-center text-muted-foreground">No portfolios yet.</CardContent>
          </Card>
        ) : null}
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-base">{portfolio.name}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{portfolio.baseCurrency}</Badge>
                  <Badge variant="outline">{portfolio.positionCount} positions</Badge>
                  <Badge variant="outline">{portfolio.balanceCount} balances</Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(portfolio); setShowForm(true); }}>
                  <Pencil className="size-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleting(portfolio)}>
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{portfolio.description || "No description"}</p>
              <p className="text-xs text-muted-foreground">Updated {formatDateTime(portfolio.updatedAt)}</p>
              <Button className="w-full" variant="outline" onClick={() => navigate(`/portfolios/${portfolio.id}`)}>
                Open Portfolio
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <PortfolioFormDialog
        open={showForm}
        initial={editing ?? undefined}
        isPending={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditing(null);
          }
        }}
        onSave={async (data) => {
          if (editing) {
            updateMutation.mutate(
              { portfolioId: editing.id, data: data as PortfolioUpdateInput },
              {
                onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update portfolio"),
                onSuccess: () => {
                  toast.success("Portfolio updated");
                  setShowForm(false);
                  setEditing(null);
                },
              },
            );
            return;
          }

          try {
            const portfolio = await createMutation.mutateAsync(data as PortfolioWriteInput);
            toast.success("Portfolio created");
            setShowForm(false);
            navigate(`/portfolios/${portfolio.id}`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to create portfolio");
          }
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete portfolio"
        description={`Delete ${deleting?.name ?? "this portfolio"}? This cannot be undone.`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => {
          if (!deleting) {
            return;
          }

          deleteMutation.mutate(deleting.id, {
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to delete portfolio"),
            onSuccess: () => {
              toast.success("Portfolio deleted");
              setDeleting(null);
            },
          });
        }}
      />
    </div>
  );
}
