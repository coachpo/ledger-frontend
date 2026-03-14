import { useState } from "react";
import { Loader2 } from "lucide-react";

import type { PortfolioRead, PortfolioUpdateInput, PortfolioWriteInput } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PortfolioFormDialogProps = {
  open: boolean;
  initial?: PortfolioRead;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PortfolioWriteInput | PortfolioUpdateInput) => void;
};

export function PortfolioFormDialog({
  open,
  initial,
  isPending,
  onOpenChange,
  onSave,
}: PortfolioFormDialogProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [baseCurrency, setBaseCurrency] = useState(initial?.baseCurrency ?? "USD");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Portfolio" : "Create Portfolio"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              disabled={isPending}
            />
          </div>
          <div>
            <Label>Base Currency</Label>
            <Input
              value={baseCurrency}
              onChange={(event) => setBaseCurrency(event.target.value.toUpperCase())}
              disabled={isPending || Boolean(initial)}
              maxLength={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              disabled={isPending || !name.trim() || (!initial && baseCurrency.trim().length !== 3)}
              onClick={() => {
                if (initial) {
                  onSave({ name: name.trim(), description: description.trim() || null });
                  return;
                }

                onSave({
                  name: name.trim(),
                  description: description.trim() || null,
                  baseCurrency: baseCurrency.trim().toUpperCase(),
                });
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
