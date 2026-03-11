import { ArrowLeftRight, Coins, Wallet } from "lucide-react"

import {
  formatCurrency,
  formatDateTime,
  formatDecimal,
} from "@/lib/format"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  EmptyState,
  formatSignedCurrency,
} from "@/components/portfolios/shared"
import { TradingOperationForm } from "@/components/portfolios/trading-operation-form"
import { usePortfolioWorkspace } from "@/components/portfolios/portfolio-workspace-layout"

export function PortfolioTradePage() {
  const { balances, operations, portfolio, positions } = usePortfolioWorkspace()

  if (!portfolio) {
    return null
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="border-border/80 bg-background/92 shadow-sm">
        <CardHeader className="border-b border-border/60 px-6 pb-4">
          <CardTitle className="font-[var(--font-display)] text-3xl">
            Add trade
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            This release keeps the core simulation workflow aligned to the existing
            BUY / SELL contract in the backend.
          </p>
        </CardHeader>
        <CardContent className="px-0 py-0">
          <TradingOperationForm
            balances={balances}
            currency={portfolio.baseCurrency}
            portfolioId={portfolio.id}
            positions={positions}
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/80 bg-background/92 shadow-sm">
          <CardHeader className="border-b border-border/60 px-6 pb-4">
            <CardTitle className="font-[var(--font-display)] text-3xl">
              Trading setup
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 py-5">
            <SetupCard
              icon={Wallet}
              label="Settlement balances"
              value={`${balances.length}`}
            >
              {balances.length > 0
                ? "Balances are available for trade settlement."
                : "Add a balance before simulating a trade."}
            </SetupCard>
            <SetupCard
              icon={ArrowLeftRight}
              label="Tracked symbols"
              value={`${positions.length}`}
            >
              Search suggestions come from your current holdings; you can also type a new symbol.
            </SetupCard>
            <SetupCard
              icon={Coins}
              label="Recorded trades"
              value={`${operations.length}`}
            >
              Recent operations stay visible in History and feed the analysis views.
            </SetupCard>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-background/92 shadow-sm">
          <CardHeader className="border-b border-border/60 px-6 pb-4">
            <CardTitle className="font-[var(--font-display)] text-3xl">
              Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 py-5">
            {operations.length === 0 ? (
              <EmptyState icon={Coins} title="No trades recorded">
                Your most recent simulated trades will appear here for quick reference.
              </EmptyState>
            ) : (
              <ScrollArea className="max-h-[20rem] pr-4">
                <div className="space-y-3">
                  {operations.slice(0, 6).map((operation) => {
                    // Calculate cash impact based on operation type
                    let cashImpact: number
                    let displayDetails: string
                    if (operation.side === "BUY" || operation.side === "SELL") {
                      const gross = Number(operation.quantity) * Number(operation.price)
                      cashImpact =
                        operation.side === "SELL"
                          ? gross - Number(operation.commission)
                          : -1 * (gross + Number(operation.commission))
                      displayDetails = `${formatDecimal(operation.quantity!, 4)} @ ${formatCurrency(operation.price!, operation.currency)}`
                    } else if (operation.side === "DIVIDEND") {
                      cashImpact = Number(operation.dividendAmount) - Number(operation.commission)
                      displayDetails = formatCurrency(operation.dividendAmount!, operation.currency)
                    } else if (operation.side === "SPLIT") {
                      cashImpact = 0
                      displayDetails = `${operation.splitRatio}:1 split`
                    } else {
                      cashImpact = 0
                      displayDetails = ""
                    }
                    return (
                      <div
                        className="rounded-[1.25rem] border border-border/70 bg-background/70 px-4 py-4"
                        key={operation.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {operation.side} {operation.symbol}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatDateTime(operation.executedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">
                              {formatSignedCurrency(
                                cashImpact,
                                operation.currency,
                              )}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {displayDetails}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SetupCard({
  children,
  icon: Icon,
  label,
  value,
}: React.PropsWithChildren<{
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}>) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background/75 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          {label}
        </p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 font-[var(--font-display)] text-3xl text-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  )
}
