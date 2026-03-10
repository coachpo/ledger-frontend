import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { toErrorMessage } from '../lib/api'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  FieldError,
  FieldHint,
  Input,
  Label,
} from './ui'

const positionFormSchema = z.object({
  symbol: z.string().trim().min(1, 'Symbol is required').max(32),
  name: z.string().trim().max(120).optional(),
  quantity: z.string().trim().min(1, 'Quantity is required').refine((value) => Number(value) > 0, {
    message: 'Quantity must be greater than zero',
  }),
  averageCost: z.string().trim().min(1, 'Average cost is required').refine((value) => Number(value) >= 0, {
    message: 'Average cost must be zero or greater',
  }),
})

type PositionFormValues = z.infer<typeof positionFormSchema>

type PositionFormDialogProps = {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  defaultValues?: { symbol: string; name: string | null; quantity: string; averageCost: string }
  onSubmit: (values: { symbol: string; name: string | null; quantity: string; averageCost: string }) => Promise<void>
}

export function PositionFormDialog({
  mode,
  open,
  onOpenChange,
  currency,
  defaultValues,
  onSubmit,
}: PositionFormDialogProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionFormSchema),
    defaultValues: {
      symbol: defaultValues?.symbol ?? '',
      name: defaultValues?.name ?? '',
      quantity: defaultValues?.quantity ?? '',
      averageCost: defaultValues?.averageCost ?? '',
    },
  })

  React.useEffect(() => {
    form.reset({
      symbol: defaultValues?.symbol ?? '',
      name: defaultValues?.name ?? '',
      quantity: defaultValues?.quantity ?? '',
      averageCost: defaultValues?.averageCost ?? '',
    })
    setSubmitError(null)
  }, [defaultValues, form, open])

  const isCreate = mode === 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Add manual position' : 'Correct manual position'}</DialogTitle>
          <DialogDescription>
            Positions stay aggregated by symbol. Manual edits remain a source of truth in the MVP, even after simulated trades.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              setSubmitError(null)
              await onSubmit({
                symbol: values.symbol.trim().toUpperCase(),
                name: values.name?.trim() ? values.name.trim() : null,
                quantity: values.quantity.trim(),
                averageCost: values.averageCost.trim(),
              })
              onOpenChange(false)
            } catch (error) {
              setSubmitError(toErrorMessage(error))
            }
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-symbol">Symbol</Label>
              <Input
                disabled={!isCreate}
                id="position-symbol"
                placeholder="AAPL"
                {...form.register('symbol')}
              />
              {form.formState.errors.symbol ? <FieldError>{form.formState.errors.symbol.message}</FieldError> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-name">Name</Label>
              <Input id="position-name" placeholder="Apple Inc." {...form.register('name')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-quantity">Quantity</Label>
              <Input id="position-quantity" inputMode="decimal" placeholder="10" {...form.register('quantity')} />
              {form.formState.errors.quantity ? <FieldError>{form.formState.errors.quantity.message}</FieldError> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-average-cost">Average cost ({currency})</Label>
              <Input
                id="position-average-cost"
                inputMode="decimal"
                placeholder="185.50"
                {...form.register('averageCost')}
              />
              <FieldHint>Average cost is tracked per symbol using the portfolio base currency.</FieldHint>
              {form.formState.errors.averageCost ? (
                <FieldError>{form.formState.errors.averageCost.message}</FieldError>
              ) : null}
            </div>
          </div>

          {submitError ? <FieldError>{submitError}</FieldError> : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Saving...' : isCreate ? 'Create position' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
