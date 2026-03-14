import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCreateBalance, useDeleteBalance, useUpdateBalance } from "@/hooks/use-balances";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { BalanceRead, BalanceUpdateInput, BalanceWriteInput } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BalanceFormDialog } from "./balance-form-dialog";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

type PortfolioBalancesSectionProps = {
  portfolioId: string;
  balances: BalanceRead[];
};

export function PortfolioBalancesSection({
  portfolioId,
  balances,
}: PortfolioBalancesSectionProps) {
  const createMutation = useCreateBalance(portfolioId);
  const updateMutation = useUpdateBalance(portfolioId);
  const deleteMutation = useDeleteBalance(portfolioId);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BalanceRead | null>(null);
  const [deleting, setDeleting] = useState<BalanceRead | null>(null);

  const sortedBalances = useMemo(
    () => [...balances].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [balances],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Balances</CardTitle>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="mr-1 size-4" /> Add Balance
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedBalances.map((balance) => (
            <Card key={balance.id} className="border-dashed">
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{balance.label}</p>
                    <p className="text-xs text-muted-foreground">Updated {formatDateTime(balance.updatedAt)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditing(balance); setShowForm(true); }}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(balance)}>
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-2xl tracking-tight">{formatCurrency(balance.amount, balance.currency)}</p>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{balance.currency}</p>
              </CardContent>
            </Card>
          ))}
          {sortedBalances.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
              No balances yet.
            </div>
          ) : null}
        </div>
      </CardContent>

      <BalanceFormDialog
        open={showForm}
        initial={editing ?? undefined}
        isPending={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditing(null);
          }
        }}
        onSave={(data) => {
          if (editing) {
            updateMutation.mutate(
              { balanceId: editing.id, data: data as BalanceUpdateInput },
              {
                onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update balance"),
                onSuccess: () => {
                  toast.success("Balance updated");
                  setShowForm(false);
                  setEditing(null);
                },
              },
            );
            return;
          }

          createMutation.mutate(data as BalanceWriteInput, {
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create balance"),
            onSuccess: () => {
              toast.success("Balance created");
              setShowForm(false);
            },
          });
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete balance"
        description={`Delete ${deleting?.label ?? "this balance"}? Existing trading operations remain in history.`}
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
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to delete balance"),
            onSuccess: () => {
              toast.success("Balance deleted");
              setDeleting(null);
            },
          });
        }}
      />
    </Card>
  );
}
