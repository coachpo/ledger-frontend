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
  type CsvPreviewRead,
  type PortfolioRead,
  type PositionRead,
} from "@/lib/api"
import {
  getErrorDetails,
  getErrorMessage,
  pluralize,
} from "@/lib/format"
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  BASE_CURRENCY_OPTIONS,
  balanceSchema,
  portfolioCreateSchema,
  positionCreateSchema,
} from "@/components/portfolios/model"
import {
  FieldErrorText,
  StatusCallout,
  normalizeOptionalText,
} from "@/components/portfolios/shared"

export function PortfolioFormDialog({
  open,
  onOpenChange,
  portfolio,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio?: PortfolioRead | null
  onSuccess?: (portfolio: PortfolioRead) => void | Promise<void>
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof portfolioCreateSchema>>({
    resolver: zodResolver(portfolioCreateSchema),
    defaultValues: {
      name: portfolio?.name ?? "",
      description: portfolio?.description ?? "",
      baseCurrency: portfolio?.baseCurrency ?? "USD",
    },
  })

  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    form.reset({
      name: portfolio?.name ?? "",
      description: portfolio?.description ?? "",
      baseCurrency: portfolio?.baseCurrency ?? "USD",
    })
    setSubmitError(null)
  }, [form, open, portfolio])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        description: normalizeOptionalText(values.description),
        baseCurrency: values.baseCurrency.trim().toUpperCase(),
      }

      const result = portfolio
        ? await api.updatePortfolio(portfolio.id, {
            name: payload.name,
            description: payload.description,
          })
        : await api.createPortfolio(payload)

      await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })
      if (portfolio) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio(portfolio.id),
        })
      }

      toast.success(portfolio ? "Portfolio updated" : "Portfolio created")
      onOpenChange(false)
      await onSuccess?.(result)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            {portfolio ? "Edit portfolio" : "Create portfolio"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portfolio-name">Name</Label>
              <Input id="portfolio-name" placeholder="Core portfolio" {...form.register("name")} />
              <FieldErrorText message={form.formState.errors.name?.message} />
            </div>

            {!portfolio ? (
              <div className="space-y-2">
                <Label htmlFor="portfolio-base-currency">Base currency</Label>
                <Controller
                  control={form.control}
                  name="baseCurrency"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="portfolio-base-currency">
                        <SelectValue placeholder="Choose a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {BASE_CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldErrorText message={form.formState.errors.baseCurrency?.message} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Base currency</Label>
                <div className="flex h-10 items-center rounded-xl border border-border/70 bg-muted/30 px-3 text-sm font-medium text-foreground">
                  {portfolio.baseCurrency}
                </div>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portfolio-description">Description</Label>
              <Textarea
                id="portfolio-description"
                placeholder="Long-term holdings, sandbox trades, or sector experiments"
                rows={4}
                {...form.register("description")}
              />
              <FieldErrorText message={form.formState.errors.description?.message} />
            </div>
          </div>

          {submitError ? (
            <StatusCallout
              details={getErrorDetails(submitError)}
              title="Could not save the portfolio"
              tone="error"
            >
              {getErrorMessage(submitError)}
            </StatusCallout>
          ) : null}

          <DialogFooter>
            <Button className="rounded-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {portfolio ? "Save changes" : "Create portfolio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BalanceFormDialog({
  open,
  onOpenChange,
  portfolio,
  balance,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: PortfolioRead
  balance?: BalanceRead | null
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof balanceSchema>>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      label: balance?.label ?? "",
      amount: balance?.amount ?? "0.00",
    },
  })
  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    form.reset({
      label: balance?.label ?? "",
      amount: balance?.amount ?? "0.00",
    })
    setSubmitError(null)
  }, [balance, form, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (balance) {
        await api.updateBalance(portfolio.id, balance.id, {
          label: values.label.trim(),
          amount: values.amount.trim(),
        })
      } else {
        await api.createBalance(portfolio.id, {
          label: values.label.trim(),
          amount: values.amount.trim(),
        })
      }

      await invalidatePortfolioScope(queryClient, portfolio.id)
      toast.success(balance ? "Balance updated" : "Balance added")
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            {balance ? "Edit balance" : "Add balance"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="balance-label">Label</Label>
            <Input id="balance-label" placeholder="Cash" {...form.register("label")} />
            <FieldErrorText message={form.formState.errors.label?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance-amount">Amount</Label>
            <Input
              id="balance-amount"
              inputMode="decimal"
              placeholder="25000.00"
              {...form.register("amount")}
            />
            <FieldErrorText message={form.formState.errors.amount?.message} />
          </div>

          {submitError ? (
            <StatusCallout
              details={getErrorDetails(submitError)}
              title="Could not save the balance"
              tone="error"
            >
              {getErrorMessage(submitError)}
            </StatusCallout>
          ) : null}

          <DialogFooter>
            <Button className="rounded-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {balance ? "Save balance" : "Create balance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PositionFormDialog({
  open,
  onOpenChange,
  portfolio,
  position,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: PortfolioRead
  position?: PositionRead | null
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof positionCreateSchema>>({
    resolver: zodResolver(positionCreateSchema),
    defaultValues: {
      symbol: position?.symbol ?? "",
      name: position?.name ?? "",
      quantity: position?.quantity ?? "",
      averageCost: position?.averageCost ?? "",
    },
  })
  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    form.reset({
      symbol: position?.symbol ?? "",
      name: position?.name ?? "",
      quantity: position?.quantity ?? "",
      averageCost: position?.averageCost ?? "",
    })
    setSubmitError(null)
  }, [form, open, position])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (position) {
        await api.updatePosition(portfolio.id, position.id, {
          name: normalizeOptionalText(values.name),
          quantity: values.quantity.trim(),
          averageCost: values.averageCost.trim(),
        })
      } else {
        await api.createPosition(portfolio.id, {
          symbol: values.symbol.trim().toUpperCase(),
          name: normalizeOptionalText(values.name),
          quantity: values.quantity.trim(),
          averageCost: values.averageCost.trim(),
        })
      }

      await invalidatePortfolioScope(queryClient, portfolio.id)
      toast.success(position ? "Position updated" : "Position added")
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            {position ? "Edit position" : "Add position"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!position ? (
            <div className="space-y-2">
              <Label htmlFor="position-symbol">Symbol</Label>
              <Input id="position-symbol" placeholder="AAPL" {...form.register("symbol")} />
              <FieldErrorText message={form.formState.errors.symbol?.message} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Symbol</Label>
              <div className="flex h-10 items-center rounded-xl border border-border/70 bg-muted/30 px-3 font-medium">
                {position.symbol}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="position-name">Name</Label>
            <Input id="position-name" placeholder="Apple Inc." {...form.register("name")} />
            <FieldErrorText message={form.formState.errors.name?.message} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-quantity">Quantity</Label>
              <Input
                id="position-quantity"
                inputMode="decimal"
                placeholder="10"
                {...form.register("quantity")}
              />
              <FieldErrorText message={form.formState.errors.quantity?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-average-cost">Average cost</Label>
              <Input
                id="position-average-cost"
                inputMode="decimal"
                placeholder="185.50"
                {...form.register("averageCost")}
              />
              <FieldErrorText message={form.formState.errors.averageCost?.message} />
            </div>
          </div>

          {submitError ? (
            <StatusCallout
              details={getErrorDetails(submitError)}
              title="Could not save the position"
              tone="error"
            >
              {getErrorMessage(submitError)}
            </StatusCallout>
          ) : null}

          <DialogFooter>
            <Button className="rounded-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {position ? "Save position" : "Create position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CsvImportDialog({
  open,
  onOpenChange,
  portfolioId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioId: string
}) {
  const queryClient = useQueryClient()
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<CsvPreviewRead | null>(null)
  const [previewError, setPreviewError] = React.useState<unknown>(null)
  const [previewPending, setPreviewPending] = React.useState(false)
  const [commitPending, setCommitPending] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setPreview(null)
      setPreviewError(null)
      setPreviewPending(false)
      setCommitPending(false)
    }
  }, [open])

  async function handlePreview() {
    if (!file) {
      return
    }

    setPreviewPending(true)
    setPreviewError(null)
    try {
      const result = await api.previewPositionImport(portfolioId, file)
      setPreview(result)
    } catch (error) {
      setPreview(null)
      setPreviewError(error)
    } finally {
      setPreviewPending(false)
    }
  }

  async function handleCommit() {
    if (!file) {
      return
    }

    setCommitPending(true)
    setPreviewError(null)
    try {
      const result = await api.commitPositionImport(portfolioId, file)
      await invalidatePortfolioScope(queryClient, portfolioId)
      toast.success(
        `CSV applied: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged.`,
      )
      onOpenChange(false)
    } catch (error) {
      setPreviewError(error)
    } finally {
      setCommitPending(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            Import positions from CSV
          </DialogTitle>
          <DialogDescription>
            Headers: `symbol`, `quantity`, `average_cost`, optional `name`.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-5">
            <div className="space-y-3">
              <Label htmlFor="position-csv">CSV file</Label>
              <Input
                accept=".csv,text/csv"
                id="position-csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setPreview(null)
                  setPreviewError(null)
                }}
                type="file"
              />
              <p className="text-sm text-muted-foreground">
                Existing positions stay unchanged. Duplicate symbols are rejected.
              </p>
            </div>
          </div>

          {previewError ? (
            <StatusCallout details={getErrorDetails(previewError)} title="CSV preview failed" tone="error">
              {getErrorMessage(previewError)}
            </StatusCallout>
          ) : null}

          {preview ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle>Accepted rows</CardTitle>
                  <CardDescription>{preview.acceptedRows.length} ready to apply.</CardDescription>
                </CardHeader>
                <CardContent>
                  {preview.acceptedRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No rows were accepted from this preview.
                    </p>
                  ) : (
                    <ScrollArea className="h-72">
                      <div className="overflow-hidden rounded-2xl border border-border/70">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Symbol</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Average cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.acceptedRows.map((row) => (
                              <TableRow key={`${row.row}-${row.symbol}`}>
                                <TableCell>{row.row}</TableCell>
                                <TableCell className="font-medium">{row.symbol}</TableCell>
                                <TableCell>{row.quantity}</TableCell>
                                <TableCell>{row.averageCost}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle>Validation notes</CardTitle>
                  <CardDescription>
                    {preview.errors.length === 0
                      ? "The file is ready for commit."
                      : `${preview.errors.length} ${pluralize(preview.errors.length, "issue")} must be fixed.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {preview.errors.length === 0 ? (
                    <StatusCallout title="Preview passed" tone="info">
                      The CSV meets the import contract and can be applied atomically.
                    </StatusCallout>
                  ) : (
                    <StatusCallout
                      details={preview.errors.map(
                        (error) => `Row ${error.row}: ${error.field} - ${error.issue}`,
                      )}
                      title="Fix these rows before commit"
                      tone="warning"
                    >
                      The backend will reject commit when preview validation still has row errors.
                    </StatusCallout>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              className="rounded-full"
              disabled={!file || previewPending}
              onClick={handlePreview}
              type="button"
              variant="outline"
            >
              {previewPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Preview file
            </Button>
            <Button
              className="rounded-full"
              disabled={
                !file ||
                !preview ||
                preview.errors.length > 0 ||
                preview.acceptedRows.length === 0 ||
                commitPending
              }
              onClick={() => void handleCommit()}
              type="button"
            >
              {commitPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Commit import
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<unknown>(null)

  React.useEffect(() => {
    if (!open) {
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }, [open])

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-[var(--font-display)] text-3xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {submitError ? (
          <StatusCallout details={getErrorDetails(submitError)} title="Delete failed" tone="error">
            {getErrorMessage(submitError)}
          </StatusCallout>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isSubmitting}
            onClick={async (event) => {
              event.preventDefault()
              if (isSubmitting) {
                return
              }
              setSubmitError(null)
              setIsSubmitting(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } catch (error) {
                setSubmitError(error)
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
