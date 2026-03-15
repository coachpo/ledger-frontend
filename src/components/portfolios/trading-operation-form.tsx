import { useEffect, useId, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { BalanceRead } from "@/lib/types/balance";
import { formatCurrency } from "@/lib/format";
import type { TradingOperationInput } from "@/lib/types/trading";
import {
  tradingOperationFormSchema,
  type TradingOperationFormValues,
} from "@/components/shared/form-schemas";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TradingOperationSymbolOption = {
  label: string;
  symbol: string;
};

function getBalanceOptionLabel(balance: BalanceRead) {
  return `${balance.label} · ${formatCurrency(balance.amount, balance.currency)}`;
}

type TradingOperationFormProps = {
  balances: BalanceRead[];
  initialSymbol?: string;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: TradingOperationInput) => void;
  symbolOptions: TradingOperationSymbolOption[];
};

export function TradingOperationForm({
  balances,
  initialSymbol,
  isPending,
  onCancel,
  onSave,
  symbolOptions,
}: TradingOperationFormProps) {
  const symbolSuggestionsId = useId();
  const form = useForm<TradingOperationFormValues>({
    defaultValues: {
      balanceId: balances[0]?.id ? String(balances[0].id) : "",
      commission: "",
      dividendAmount: "",
      executedAt: new Date().toISOString().slice(0, 16),
      price: "",
      quantity: "",
      side: balances.length > 0 ? "BUY" : "SPLIT",
      splitRatio: "",
      symbol: initialSymbol?.toUpperCase() ?? "",
    },
    mode: "onChange",
    resolver: zodResolver(tradingOperationFormSchema),
  });
  const side = form.watch("side");
  const selectedBalanceId = form.watch("balanceId");
  const requiresBalance = side !== "SPLIT";
  const selectedBalance = useMemo(
    () => balances.find((balance) => String(balance.id) === selectedBalanceId),
    [balances, selectedBalanceId],
  );

  useEffect(() => {
    if (!requiresBalance) {
      form.setValue("balanceId", "", { shouldValidate: true });
      return;
    }

    const selectedBalanceId = form.getValues("balanceId");
    if (!selectedBalanceId && balances[0]?.id) {
      form.setValue("balanceId", String(balances[0].id), { shouldValidate: true });
      return;
    }

    if (
      selectedBalanceId
      && !balances.some((balance) => String(balance.id) === selectedBalanceId)
    ) {
      form.setValue("balanceId", balances[0]?.id ? String(balances[0].id) : "", {
        shouldValidate: true,
      });
    }
  }, [balances, form, requiresBalance]);

  useEffect(() => {
    if (!initialSymbol) {
      return;
    }

    const normalizedInitialSymbol = initialSymbol.toUpperCase();
    if (form.getValues("symbol") !== normalizedInitialSymbol) {
      form.setValue("symbol", normalizedInitialSymbol, { shouldValidate: true });
    }
  }, [form, initialSymbol]);

  const requiresQuantityAndPrice = side === "BUY" || side === "SELL";

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const common = {
            executedAt: new Date(values.executedAt).toISOString(),
            symbol: values.symbol.trim().toUpperCase(),
          };

          if (values.side === "BUY") {
            onSave({
              ...common,
              balanceId: Number(values.balanceId),
              commission: values.commission.trim() || undefined,
              price: values.price.trim(),
              quantity: values.quantity.trim(),
              side: "BUY",
            });
            return;
          }

          if (values.side === "SELL") {
            onSave({
              ...common,
              balanceId: Number(values.balanceId),
              commission: values.commission.trim() || undefined,
              price: values.price.trim(),
              quantity: values.quantity.trim(),
              side: "SELL",
            });
            return;
          }

          if (values.side === "DIVIDEND") {
            onSave({
              ...common,
              balanceId: Number(values.balanceId),
              commission: values.commission.trim() || undefined,
              dividendAmount: values.dividendAmount.trim(),
              side: "DIVIDEND",
            });
            return;
          }

          onSave({
            ...common,
            side: "SPLIT",
            splitRatio: values.splitRatio.trim(),
          });
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {requiresBalance ? (
            <FormField
              control={form.control}
              name="balanceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
                  <Select
                    disabled={isPending || balances.length === 0}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select balance" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {balances.map((balance) => (
                        <SelectItem key={balance.id} value={String(balance.id)}>
                          {getBalanceOptionLabel(balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBalance ? (
                    <FormDescription>
                      Available in selected balance: {formatCurrency(selectedBalance.amount, selectedBalance.currency)}
                    </FormDescription>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
              Split operations do not require a cash balance.
            </div>
          )}
          <FormField
            control={form.control}
            name="side"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operation</FormLabel>
                <Select disabled={isPending} value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="BUY">BUY</SelectItem>
                    <SelectItem value="SELL">SELL</SelectItem>
                    <SelectItem value="DIVIDEND">DIVIDEND</SelectItem>
                    <SelectItem value="SPLIT">SPLIT</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Symbol</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="off"
                    disabled={isPending}
                    list={symbolOptions.length > 0 ? symbolSuggestionsId : undefined}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    placeholder={symbolOptions.length > 0 ? "Type or choose a symbol" : undefined}
                  />
                </FormControl>
                {symbolOptions.length > 0 ? (
                  <>
                    <datalist id={symbolSuggestionsId}>
                      {symbolOptions.map((option) => (
                        <option key={option.symbol} value={option.symbol} label={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </datalist>
                    <FormDescription>
                      Portfolio symbols are suggested here. BUY can still use a new symbol.
                    </FormDescription>
                  </>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="executedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Executed At</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} type="datetime-local" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {requiresQuantityAndPrice ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}
        {side === "DIVIDEND" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="dividendAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dividend Amount</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} inputMode="decimal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}
        {side === "SPLIT" ? (
          <FormField
            control={form.control}
            name="splitRatio"
            render={({ field }) => (
                <FormItem>
                  <FormLabel>Split Ratio</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}
          />
        ) : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline" disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={isPending || !form.formState.isValid} type="submit">
            Save Operation
          </Button>
        </div>
      </form>
    </Form>
  );
}
