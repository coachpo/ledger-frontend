import { useEffect, useMemo, useState } from "react";
import { Copy, FileText, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreatePromptTemplate,
  useDeletePromptTemplate,
  usePromptTemplates,
  useUpdatePromptTemplate,
} from "@/hooks/use-prompt-templates";
import type {
  PromptTemplateMode,
  PromptTemplateRead,
  PromptTemplateUpdate,
  PromptTemplateWrite,
} from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

type TemplateFormProps = {
  initial?: PromptTemplateRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: PromptTemplateWrite | PromptTemplateUpdate) => void;
};

function emptyText(value: string | null | undefined) {
  return value ?? "";
}

function templateClipboardText(template: PromptTemplateRead) {
  if (template.templateMode === "single") {
    return [
      `Instructions:\n${template.instructionsTemplate ?? ""}`,
      `Input:\n${template.inputTemplate ?? ""}`,
    ].join("\n\n");
  }

  return [
    `Fresh Instructions:\n${template.freshInstructionsTemplate}`,
    `Fresh Input:\n${template.freshInputTemplate}`,
    `Compare Instructions:\n${template.compareInstructionsTemplate}`,
    `Compare Input:\n${template.compareInputTemplate}`,
  ].join("\n\n");
}

type PlaceholderReferenceItem = {
  label: string;
  reference: string;
  description: string;
  example: string;
};

const PLACEHOLDER_REFERENCE_ITEMS: PlaceholderReferenceItem[] = [
  {
    label: "Current symbol",
    reference: "{{stock.symbol}}",
    description: "The selected stock symbol for this template or preview.",
    example: "Analyze {{stock.symbol}} for {{portfolio.name}}.",
  },
  {
    label: "Selected portfolio",
    reference: "{{portfolio.name}}",
    description: "Portfolio fields like name and baseCurrency for the active selection.",
    example: "Base currency: {{portfolio.baseCurrency}}.",
  },
  {
    label: "Active position",
    reference: "{{position.quantity}}",
    description: "Position fields for the selected symbol, including quantity, averageCost, and currency.",
    example: "Current position: {{position.quantity}} shares at {{position.averageCost}} {{position.currency}}.",
  },
  {
    label: "Prior response",
    reference: "{{response.123e4567-e89b-12d3-a456-426614174000}}",
    description: "The full output text from an earlier response in the same portfolio.",
    example: "Build on this earlier response: {{response.123e4567-e89b-12d3-a456-426614174000}}",
  },
  {
    label: "Saved snippet",
    reference: "{{user.snippet.123e4567-e89b-12d3-a456-426614174000}}",
    description: "Reusable text from the User Snippets page. The copied reference there is ready to paste here.",
    example: "Use this checklist: {{user.snippet.123e4567-e89b-12d3-a456-426614174000}}",
  },
  {
    label: "Another symbol",
    reference: "{{stock.MSFT.quote.summary}}",
    description: "Live quote or history context for another symbol mentioned inside the template.",
    example: "Compare {{stock.symbol}} with {{stock.MSFT.quote.summary}}",
  },
  {
    label: "Specific holding",
    reference: "{{position.AAPL.quantity}}",
    description: "Position data for a specific portfolio holding, even if it is not the active symbol.",
    example: "Reference the existing AAPL size: {{position.AAPL.quantity}} shares.",
  },
  {
    label: "Compare step output",
    reference: "{{freshAnalysis.thesis}}",
    description: "Available in compare-step prompts after the fresh analysis step has produced structured output.",
    example: "Re-evaluate the thesis: {{freshAnalysis.thesis}}",
  },
];

const PLACEHOLDER_REFERENCE_TIPS = [
  "Use dot paths, not shorthand. {{stock.symbol}} works, while {{stock}} does not.",
  "Response and snippet placeholders need real UUIDs. Preview will fail if the record does not exist.",
  "Response placeholders only work for responses that belong to the same portfolio.",
  "Use Prompt Preview to confirm the rendered text before saving or running a template.",
  "Escape literal braces with \\{{ and \\}} when you want to show placeholder syntax as plain text.",
];

