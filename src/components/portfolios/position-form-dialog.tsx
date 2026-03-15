import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import type { PositionRead, PositionUpdateInput, PositionWriteInput } from "@/lib/api-types";
import { positionCreateFormSchema, type PositionCreateFormValues } from "@/components/form-schemas";

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
  open: boolean;
  initial?: PositionRead;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PositionWriteInput | PositionUpdateInput) => void;
};

export function PositionFormDialog({
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
                    <Input {...field} disabled={isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
