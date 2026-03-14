import { useState } from "react";
import { Loader2 } from "lucide-react";

import type { BalanceRead, BalanceUpdateInput, BalanceWriteInput } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BalanceFormDialogProps = {
  open: boolean;
  initial?: BalanceRead;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: BalanceWriteInput | BalanceUpdateInput) => void;
};

export function BalanceFormDialog({
  open,
  initial,
  isPending,
  onOpenChange,
  onSave,
}: BalanceFormDialogProps) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "0");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Balance" : "Add Balance"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Input value={label} onChange={(event) => setLabel(event.target.value)} disabled={isPending} />
          </div>
          <div>
            <Label>Amount</Label>
            <Input value={amount} onChange={(event) => setAmount(event.target.value)} disabled={isPending} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !label.trim() || !amount.trim()}
              onClick={() => onSave({ label: label.trim(), amount: amount.trim() })}
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
