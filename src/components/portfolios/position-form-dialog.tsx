import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { useDebounce } from "@/hooks/use-debounce";
import { useMarketQuotes } from "@/hooks/use-market-data";
import type { PositionRead, PositionUpdateInput, PositionWriteInput } from "@/lib/types/position";
import { positionCreateFormSchema, type PositionCreateFormValues } from "@/components/shared/form-schemas";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type PositionFormDialogProps = {
  portfolioId: number | string;
  open: boolean;
  initial?: PositionRead;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PositionWriteInput | PositionUpdateInput) => void;
};

export function PositionFormDialog({
  portfolioId,
  open,
  initial,
  isPending,
  onOpenChange,
  onSave,
}: PositionFormDialogProps) {
  const form = useForm<PositionCreateFormValues>({
    defaultValues: {
      averageCost: initial?.averageCost ?? "",
      name: initial?.name ?? "",
      quantity: initial?.quantity ?? "",
      symbol: initial?.symbol ?? "",
    },
    resolver: zodResolver(positionCreateFormSchema),
  });

  const symbol = form.watch("symbol");
  const debouncedSymbol = useDebounce(symbol, 300);

  const { data: quotesData, isPending: isQuotesPending, isError: isQuotesError } = useMarketQuotes(
    portfolioId,
    debouncedSymbol ? [debouncedSymbol] : [],
  );

  useEffect(() => {
    if (initial) return;
    if (symbol !== debouncedSymbol) {
      form.setValue("name", "");
    }
  }, [symbol, debouncedSymbol, form, initial]);

  useEffect(() => {
    if (initial) return;

    const quotes = quotesData?.quotes;
    if (quotes && quotes.length > 0 && quotes[0].name) {
      form.setValue("name", quotes[0].name);
    } else if (!isQuotesPending && debouncedSymbol && symbol === debouncedSymbol) {
      form.setValue("name", "");
    }
  }, [quotesData, isQuotesPending, debouncedSymbol, symbol, form, initial]);

  useEffect(() => {
    form.reset({
      averageCost: initial?.averageCost ?? "",
      name: initial?.name ?? "",
      quantity: initial?.quantity ?? "",
      symbol: initial?.symbol ?? "",
    });
  }, [form, initial, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Position" : "Add Position"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => {
              const payload = {
                averageCost: values.averageCost.trim(),
                name: values.name.trim() || null,
                quantity: values.quantity.trim(),
              };

              if (initial) {
                onSave(payload satisfies PositionUpdateInput);
                return;
              }

              onSave({
                ...payload,
                symbol: values.symbol.trim().toUpperCase(),
              } satisfies PositionWriteInput);
            })}
          >
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending || Boolean(initial)}
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        {...field} 
                        disabled={isPending} 
                        readOnly={Boolean(form.watch("name"))}
                        className={form.watch("name") ? "bg-muted" : ""}
                      />
                      {isQuotesPending && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="sr-only" aria-live="polite">
              {isQuotesPending ? "Searching for company..." : 
               quotesData?.quotes?.[0]?.name ? `Auto-filled: ${quotesData.quotes[0].name}` :
               isQuotesError ? "Symbol not found" : ""}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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
                name="averageCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Cost</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} inputMode="decimal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => onOpenChange(false)} type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
              <Button disabled={isPending} type="submit">
                {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
