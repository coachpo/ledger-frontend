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
  Textarea,
} from './ui'

const portfolioFormSchema = z.object({
  name: z.string().trim().min(1, 'Portfolio name is required').max(100),
  description: z.string().trim().max(400).optional(),
  baseCurrency: z.string().trim().length(3, 'Use a 3-letter currency code').optional(),
})

type PortfolioFormValues = z.infer<typeof portfolioFormSchema>

type PortfolioFormDialogProps = {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues?: {
    name: string
    description: string | null
    baseCurrency?: string
  }
  onSubmit: (values: { name: string; description: string | null; baseCurrency?: string }) => Promise<void>
}

export function PortfolioFormDialog({
  mode,
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: PortfolioFormDialogProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const form = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      baseCurrency: defaultValues?.baseCurrency ?? 'USD',
    },
  })

  React.useEffect(() => {
    form.reset({
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      baseCurrency: defaultValues?.baseCurrency ?? 'USD',
    })
    setSubmitError(null)
  }, [defaultValues, form, open])

  const isCreate = mode === 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreate ? 'Create a new portfolio' : 'Refine portfolio details'}</DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Every portfolio is isolated. Choose a clear label and the base currency you want every balance, position, and trade to use.'
              : 'Update the portfolio metadata without affecting any balances, positions, or simulated trades.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              setSubmitError(null)
              await onSubmit({
                name: values.name.trim(),
                description: values.description?.trim() ? values.description.trim() : null,
                baseCurrency: isCreate ? values.baseCurrency?.trim().toUpperCase() : undefined,
              })
              onOpenChange(false)
            } catch (error) {
              setSubmitError(toErrorMessage(error))
            }
          })}
        >
          <div className="space-y-2">
            <Label htmlFor="portfolio-name">Portfolio name</Label>
            <Input id="portfolio-name" placeholder="Core portfolio" {...form.register('name')} />
            {form.formState.errors.name ? <FieldError>{form.formState.errors.name.message}</FieldError> : null}
          </div>

          {isCreate ? (
            <div className="space-y-2">
              <Label htmlFor="portfolio-currency">Base currency</Label>
              <Input id="portfolio-currency" maxLength={3} placeholder="USD" {...form.register('baseCurrency')} />
              <FieldHint>Use a three-letter ISO currency code. MVP keeps every portfolio in a single currency.</FieldHint>
              {form.formState.errors.baseCurrency ? (
                <FieldError>{form.formState.errors.baseCurrency.message}</FieldError>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="portfolio-description">Description</Label>
            <Textarea
              id="portfolio-description"
              placeholder="Long-term allocations, trading sandbox, retirement sleeve..."
              {...form.register('description')}
            />
          </div>

          {submitError ? <FieldError>{submitError}</FieldError> : null}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Saving...' : isCreate ? 'Create portfolio' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
