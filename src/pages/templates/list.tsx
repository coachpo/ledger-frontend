import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  useDeleteTemplate,
  useTemplates,
} from "@/hooks/use-templates";
import { formatDateTime } from "@/lib/format";
import type { TextTemplateRead } from "@/lib/api-types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ConfirmDeleteDialog } from "@/components/portfolios/confirm-delete-dialog";

export function TemplateListPage() {
  const navigate = useNavigate();
  const templatesQuery = useTemplates();
  const deleteMutation = useDeleteTemplate();
  const [deleting, setDeleting] = useState<TextTemplateRead | null>(null);

  const templates = templatesQuery.data ?? [];

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage text templates with portfolio data placeholders.
          </p>
        </div>
        <Button onClick={() => navigate("/templates/new")}>
          <Plus className="mr-1 size-4" /> New Template
        </Button>
      </div>

      <div className="space-y-3">
        {templatesQuery.isPending ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Loading templates...</CardContent>
          </Card>
        ) : null}
        {templatesQuery.isError ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {templatesQuery.error instanceof Error ? templatesQuery.error.message : "Failed to load templates."}
            </CardContent>
          </Card>
        ) : null}
        {!templatesQuery.isPending && !templatesQuery.isError && templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No templates yet.</CardContent>
          </Card>
        ) : null}
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="outline">
                    {template.content.length > 80
                      ? `${template.content.slice(0, 80)}...`
                      : template.content}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Updated {formatDateTime(template.updatedAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-label={`Open actions for ${template.name}`} size="icon" variant="ghost">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate(`/templates/${template.id}/edit`)}>
                      <Pencil className="size-4" />
                      Edit template
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setDeleting(template)} variant="destructive">
                      <Trash2 className="size-4" />
                      Delete template
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={() => navigate(`/templates/${template.id}/edit`)}>
                  Open Editor
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete template"
        description={`Delete ${deleting?.name ?? "this template"}? This cannot be undone.`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        onConfirm={() => {
          if (!deleting) {
            return;
          }

          deleteMutation.mutate(deleting.id, {
            onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to delete template"),
            onSuccess: () => {
              toast.success("Template deleted");
              setDeleting(null);
            },
          });
        }}
      />
    </div>
  );
}
