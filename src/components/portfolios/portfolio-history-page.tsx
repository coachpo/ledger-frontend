import * as React from "react"
import { ChevronDown, Download, ReceiptText } from "lucide-react"

import { toast } from "sonner"
import {
  formatCurrency,
  formatDateTime,
  formatDecimal,
} from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  EmptyState,
  formatSignedCurrency,
} from "@/components/portfolios/shared"
import { usePortfolioWorkspace } from "@/components/portfolios/portfolio-workspace-layout"

export function PortfolioHistoryPage() {
  const { dashboard, operationsQuery, portfolio } = usePortfolioWorkspace()
  const [openMonths, setOpenMonths] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    setOpenMonths((current) => {
      if (dashboard.historyGroups.length === 0) {
        return current
      }

      const nextState = { ...current }
      for (const group of dashboard.historyGroups) {
        if (!(group.monthKey in nextState)) {
          nextState[group.monthKey] = true
        }
      }

      return nextState
    })
  }, [dashboard.historyGroups])

  if (!portfolio) {
    return null
  }

  const exportHistoryToCSV = () => {
    const headers = [
      "Date",
      "Symbol",
      "Side",
      "Quantity",
      "Price",
      "Dividend Amount",
      "Split Ratio",
      "Commission",
      "Amount",
    ]
    const rows = dashboard.historyGroups.flatMap((group) =>
      group.operations.map((operation) => {
        const quantity =
          operation.side === "BUY" || operation.side === "SELL"
            ? formatDecimal(operation.quantity, 4)
            : "--"
        const price =
          operation.side === "BUY" || operation.side === "SELL"
            ? formatDecimal(operation.price, 2)
            : "--"
        const dividendAmount =
          operation.side === "DIVIDEND"
            ? formatDecimal(operation.dividendAmount, 2)
            : "--"
        const splitRatio =
          operation.side === "SPLIT"
            ? formatDecimal(operation.splitRatio, 6)
            : "--"
        const amount =
          operation.side === "BUY" || operation.side === "SELL"
            ? formatDecimal(
                Number(operation.quantity ?? "0") * Number(operation.price ?? "0"),
                2,
              )
            : operation.side === "DIVIDEND"
              ? formatDecimal(operation.dividendAmount, 2)
              : "--"

        return [
          formatDateTime(operation.executedAt),
          operation.symbol,
          operation.side,
          quantity,
          price,
          dividendAmount,
          splitRatio,
          formatDecimal(operation.commission, 2),
          amount,
        ]
      }),
    )
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `${portfolio.name}_history_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast.success("Transaction history exported to CSV")
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80 bg-background/92 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/60 px-6 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-[var(--font-display)] text-3xl">
              Transaction history
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Expand each month to review executed price, quantity, and cash impact.
            </p>
          </div>
          <Button
            className="rounded-full"
            disabled={dashboard.historyGroups.length === 0}
            onClick={exportHistoryToCSV}
            variant="outline"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="px-6 py-5">
          {operationsQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  className="h-20 rounded-[1.5rem] border border-border/70 bg-muted/20"
                  key={index}
                />
              ))}
            </div>
          ) : dashboard.historyGroups.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No history yet">
              Your simulated trades will collect here automatically after submission.
            </EmptyState>
          ) : (
            <div className="space-y-4">
              {dashboard.historyGroups.map((group) => (
                <Collapsible
                  key={group.monthKey}
                  onOpenChange={(open) =>
                    setOpenMonths((current) => ({
                      ...current,
                      [group.monthKey]: open,
                    }))
                  }
                  open={openMonths[group.monthKey] ?? true}
                >
                  <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-background/70">
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/20">
                        <div>
                          <p className="font-[var(--font-display)] text-3xl text-foreground">
                            {group.label}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {group.operations.length} trade
                            {group.operations.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            openMonths[group.monthKey] && "rotate-180",
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border/60 px-5 py-5">
                        <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                          <div className="overflow-x-auto">
                            <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Asset</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Transaction amount</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {group.operations.map((operation) => {
                                // Calculate cash impact based on operation type
                                let cashImpact: number
                                let displayPrice: string
                                let displayQuantity: string
                                if (operation.side === "BUY" || operation.side === "SELL") {
                                  const gross = Number(operation.quantity) * Number(operation.price)
                                  cashImpact =
                                    operation.side === "SELL"
                                      ? gross - Number(operation.commission)
                                      : -1 * (gross + Number(operation.commission))
                                  displayPrice = formatCurrency(operation.price!, operation.currency)
                                  displayQuantity = formatDecimal(operation.quantity!, 4)
                                } else if (operation.side === "DIVIDEND") {
                                  cashImpact = Number(operation.dividendAmount) - Number(operation.commission)
                                  displayPrice = "—"
                                  displayQuantity = "—"
                                } else if (operation.side === "SPLIT") {
                                  cashImpact = 0
                                  displayPrice = "—"
                                  displayQuantity = `${operation.splitRatio}:1`
                                } else {
                                  cashImpact = 0
                                  displayPrice = "—"
                                  displayQuantity = "—"
                                }
                                return (
                                  <TableRow key={operation.id}>
                                    <TableCell className="font-medium">
                                      {operation.symbol}
                                    </TableCell>
                                    <TableCell>{operation.side}</TableCell>
                                    <TableCell>
                                      {displayPrice}
                                    </TableCell>
                                    <TableCell>
                                      {displayQuantity}
                                    </TableCell>
                                    <TableCell>
                                      {formatSignedCurrency(
                                        cashImpact,
                                        operation.currency,
                                      )}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {formatDateTime(operation.executedAt)}
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
