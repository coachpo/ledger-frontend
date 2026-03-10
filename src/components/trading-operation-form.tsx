import { zodResolver } from '@hookform/resolvers/zod'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { api, toErrorMessage } from '../lib/api'
import { getLocalDateTimeValue, toIsoDateTime } from '../lib/format'
import type { BalanceRecord } from '../types/api'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
} from './ui'

const tradingOperationSchema = z.object({
  balanceId: z.string().min(1, 'Choose the settlement balance'),
  symbol: z.string().trim().min(1, 'Symbol is required').max(32),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.string().trim().min(1).refine((value) => Number(value) > 0, {
    message: 'Quantity must be greater than zero',
  }),
  price: z.string().trim().min(1).refine((value) => Number(value) >= 0, {
    message: 'Price must be zero or greater',
  }),
  commission: z.string().trim().min(1).refine((value) => Number(value) >= 0, {
    message: 'Commission must be zero or greater',
  }),
  executedAt: z.string().trim().min(1, 'Execution time is required'),
})

type TradingOperationFormValues = z.infer<typeof tradingOperationSchema>

type TradingOperationFormProps = {
  portfolioId: string
  balances: BalanceRecord[]
  onSubmitted: () => Promise<void> | void
}

export function TradingOperationForm({
  portfolioId,
  balances,
  onSubmitted,
}: TradingOperationFormProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const form = useForm<TradingOperationFormValues>({
    resolver: zodResolver(tradingOperationSchema),
    defaultValues: {
      balanceId: balances[0]?.id ?? '',
      symbol: '',
      side: 'BUY',
      quantity: '',
      price: '',
      commission: '0.00',
      executedAt: getLocalDateTimeValue(),
    },
  })

  React.useEffect(() => {
    if (!form.getValues('balanceId') && balances[0]) {
      form.setValue('balanceId', balances[0].id)
    }
  }, [balances, form])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Simulated trade</CardTitle>
        <CardDescription>
          Submit a paper trade and let the backend update the selected balance and aggregate position atomically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {balances.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-[var(--line-strong)] bg-white/55 px-4 py-6 text-sm leading-6 text-[var(--muted)]">
            Add a balance first. The API rejects any trade that would leave the chosen balance negative.
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                setSubmitError(null)
                await api.createTradingOperation(portfolioId, {
                  balanceId: values.balanceId,
                  symbol: values.symbol.trim().toUpperCase(),
                  side: values.side,
                  quantity: values.quantity.trim(),
                  price: values.price.trim(),
                  commission: values.commission.trim(),
                  executedAt: toIsoDateTime(values.executedAt),
                })
                form.reset({
                  balanceId: balances[0]?.id ?? '',
                  symbol: '',
                  side: 'BUY',
                  quantity: '',
                  price: '',
                  commission: '0.00',
                  executedAt: getLocalDateTimeValue(),
                })
                await onSubmitted()
              } catch (error) {
                setSubmitError(toErrorMessage(error))
              }
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trade-balance">Settlement balance</Label>
                <Select id="trade-balance" {...form.register('balanceId')}>
                  {balances.map((balance) => (
                    <option key={balance.id} value={balance.id}>
                      {balance.label} ({balance.amount} {balance.currency})
                    </option>
                  ))}
                </Select>
                {form.formState.errors.balanceId ? (
                  <FieldError>{form.formState.errors.balanceId.message}</FieldError>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-side">Side</Label>
                <Select id="trade-side" {...form.register('side')}>
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trade-symbol">Symbol</Label>
                <Input id="trade-symbol" placeholder="AAPL" {...form.register('symbol')} />
                {form.formState.errors.symbol ? <FieldError>{form.formState.errors.symbol.message}</FieldError> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="trade-datetime">Trade date & time</Label>
                <Input id="trade-datetime" type="datetime-local" {...form.register('executedAt')} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="trade-quantity">Quantity</Label>
                <Input id="trade-quantity" inputMode="decimal" placeholder="5" {...form.register('quantity')} />
                {form.formState.errors.quantity ? (
                  <FieldError>{form.formState.errors.quantity.message}</FieldError>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-price">Price</Label>
                <Input id="trade-price" inputMode="decimal" placeholder="190.00" {...form.register('price')} />
                {form.formState.errors.price ? <FieldError>{form.formState.errors.price.message}</FieldError> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-commission">Commission</Label>
                <Input id="trade-commission" inputMode="decimal" placeholder="3.50" {...form.register('commission')} />
                {form.formState.errors.commission ? (
                  <FieldError>{form.formState.errors.commission.message}</FieldError>
                ) : null}
              </div>
            </div>

            <FieldHint>
              Buys reduce cash by quantity × price + commission. Sells increase cash by quantity × price - commission.
            </FieldHint>

            {submitError ? <FieldError>{submitError}</FieldError> : null}

            <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? 'Submitting trade...' : 'Submit simulated trade'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
