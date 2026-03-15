import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

      <div className="space-y-3">
        {portfoliosQuery.isPending ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading portfolios...</CardContent>
          </Card>
        ) : null}
        {portfoliosQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {portfoliosQuery.error instanceof Error ? portfoliosQuery.error.message : "Failed to load portfolios."}
            </CardContent>
          </Card>
        ) : null}
        {!portfoliosQuery.isPending && !portfoliosQuery.isError && portfolios.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No portfolios yet.</CardContent>
          </Card>
        ) : null}
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id}>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{portfolio.name}</CardTitle>
                  <Badge variant="secondary">{portfolio.baseCurrency}</Badge>
                  <Badge variant="outline">{portfolio.positionCount} positions</Badge>
                  <Badge variant="outline">{portfolio.balanceCount} balances</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{portfolio.description || "No description"}</p>
                <p className="text-xs text-muted-foreground">Updated {formatDateTime(portfolio.updatedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label={`Open actions for ${portfolio.name}`} size="icon" variant="ghost">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditing(portfolio);
                        setShowForm(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      Edit portfolio
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDeleting(portfolio)} variant="destructive">
                      <Trash2 className="size-4" />
                      Delete portfolio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={() => navigate(`/portfolios/${portfolio.id}`)}>
                  Open Portfolio
                </Button>
              </div>
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