function TemplateForm({ initial, isPending, onCancel, onSave }: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [templateMode, setTemplateMode] = useState<PromptTemplateMode>(
    initial?.templateMode ?? "single",
  );
  const [instructionsTemplate, setInstructionsTemplate] = useState(
    emptyText(initial?.instructionsTemplate),
  );
  const [inputTemplate, setInputTemplate] = useState(emptyText(initial?.inputTemplate));
  const [freshInstructionsTemplate, setFreshInstructionsTemplate] = useState(
    emptyText(initial?.freshInstructionsTemplate),
  );
  const [freshInputTemplate, setFreshInputTemplate] = useState(
    emptyText(initial?.freshInputTemplate),
  );
  const [compareInstructionsTemplate, setCompareInstructionsTemplate] = useState(
    emptyText(initial?.compareInstructionsTemplate),
  );
  const [compareInputTemplate, setCompareInputTemplate] = useState(
    emptyText(initial?.compareInputTemplate),
  );

  const isSingle = templateMode === "single";
  const hasRequiredFields = isSingle
    ? name.trim() && instructionsTemplate.trim() && inputTemplate.trim()
    : name.trim()
      && freshInstructionsTemplate.trim()
      && freshInputTemplate.trim()
      && compareInstructionsTemplate.trim()
      && compareInputTemplate.trim();

  function handleSave() {
    const shared = {
      name: name.trim(),
      description: description.trim() || null,
      templateMode,
    };

    if (isSingle) {
      onSave({
        ...shared,
        instructionsTemplate: instructionsTemplate.trim(),
        inputTemplate: inputTemplate.trim(),
        freshInstructionsTemplate: null,
        freshInputTemplate: null,
        compareInstructionsTemplate: null,
        compareInputTemplate: null,
      });
      return;
    }

    onSave({
      ...shared,
      instructionsTemplate: null,
      inputTemplate: null,
      freshInstructionsTemplate: freshInstructionsTemplate.trim(),
      freshInputTemplate: freshInputTemplate.trim(),
      compareInstructionsTemplate: compareInstructionsTemplate.trim(),
      compareInputTemplate: compareInputTemplate.trim(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Template Mode</Label>
        <Tabs value={templateMode} onValueChange={(value) => setTemplateMode(value as PromptTemplateMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Prompt</TabsTrigger>
            <TabsTrigger value="two_step">Two Step</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isSingle ? (
        <div className="space-y-4 rounded-xl border p-4">
          <div>
            <Label>Instructions Template</Label>
            <Textarea
              value={instructionsTemplate}
              onChange={(event) => setInstructionsTemplate(event.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={isPending}
            />
          </div>
          <div>
            <Label>Input Template</Label>
            <Textarea
              value={inputTemplate}
              onChange={(event) => setInputTemplate(event.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={isPending}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label>Fresh Instructions Template</Label>
              <Textarea
                value={freshInstructionsTemplate}
                onChange={(event) => setFreshInstructionsTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <Label>Fresh Input Template</Label>
              <Textarea
                value={freshInputTemplate}
                onChange={(event) => setFreshInputTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label>Compare Instructions Template</Label>
              <Textarea
                value={compareInstructionsTemplate}
                onChange={(event) => setCompareInstructionsTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <Label>Compare Input Template</Label>
              <Textarea
                value={compareInputTemplate}
                onChange={(event) => setCompareInputTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending || !hasRequiredFields}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

export function PromptTemplates() {
  const templatesQuery = usePromptTemplates();
  const createMutation = useCreatePromptTemplate();
  const updateMutation = useUpdatePromptTemplate();
  const deleteMutation = useDeletePromptTemplate();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromptTemplateRead | null>(null);

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const sortedTemplates = useMemo(
    () => [...(templatesQuery.data ?? [])].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [templatesQuery.data],
  );

  useEffect(() => {
    if (templatesQuery.isError) {
      toast.error(templatesQuery.error instanceof Error ? templatesQuery.error.message : "Failed to load templates");
    }
  }, [templatesQuery.error, templatesQuery.isError]);

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Prompt Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage saved prompt structures for single-step and two-step stock analysis runs.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={isMutating}>
          <Plus className="mr-1 size-4" /> New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placeholder Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
            Placeholders resolve against live portfolio context during preview and execution. Use
            full dot paths like <code className="rounded bg-muted px-1">{"{{stock.symbol}}"}</code>{" "}
            and <code className="rounded bg-muted px-1">{"{{portfolio.name}}"}</code> in either the
            instructions or input template.
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
            <div className="grid gap-3 md:grid-cols-2">
              {PLACEHOLDER_REFERENCE_ITEMS.map((item) => (
                <div key={item.reference} className="space-y-2 rounded-xl border p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                      {item.label}
                    </p>
                    <code className="mt-2 inline-block rounded bg-muted px-1 py-0.5 text-xs">
                      {item.reference}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">Example</p>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-5">
                      {item.example}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 rounded-xl border p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Usage Tips
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Preview is the fastest way to verify that a placeholder resolves to the value you expect.
                </p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                {PLACEHOLDER_REFERENCE_TIPS.map((tip) => (
                  <p key={tip} className="rounded-lg bg-muted/60 p-3">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {templatesQuery.isPending ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading templates...
            </CardContent>
          </Card>
        ) : null}

        {!templatesQuery.isPending && sortedTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No prompt templates yet. Save one to reuse across stock-analysis runs.
            </CardContent>
          </Card>
        ) : null}

        {sortedTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <FileText className="size-4" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="secondary">
                      {template.templateMode === "single" ? "Single Prompt" : "Two Step"}
                    </Badge>
                    <Badge variant="outline">Revision {template.revision}</Badge>
                    <Badge variant="outline">{template.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description || "No description"}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {formatDateTime(template.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(templateClipboardText(template));
                    toast.success("Template copied");
                  }}
                >
                  <Copy className="size-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(template); setShowForm(true); }}>
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    deleteMutation.mutate(template.id, {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : "Failed to delete template");
                      },
                      onSuccess: () => toast.success("Template deleted"),
                    });
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {template.templateMode === "single" ? (
                <>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{template.instructionsTemplate}</pre>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{template.inputTemplate}</pre>
                </>
              ) : (
                <>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{template.freshInstructionsTemplate}</pre>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{template.freshInputTemplate}</pre>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{template.compareInstructionsTemplate}</pre>
                  <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{template.compareInputTemplate}</pre>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!isMutating) { setShowForm(open); if (!open) { setEditing(null); } } }}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
          </DialogHeader>
          <TemplateForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            isPending={createMutation.isPending || updateMutation.isPending}
            onCancel={closeForm}
            onSave={(data) => {
              if (editing) {
                updateMutation.mutate(
                  { templateId: editing.id, data: data as PromptTemplateUpdate },
                  {
                    onError: (error) => {
                      toast.error(error instanceof Error ? error.message : "Failed to update template");
                    },
                    onSuccess: () => { toast.success("Template updated"); closeForm(); },
                  },
                );
                return;
              }

              createMutation.mutate(data as PromptTemplateWrite, {
                onError: (error) => {
                  toast.error(error instanceof Error ? error.message : "Failed to create template");
                },
                onSuccess: () => { toast.success("Template created"); closeForm(); },
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
