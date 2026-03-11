import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Loader2, Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  api,
  type BalanceRead,
  type PositionRead,
  type TradingOperationInput,
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

type TradingOperationFormValues = z.infer<typeof tradingOperationSchema>

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
  const form = useForm<TradingOperationFormValues>({
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
  const [latestPrice, setLatestPrice] = React.useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = React.useState(false)

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
  const normalizedSymbol = React.useMemo(
    () => resolveTradeSymbol(watched.symbol, positions),
    [positions, watched.symbol],
  )

  React.useEffect(() => {
    const fetchLatestPrice = async () => {
      if (!normalizedSymbol || !portfolioId || (watched.side !== "BUY" && watched.side !== "SELL")) {
        setLatestPrice(null)
        setLoadingPrice(false)
        return
      }
      setLoadingPrice(true)
      try {
        const quotes = await api.getMarketQuotes(portfolioId, [normalizedSymbol])
        if (quotes.quotes && quotes.quotes.length > 0) {
          setLatestPrice(decimalToNumber(quotes.quotes[0].price))
        } else {
          setLatestPrice(null)
        }
      } catch {
        setLatestPrice(null)
      } finally {
        setLoadingPrice(false)
      }
    }
    fetchLatestPrice()
  }, [normalizedSymbol, portfolioId, watched.side])

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
  const tradeQuantity = watched.side === "BUY" || watched.side === "SELL" ? decimalToNumber(watched.quantity) : 0
  const tradePrice = watched.side === "BUY" || watched.side === "SELL" ? decimalToNumber(watched.price) : 0
  const tradeCommission = watched.side !== "SPLIT" ? decimalToNumber(watched.commission) : 0
  const dividendAmount = watched.side === "DIVIDEND" ? decimalToNumber(watched.dividendAmount) : 0
  const splitRatio = watched.side === "SPLIT" ? decimalToNumber(watched.splitRatio) : 1
  const gross = tradeQuantity * tradePrice
  const cashImpact = React.useMemo(() => {
    if (watched.side === "SELL") return gross - tradeCommission
    if (watched.side === "BUY") return -1 * (gross + tradeCommission)
    if (watched.side === "DIVIDEND") return dividendAmount - tradeCommission
    return 0
  }, [watched.side, gross, tradeCommission, dividendAmount])
  const currentBalanceAmount = decimalToNumber(selectedBalance?.amount)
  const resultingBalance = currentBalanceAmount + cashImpact
  const currentPositionQuantity = decimalToNumber(selectedPosition?.quantity)
  const currentPositionAverageCost = decimalToNumber(selectedPosition?.averageCost)
  const nextPositionQuantity = React.useMemo(() => {
    if (watched.side === "SELL") return currentPositionQuantity - tradeQuantity
    if (watched.side === "BUY") return currentPositionQuantity + tradeQuantity
    if (watched.side === "SPLIT") return currentPositionQuantity * splitRatio
    return currentPositionQuantity
  }, [watched.side, currentPositionQuantity, tradeQuantity, splitRatio])
  const nextAverageCost = React.useMemo(() => {
    if (watched.side === "SELL" || watched.side === "DIVIDEND") {
      return nextPositionQuantity <= 0 ? 0 : currentPositionAverageCost
    }

    if (watched.side === "SPLIT") {
      return nextPositionQuantity <= 0 ? 0 : currentPositionAverageCost / splitRatio
    }

    if (tradeQuantity <= 0) {
      return currentPositionQuantity > 0 ? currentPositionAverageCost : 0
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
    splitRatio,
    tradeCommission,
    tradeQuantity,
    watched.side,
  ])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await api.createTradingOperation(
        portfolioId,
        buildTradingOperationPayload(values, positions),
      )
      await invalidatePortfolioScope(queryClient, portfolioId)
      toast.success(`${values.side} operation recorded`)
      form.reset(getTradingOperationResetValues(values, positions))
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
                  <SelectItem value="DIVIDEND">DIVIDEND</SelectItem>
                  <SelectItem value="SPLIT">SPLIT</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorText message={form.formState.errors.side?.message} />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="trade-symbol">Symbol</Label>
          <Input id="trade-symbol" list="tracked-symbols" placeholder="Search by symbol or tracked name" {...form.register("symbol")} />
          <datalist id="tracked-symbols">
            {positions.map((position) => (
              <option key={position.id} label={position.name ?? position.symbol} value={position.symbol} />
            ))}
          </datalist>
          <p className="text-sm text-muted-foreground">
            Match by ticker or an existing tracked asset name.
          </p>
          <FieldErrorText message={form.formState.errors.symbol?.message} />
        </div>

        {(watched.side === "BUY" || watched.side === "SELL") && (
          <>
            <div className="space-y-2">
              <Label htmlFor="trade-quantity">Quantity</Label>
              <div className="flex gap-2">
                <Button
                  className="rounded-full"
                  onClick={() => {
                    if (watched.side === "BUY" || watched.side === "SELL") {
                      const current = decimalToNumber(watched.quantity)
                      form.setValue("quantity", Math.max(0, current - 1).toString())
                    }
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  className="flex-1"
                  id="trade-quantity"
                  inputMode="decimal"
                  placeholder="5"
                  {...form.register("quantity")}
                />
                <Button
                  className="rounded-full"
                  onClick={() => {
                    if (watched.side === "BUY" || watched.side === "SELL") {
                      const current = decimalToNumber(watched.quantity)
                      form.setValue("quantity", (current + 1).toString())
                    }
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <FieldErrorText message={form.getFieldState("quantity").error?.message} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="trade-price">Price</Label>
                {loadingPrice ? (
                  <span className="text-xs text-muted-foreground">
                    <Loader2 className="inline size-3 animate-spin" /> Loading...
                  </span>
                ) : latestPrice !== null ? (
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => form.setValue("price", latestPrice.toFixed(2))}
                    type="button"
                  >
                    Latest: {formatCurrency(latestPrice, currency)}
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button
                  className="rounded-full"
                  onClick={() => {
                    if (watched.side === "BUY" || watched.side === "SELL") {
                      const current = decimalToNumber(watched.price)
                      form.setValue("price", Math.max(0, current - 0.01).toFixed(2))
                    }
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  className="flex-1"
                  id="trade-price"
                  inputMode="decimal"
                  placeholder="190.00"
                  {...form.register("price")}
                />
                <Button
                  className="rounded-full"
                  onClick={() => {
                    if (watched.side === "BUY" || watched.side === "SELL") {
                      const current = decimalToNumber(watched.price)
                      form.setValue("price", (current + 0.01).toFixed(2))
                    }
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <FieldErrorText message={form.getFieldState("price").error?.message} />
            </div>
          </>
        )}

        {watched.side === "DIVIDEND" && (
          <div className="space-y-2">
            <Label htmlFor="trade-dividend-amount">Dividend Amount</Label>
            <Input id="trade-dividend-amount" inputMode="decimal" placeholder="15.50" {...form.register("dividendAmount")} />
            <FieldErrorText message={form.getFieldState("dividendAmount").error?.message} />
          </div>
        )}

        {watched.side === "SPLIT" && (
          <div className="space-y-2">
            <Label htmlFor="trade-split-ratio">Split Ratio</Label>
            <Input id="trade-split-ratio" inputMode="decimal" placeholder="4" {...form.register("splitRatio")} />
            <FieldErrorText message={form.getFieldState("splitRatio").error?.message} />
          </div>
        )}

        {watched.side !== "SPLIT" && (
          <div className="space-y-2">
            <Label htmlFor="trade-commission">Commission</Label>
            <div className="flex gap-2">
              <Button
                className="rounded-full"
                onClick={() => {
                  const current = decimalToNumber(watched.commission ?? "0")
                  form.setValue("commission", Math.max(0, current - 0.01).toFixed(2))
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Minus className="size-4" />
              </Button>
              <Input
                className="flex-1"
                id="trade-commission"
                inputMode="decimal"
                placeholder="3.50"
                {...form.register("commission")}
              />
              <Button
                className="rounded-full"
                onClick={() => {
                  const current = decimalToNumber(watched.commission ?? "0")
                  form.setValue("commission", (current + 0.01).toFixed(2))
                }}
                size="icon"
                type="button"
                variant="outline"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <FieldErrorText message={form.getFieldState("commission").error?.message} />
          </div>
        )}

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

function resolveTradeSymbol(input: string, positions: PositionRead[]): string {
  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return ""
  }

  const exactMatch = positions.find((position) => {
    const normalizedSymbol = position.symbol.toUpperCase()
    const normalizedName = position.name?.trim().toUpperCase()
    const normalizedInput = trimmed.toUpperCase()

    return (
      normalizedSymbol === normalizedInput ||
      (normalizedName !== undefined && normalizedName === normalizedInput)
    )
  })

  return exactMatch?.symbol.toUpperCase() ?? trimmed.toUpperCase()
}

function buildTradingOperationPayload(
  values: TradingOperationFormValues,
  positions: PositionRead[],
): TradingOperationInput {
  const basePayload = {
    balanceId: values.balanceId,
    symbol: resolveTradeSymbol(values.symbol, positions),
    executedAt: fromLocalDateTimeValue(values.executedAt),
  }

  switch (values.side) {
    case "BUY":
    case "SELL":
      return {
        ...basePayload,
        side: values.side,
        quantity: values.quantity.trim(),
        price: values.price.trim(),
        commission: values.commission.trim(),
      }
    case "DIVIDEND":
      return {
        ...basePayload,
        side: values.side,
        dividendAmount: values.dividendAmount.trim(),
        commission: values.commission?.trim() ?? "0.00",
      }
    case "SPLIT":
      return {
        ...basePayload,
        side: values.side,
        splitRatio: values.splitRatio.trim(),
      }
  }
}

function getTradingOperationResetValues(
  values: TradingOperationFormValues,
  positions: PositionRead[],
): TradingOperationFormValues {
  const baseValues = {
    balanceId: values.balanceId,
    symbol: resolveTradeSymbol(values.symbol, positions),
    executedAt: toLocalDateTimeValue(),
  }

  switch (values.side) {
    case "BUY":
    case "SELL":
      return {
        ...baseValues,
        side: values.side,
        quantity: "",
        price: "",
        commission: "0.00",
      }
    case "DIVIDEND":
      return {
        ...baseValues,
        side: values.side,
        dividendAmount: "",
        commission: "0.00",
      }
    case "SPLIT":
      return {
        ...baseValues,
        side: values.side,
        splitRatio: "",
      }
  }
}
