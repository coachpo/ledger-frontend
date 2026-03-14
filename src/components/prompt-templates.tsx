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

  const templates = templatesQuery.data ?? [];
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const sortedTemplates = useMemo(
    () => [...templates].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [templates],
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
        <CardContent className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
          <span><code className="rounded bg-muted px-1">{"{{stock}}"}</code> current symbol</span>
          <span><code className="rounded bg-muted px-1">{"{{portfolio}}"}</code> selected portfolio</span>
          <span><code className="rounded bg-muted px-1">{"{{position}}"}</code> active position</span>
          <span><code className="rounded bg-muted px-1">{"{{response.ID}}"}</code> prior response</span>
          <span><code className="rounded bg-muted px-1">{"{{user.snippet.ID}}"}</code> saved snippet</span>
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
