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

const balanceFormSchema = z.object({
  label: z.string().trim().min(1, 'Balance label is required').max(60),
  amount: z.string().trim().min(1, 'Amount is required').refine((value) => !Number.isNaN(Number(value)), {
    message: 'Use a valid decimal amount',
  }),
})

type BalanceFormValues = z.infer<typeof balanceFormSchema>

type BalanceFormDialogProps = {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  currency: string
  defaultValues?: { label: string; amount: string }
  onSubmit: (values: { label: string; amount: string }) => Promise<void>
}

export function BalanceFormDialog({
  mode,
  open,
  onOpenChange,
  currency,
  defaultValues,
  onSubmit,
}: BalanceFormDialogProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceFormSchema),
    defaultValues: {
      label: defaultValues?.label ?? '',
      amount: defaultValues?.amount ?? '',
    },
  })

  React.useEffect(() => {
    form.reset({
      label: defaultValues?.label ?? '',
      amount: defaultValues?.amount ?? '',
    })
    setSubmitError(null)
  }, [defaultValues, form, open])

  const isCreate = mode === 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Add settlement balance' : 'Adjust settlement balance'}</DialogTitle>
          <DialogDescription>
            Balance records act as the settlement source for simulated trades. Negative balances are blocked at the API level.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              setSubmitError(null)
              await onSubmit({ label: values.label.trim(), amount: values.amount.trim() })
              onOpenChange(false)
            } catch (error) {
              setSubmitError(toErrorMessage(error))
            }
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="balance-label">Label</Label>
            <Input id="balance-label" placeholder="Trading cash" {...form.register('label')} />
            {form.formState.errors.label ? <FieldError>{form.formState.errors.label.message}</FieldError> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance-amount">Amount ({currency})</Label>
            <Input id="balance-amount" inputMode="decimal" placeholder="25000.00" {...form.register('amount')} />
            <FieldHint>Balances stay in the portfolio base currency for this MVP.</FieldHint>
            {form.formState.errors.amount ? <FieldError>{form.formState.errors.amount.message}</FieldError> : null}
          </div>

          {submitError ? <FieldError>{submitError}</FieldError> : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Saving...' : isCreate ? 'Create balance' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
