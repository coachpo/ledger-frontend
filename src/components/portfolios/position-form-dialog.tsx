import { useState } from "react";
import { Loader2 } from "lucide-react";

import type { PositionRead, PositionUpdateInput, PositionWriteInput } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [symbol, setSymbol] = useState(initial?.symbol ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [averageCost, setAverageCost] = useState(initial?.averageCost ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Position" : "Add Position"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Symbol</Label>
            <Input
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              disabled={isPending || Boolean(initial)}
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Quantity</Label>
              <Input value={quantity} onChange={(event) => setQuantity(event.target.value)} disabled={isPending} />
            </div>
            <div>
              <Label>Average Cost</Label>
              <Input value={averageCost} onChange={(event) => setAverageCost(event.target.value)} disabled={isPending} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !quantity.trim() || !averageCost.trim() || (!initial && !symbol.trim())}
              onClick={() => {
                const payload = {
                  name: name.trim() || null,
                  quantity: quantity.trim(),
                  averageCost: averageCost.trim(),
                };

                if (initial) {
                  onSave(payload);
                  return;
                }

                onSave({ ...payload, symbol: symbol.trim().toUpperCase() });
              }}
            >
              {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
