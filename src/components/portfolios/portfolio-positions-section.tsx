import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCreatePosition, useDeletePosition, useUpdatePosition } from "@/hooks/use-positions";
import { formatCurrency, formatDecimal, formatPercent } from "@/lib/format";
import {
  computePositionMarketValue,
  computePositionPnl,
  type PositionWithMarketData,
} from "@/lib/portfolio-analytics";
import type { PositionRead, PositionUpdateInput, PositionWriteInput } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { PositionFormDialog } from "./position-form-dialog";

type PortfolioPositionsSectionProps = {
  portfolioId: number | string;
  positions: PositionWithMarketData[];
  quoteWarnings: string[];
};

export function PortfolioPositionsSection({
  portfolioId,
  positions,
  quoteWarnings,
}: PortfolioPositionsSectionProps) {
  const createMutation = useCreatePosition(portfolioId);
  const updateMutation = useUpdatePosition(portfolioId);
  const deleteMutation = useDeletePosition(portfolioId);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PositionRead | null>(null);
  const [deleting, setDeleting] = useState<PositionRead | null>(null);

  const sortedPositions = useMemo(
    () => [...positions].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    [positions],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-2">
          <CardTitle>Positions</CardTitle>
          {quoteWarnings.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {quoteWarnings.map((warning) => (
                <Badge key={warning} variant="outline">{warning}</Badge>
              ))}
            </div>
          ) : null}
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="mr-1 size-4" /> Add Position
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Average Cost</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Market Value</TableHead>
              <TableHead className="text-right">Unrealized</TableHead>
              <TableHead className="w-[96px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPositions.map((position) => {
              const marketValue = computePositionMarketValue(position);
              const pnl = computePositionPnl(position);

              return (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>{position.name || "-"}</TableCell>
                  <TableCell className="text-right">{formatDecimal(position.quantity, 4)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(position.averageCost, position.currency)}</TableCell>
                  <TableCell className="text-right">
                    {position.currentPrice ? formatCurrency(position.currentPrice, position.currency) : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    {marketValue === null ? "--" : formatCurrency(marketValue, position.currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {pnl.unrealized === null ? "--" : (
                      <div className={pnl.unrealized >= 0 ? "text-emerald-600" : "text-red-600"}>
                        <div>{formatCurrency(pnl.unrealized, position.currency)}</div>
                        <div className="text-xs">{formatPercent(pnl.unrealizedPercent ?? 0)}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(position); setShowForm(true); }}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(position)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {sortedPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No positions yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>

      <PositionFormDialog
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
              { positionId: editing.id, data: data as PositionUpdateInput },
              {
                onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to update position"),
                onSuccess: () => {
                  toast.success("Position updated");
                  setShowForm(false);
                  setEditing(null);
                },
              },
            );
            return;
          }

          createMutation.mutate(data as PositionWriteInput, {
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create position"),
            onSuccess: () => {
              toast.success("Position created");
              setShowForm(false);
            },
          });
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete position"
        description={`Remove ${deleting?.symbol ?? "this position"} from the portfolio?`}
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
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to delete position"),
            onSuccess: () => {
              toast.success("Position deleted");
              setDeleting(null);
            },
          });
        }}
      />
    </Card>
  );
}
