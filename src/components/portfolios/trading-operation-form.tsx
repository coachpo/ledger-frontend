import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  api,
  type BalanceRead,
  type PositionRead,
} from "@/lib/api"
import {
  decimalToNumber,
  formatCurrency,
  formatDecimal,
  fromLocalDateTimeValue,
  getErrorDetails,
  getErrorMessage,
  toLocalDateTimeValue,
} from "@/lib/format"
import { invalidatePortfolioScope } from "@/lib/query-keys"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tradingOperationSchema } from "@/components/portfolios/model"
import {
  FieldErrorText,
  StatusCallout,
  formatSignedCurrency,
} from "@/components/portfolios/shared"

export function TradingOperationForm({
  portfolioId,
  currency,
  balances,
  positions,
  onCancel,
  onSubmitted,
}: {
  portfolioId: string
  currency: string
  balances: BalanceRead[]
  positions: PositionRead[]
  onCancel?: () => void
  onSubmitted?: () => void
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof tradingOperationSchema>>({
    resolver: zodResolver(tradingOperationSchema),
    defaultValues: {
      balanceId: balances[0]?.id ?? "",
      symbol: positions[0]?.symbol ?? "",
      side: "BUY",
      quantity: "",
      price: "",
      commission: "0.00",
      executedAt: toLocalDateTimeValue(),
    },
  })
  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const selectedBalanceId = form.getValues("balanceId")

    if (balances.length === 0) {
      if (selectedBalanceId) {
        form.setValue("balanceId", "")
      }
      return
    }

    const hasSelectedBalance = balances.some(
      (balance) => balance.id === selectedBalanceId,
    )

    if (!hasSelectedBalance) {
      form.setValue("balanceId", balances[0].id, {
        shouldValidate: true,
      })
    }
  }, [balances, form])

  const watched = form.watch()
  const normalizedSymbol = watched.symbol.trim().toUpperCase()
  const selectedBalance = React.useMemo(
    () => balances.find((balance) => balance.id === watched.balanceId) ?? null,
    [balances, watched.balanceId],
  )
  const selectedPosition = React.useMemo(
    () =>
      positions.find(
        (position) => position.symbol.toUpperCase() === normalizedSymbol,
      ) ?? null,
    [normalizedSymbol, positions],
  )
  const tradeQuantity = decimalToNumber(watched.quantity)
  const tradePrice = decimalToNumber(watched.price)
  const tradeCommission = decimalToNumber(watched.commission)
  const gross = tradeQuantity * tradePrice
  const cashImpact =
    watched.side === "SELL"
      ? gross - tradeCommission
      : -1 * (gross + tradeCommission)
  const currentBalanceAmount = decimalToNumber(selectedBalance?.amount)
  const resultingBalance = currentBalanceAmount + cashImpact
  const currentPositionQuantity = decimalToNumber(selectedPosition?.quantity)
  const currentPositionAverageCost = decimalToNumber(selectedPosition?.averageCost)
  const nextPositionQuantity =
    watched.side === "SELL"
      ? currentPositionQuantity - tradeQuantity
      : currentPositionQuantity + tradeQuantity
  const nextAverageCost = React.useMemo(() => {
    if (tradeQuantity <= 0) {
      return currentPositionQuantity > 0 ? currentPositionAverageCost : 0
    }

    if (watched.side === "SELL") {
      return nextPositionQuantity <= 0 ? 0 : currentPositionAverageCost
    }

    const existingCostBasis = currentPositionQuantity * currentPositionAverageCost
    const incomingCostBasis = gross + tradeCommission

    return nextPositionQuantity <= 0
      ? 0
      : (existingCostBasis + incomingCostBasis) / nextPositionQuantity
  }, [
    currentPositionAverageCost,
    currentPositionQuantity,
    gross,
    nextPositionQuantity,
    tradeCommission,
    tradeQuantity,
    watched.side,
  ])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await api.createTradingOperation(portfolioId, {
        balanceId: values.balanceId,
        symbol: values.symbol.trim().toUpperCase(),
        side: values.side,
        quantity: values.quantity.trim(),
        price: values.price.trim(),
        commission: values.commission.trim(),
        executedAt: fromLocalDateTimeValue(values.executedAt),
      })
      await invalidatePortfolioScope(queryClient, portfolioId)
      toast.success(`${values.side} operation recorded`)
      form.reset({
        balanceId: values.balanceId,
        symbol: values.symbol.trim().toUpperCase(),
        side: values.side,
        quantity: "",
        price: "",
        commission: "0.00",
        executedAt: toLocalDateTimeValue(),
      })
      onSubmitted?.()
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form className="space-y-6 p-6" onSubmit={handleSubmit}>
      {balances.length === 0 ? (
        <StatusCallout title="Balances required before trading" tone="warning">
          Add a balance first.
        </StatusCallout>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trade-balance">Settlement balance</Label>
          <Controller
            control={form.control}
            name="balanceId"
            render={({ field }) => (
              <Select disabled={balances.length === 0} onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="trade-balance">
                  <SelectValue placeholder="Choose a balance" />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((balance) => (
                    <SelectItem key={balance.id} value={balance.id}>
                      {balance.label} / {formatCurrency(balance.amount, balance.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorText message={form.formState.errors.balanceId?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade-side">Side</Label>
          <Controller
            control={form.control}
            name="side"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="trade-side">
                  <SelectValue placeholder="Choose a side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorText message={form.formState.errors.side?.message} />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="trade-symbol">Symbol</Label>
          <Input id="trade-symbol" list="tracked-symbols" placeholder="AAPL" {...form.register("symbol")} />
          <datalist id="tracked-symbols">
            {positions.map((position) => (
              <option key={position.id} value={position.symbol} />
            ))}
          </datalist>
          <FieldErrorText message={form.formState.errors.symbol?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade-quantity">Quantity</Label>
          <Input id="trade-quantity" inputMode="decimal" placeholder="5" {...form.register("quantity")} />
          <FieldErrorText message={form.formState.errors.quantity?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade-price">Price</Label>
          <Input id="trade-price" inputMode="decimal" placeholder="190.00" {...form.register("price")} />
          <FieldErrorText message={form.formState.errors.price?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade-commission">Commission</Label>
          <Input id="trade-commission" inputMode="decimal" placeholder="3.50" {...form.register("commission")} />
          <FieldErrorText message={form.formState.errors.commission?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trade-executed-at">Trade date and time</Label>
          <Input id="trade-executed-at" type="datetime-local" {...form.register("executedAt")} />
          <FieldErrorText message={form.formState.errors.executedAt?.message} />
        </div>
      </div>

      <Card className="border-border/70 bg-muted/20 shadow-none">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Cash impact
            </p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-foreground">
              {formatSignedCurrency(cashImpact, selectedBalance?.currency ?? currency)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Resulting balance
            </p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-foreground">
              {selectedBalance
                ? formatCurrency(resultingBalance, selectedBalance.currency)
                : "Choose a balance"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Position after trade
            </p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-foreground">
              {normalizedSymbol.length > 0
                ? `${formatDecimal(nextPositionQuantity, 4)} shares`
                : "Enter a symbol"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              Avg cost after trade
            </p>
            <p className="mt-2 font-[var(--font-display)] text-3xl text-foreground">
              {normalizedSymbol.length > 0 && nextPositionQuantity > 0
                ? formatCurrency(nextAverageCost, currency)
                : "--"}
            </p>
          </div>
        </CardContent>
      </Card>

      {submitError ? (
        <StatusCallout details={getErrorDetails(submitError)} title="Trade rejected" tone="error">
          {getErrorMessage(submitError)}
        </StatusCallout>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button className="rounded-full" onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
        ) : null}
        <Button className="rounded-full" disabled={balances.length === 0 || isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit trade
        </Button>
      </div>
    </form>
  )
}
