import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { useCreateTradingOperation } from "@/hooks/use-trading-operations";
import { formatCurrency, formatDateTime, formatDecimal } from "@/lib/format";
import type { BalanceRead, TradingOperationInput, TradingOperationRead } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { TradingOperationForm } from "./trading-operation-form";

type PortfolioTradesSectionProps = {
  portfolioId: number | string;
  balances: BalanceRead[];
  operations: TradingOperationRead[];
};

function describeOperation(operation: TradingOperationRead) {
  if (operation.side === "BUY" || operation.side === "SELL") {
    return `${formatDecimal(operation.quantity ?? 0, 4)} @ ${formatCurrency(operation.price ?? 0, operation.currency)}`;
  }

  if (operation.side === "DIVIDEND") {
    return formatCurrency(operation.dividendAmount ?? 0, operation.currency);
  }

  return `Ratio ${operation.splitRatio ?? "-"}`;
}

export function PortfolioTradesSection({
  portfolioId,
  balances,
  operations,
}: PortfolioTradesSectionProps) {
  const createMutation = useCreateTradingOperation(portfolioId);
  const [showForm, setShowForm] = useState(false);
  const sortedOperations = useMemo(
    () => [...operations].sort((left, right) => right.executedAt.localeCompare(left.executedAt)),
    [operations],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Trading Operations</CardTitle>
        <Button onClick={() => setShowForm(true)} disabled={balances.length === 0}>
          <Plus className="mr-1 size-4" /> Add Operation
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {balances.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
            Add a balance before recording BUY, SELL, DIVIDEND, or SPLIT operations.
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Executed</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Commission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOperations.map((operation) => (
              <TableRow key={operation.id}>
                <TableCell>{formatDateTime(operation.executedAt)}</TableCell>
                <TableCell className="font-medium">{operation.symbol}</TableCell>
                <TableCell><Badge variant="secondary">{operation.side}</Badge></TableCell>
                <TableCell>{operation.balanceLabel}</TableCell>
                <TableCell>{describeOperation(operation)}</TableCell>
                <TableCell className="text-right">{formatCurrency(operation.commission, operation.currency)}</TableCell>
              </TableRow>
            ))}
            {sortedOperations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No operations recorded yet.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Trading Operation</DialogTitle>
          </DialogHeader>
          <TradingOperationForm
            balances={balances}
            isPending={createMutation.isPending}
            onCancel={() => setShowForm(false)}
            onSave={(data: TradingOperationInput) => {
              createMutation.mutate(data, {
                onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to create operation"),
                onSuccess: () => {
                  toast.success("Operation recorded");
                  setShowForm(false);
                },
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
