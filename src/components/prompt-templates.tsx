import { useEffect, useMemo, useState } from "react";
import { Copy, FileText, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  useDeletePromptTemplate,
  usePromptTemplates,
  useUpdatePromptTemplate,
} from "@/hooks/use-prompt-templates";
import type {
  PromptTemplateRead,
  PromptTemplateUpdate,
} from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PromptTemplateForm } from "./prompt-template-form";

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

export function PromptTemplates() {
  const navigate = useNavigate();
  const templatesQuery = usePromptTemplates();
  const updateMutation = useUpdatePromptTemplate();
  const deleteMutation = useDeletePromptTemplate();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PromptTemplateRead | null>(null);

  const isMutating = updateMutation.isPending || deleteMutation.isPending;
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
            Manage saved prompt structures for single-step and two-step stock analysis workflows.
          </p>
        </div>
        <Button onClick={() => navigate("/templates/new")} disabled={isMutating}>
          <Plus className="mr-1 size-4" /> New Template
        </Button>
      </div>

      <div className="space-y-4">
        {templatesQuery.isPending ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading templates...
            </CardContent>
          </Card>
        ) : null}

        {!templatesQuery.isPending && templatesQuery.isError && sortedTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Unable to load templates right now.
            </CardContent>
          </Card>
        ) : null}

        {!templatesQuery.isPending && !templatesQuery.isError && sortedTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No prompt templates yet. Save one to reuse across stock-analysis workflows.
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button aria-label={`Open actions for ${template.name}`} size="icon" variant="ghost">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigator.clipboard.writeText(templateClipboardText(template));
                      toast.success("Template copied");
                    }}
                  >
                    <Copy className="size-4" />
                    Copy template
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditing(template);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="size-4" />
                    Edit template
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={deleteMutation.isPending}
                    onSelect={() => {
                      deleteMutation.mutate(template.id, {
                        onError: (error) => {
                          toast.error(error instanceof Error ? error.message : "Failed to delete template");
                        },
                        onSuccess: () => toast.success("Template deleted"),
                      });
                    }}
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <PromptTemplateForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            isPending={updateMutation.isPending}
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
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
