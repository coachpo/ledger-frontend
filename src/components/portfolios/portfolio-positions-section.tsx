import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCreatePosition, useDeletePosition, useUpdatePosition } from "@/hooks/use-positions";
import { formatCurrency, formatDecimal, formatPercent } from "@/lib/format";
import {
  computePositionMarketValue,
  computePositionPnl,
  type PositionWithMarketData,
} from "@/lib/portfolio-analytics";
import type { PositionRead, PositionUpdateInput, PositionWriteInput } from "@/lib/types/position";

import { DataTable } from "@/components/shared/data-table";
import { DataTableColumnHeader } from "@/components/shared/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const columns = useMemo<ColumnDef<PositionWithMarketData>[]>(
    () => [
      {
        accessorKey: "symbol",
        cell: ({ row }) => <span className="font-medium">{row.original.symbol}</span>,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Symbol" />,
      },
      {
        accessorKey: "name",
        cell: ({ row }) => row.original.name || "-",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      },
      {
        accessorFn: (row) => Number(row.quantity),
        cell: ({ row }) => <span className="text-right">{formatDecimal(row.original.quantity, 4)}</span>,
        header: ({ column }) => (
          <DataTableColumnHeader className="justify-end" column={column} title="Quantity" />
        ),
        id: "quantity",
      },
      {
        accessorFn: (row) => Number(row.averageCost),
        cell: ({ row }) => (
          <span className="text-right">{formatCurrency(row.original.averageCost, row.original.currency)}</span>
        ),
        header: ({ column }) => (
          <DataTableColumnHeader className="justify-end" column={column} title="Average Cost" />
        ),
        id: "averageCost",
      },
      {
        accessorFn: (row) => (row.currentPrice ? Number(row.currentPrice) : Number.NEGATIVE_INFINITY),
        cell: ({ row }) => (
          <span className="text-right">
            {row.original.currentPrice
              ? formatCurrency(row.original.currentPrice, row.original.currency)
              : "--"}
          </span>
        ),
        header: ({ column }) => (
          <DataTableColumnHeader className="justify-end" column={column} title="Current Price" />
        ),
        id: "currentPrice",
      },
      {
        accessorFn: (row) => computePositionMarketValue(row) ?? Number.NEGATIVE_INFINITY,
        cell: ({ row }) => {
          const marketValue = computePositionMarketValue(row.original);

          return (
            <span className="text-right">
              {marketValue === null ? "--" : formatCurrency(marketValue, row.original.currency)}
            </span>
          );
        },
        header: ({ column }) => (
          <DataTableColumnHeader className="justify-end" column={column} title="Market Value" />
        ),
        id: "marketValue",
      },
      {
        accessorFn: (row) => computePositionPnl(row).unrealized ?? Number.NEGATIVE_INFINITY,
        cell: ({ row }) => {
          const pnl = computePositionPnl(row.original);

          if (pnl.unrealized === null) {
            return <span className="text-right">--</span>;
          }

          return (
            <div className={pnl.unrealized >= 0 ? "text-right text-emerald-600" : "text-right text-red-600"}>
              <div>{formatCurrency(pnl.unrealized, row.original.currency)}</div>
              <div className="text-xs">{formatPercent(pnl.unrealizedPercent ?? 0)}</div>
            </div>
          );
        },
        header: ({ column }) => (
          <DataTableColumnHeader className="justify-end" column={column} title="Unrealized" />
        ),
        id: "unrealized",
      },
      {
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label={`Open actions for ${row.original.symbol}`} size="icon" variant="ghost">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={() => {
                    setEditing(row.original);
                    setShowForm(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Edit position
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDeleting(row.original)} variant="destructive">
                  <Trash2 className="size-4" />
                  Delete position
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        enableSorting: false,
        id: "actions",
      },
    ],
    [],
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
        <DataTable
          columns={columns}
          data={sortedPositions}
          emptyMessage="No positions yet."
          initialPageSize={8}
          initialSorting={[{ desc: false, id: "symbol" }]}
        />
      </CardContent>

      <PositionFormDialog
        portfolioId={portfolioId}
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
