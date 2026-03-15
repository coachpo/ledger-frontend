import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { BalanceRead, TradingOperationInput } from "@/lib/api-types";
import {
  tradingOperationFormSchema,
  type TradingOperationFormValues,
} from "@/components/shared/form-schemas";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TradingOperationFormProps = {
  balances: BalanceRead[];
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: TradingOperationInput) => void;
};

export function TradingOperationForm({
  balances,
  isPending,
  onCancel,
  onSave,
}: TradingOperationFormProps) {
  const form = useForm<TradingOperationFormValues>({
    defaultValues: {
      balanceId: balances[0]?.id ? String(balances[0].id) : "",
      commission: "",
      dividendAmount: "",
      executedAt: new Date().toISOString().slice(0, 16),
      price: "",
      quantity: "",
      side: "BUY",
      splitRatio: "",
      symbol: "",
    },
    mode: "onChange",
    resolver: zodResolver(tradingOperationFormSchema),
  });
  const side = form.watch("side");

  useEffect(() => {
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
  }, [balances, form]);

  const requiresQuantityAndPrice = side === "BUY" || side === "SELL";

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const common = {
            balanceId: Number(values.balanceId),
            executedAt: new Date(values.executedAt).toISOString(),
            symbol: values.symbol.trim().toUpperCase(),
          };

          if (values.side === "BUY") {
            onSave({
              ...common,
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
                        {balance.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    disabled={isPending}
                    onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                  />
                </FormControl>
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
                  <Input {...field} disabled={isPending} placeholder="2:1 or 1.5" />
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
