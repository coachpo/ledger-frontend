import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import type { TemplateRuntimeInputs } from "@/lib/types/text-template";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GenerateReportTemplateOption = {
  id: string;
  name: string;
};

type GenerateReportPayload = {
  inputs: TemplateRuntimeInputs;
  templateId: string;
};

type GenerateReportDialogProps = {
  defaultTemplateId?: string;
  description?: string;
  initialInputs?: TemplateRuntimeInputs;
  isPending: boolean;
  lockTemplateSelection?: boolean;
  onGenerate: (payload: GenerateReportPayload) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  templateOptions: GenerateReportTemplateOption[];
};

type RuntimeInputRow = {
  id: string;
  key: string;
  value: string;
};

let runtimeInputRowCounter = 0;

function createRuntimeInputRow(key = "", value = ""): RuntimeInputRow {
  runtimeInputRowCounter += 1;
  return {
    id: `report-runtime-input-${runtimeInputRowCounter}`,
    key,
    value,
  };
}

function createRuntimeInputRows(inputs?: TemplateRuntimeInputs): RuntimeInputRow[] {
  return Object.entries(inputs ?? {}).map(([key, value]) => createRuntimeInputRow(key, value));
}

function buildRuntimeInputs(rows: RuntimeInputRow[]): TemplateRuntimeInputs {
  const result: TemplateRuntimeInputs = {};

  for (const row of rows) {
    const key = row.key.trim();
    const value = row.value.trim();
    if (!key || !value) {
      continue;
    }
    result[key] = value;
  }

  return result;
}

export function GenerateReportDialog({
  defaultTemplateId,
  description = "Select a template to compile into a report snapshot.",
  initialInputs,
  isPending,
  lockTemplateSelection = false,
  onGenerate,
  onOpenChange,
  open,
  templateOptions,
}: GenerateReportDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplateId ?? "");
  const [runtimeInputRows, setRuntimeInputRows] = useState<RuntimeInputRow[]>(() =>
    createRuntimeInputRows(initialInputs),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedTemplateId(defaultTemplateId ?? "");
    setRuntimeInputRows(createRuntimeInputRows(initialInputs));
  }, [defaultTemplateId, initialInputs, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedTemplateId(defaultTemplateId ?? "");
      setRuntimeInputRows(createRuntimeInputRows(initialInputs));
    }

    onOpenChange(nextOpen);
  };

  const addRuntimeInputRow = () => {
    setRuntimeInputRows((rows) => [...rows, createRuntimeInputRow()]);
  };

  const updateRuntimeInputRow = (rowId: string, field: "key" | "value", value: string) => {
    setRuntimeInputRows((rows) =>
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const removeRuntimeInputRow = (rowId: string) => {
    setRuntimeInputRows((rows) => rows.filter((row) => row.id !== rowId));
  };

  const handleGenerate = () => {
    if (!selectedTemplateId || isPending) {
      return;
    }

    onGenerate({
      inputs: buildRuntimeInputs(runtimeInputRows),
      templateId: selectedTemplateId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Select
          value={selectedTemplateId}
          onValueChange={setSelectedTemplateId}
          disabled={isPending || lockTemplateSelection}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {templateOptions.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Runtime Inputs</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRuntimeInputRow}>
              Add Input
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use key/value pairs like `ticker`, `portfolio_slug`, or `analysis_tag` when the
            selected template is parameterized.
          </p>
          {runtimeInputRows.length === 0 ? (
            <p className="text-xs italic text-muted-foreground">No runtime inputs provided.</p>
          ) : null}
          {runtimeInputRows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <Input
                value={row.key}
                onChange={(event) => updateRuntimeInputRow(row.id, "key", event.target.value)}
                placeholder="ticker"
              />
              <Input
                value={row.value}
                onChange={(event) => updateRuntimeInputRow(row.id, "value", event.target.value)}
                placeholder="AAPL"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRuntimeInputRow(row.id)}
                aria-label={`Remove runtime input ${row.key || row.id}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={!selectedTemplateId || isPending}>
            {isPending ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
