import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Code2, Copy, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  useDeleteSnippet,
  useSnippets,
  useUpdateSnippet,
} from "@/hooks/use-snippets";
import type { UserSnippetRead, UserSnippetUpdate } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

import { ConfirmDeleteDialog } from "./portfolios/confirm-delete-dialog";
import { SnippetForm } from "./snippet-form";
import { Button } from "./ui/button";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Snippets() {
  const navigate = useNavigate();
  const snippetsQuery = useSnippets();
  const updateMutation = useUpdateSnippet();
  const deleteMutation = useDeleteSnippet();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserSnippetRead | null>(null);
  const [deleting, setDeleting] = useState<UserSnippetRead | null>(null);
  const [expandedSnippetIds, setExpandedSnippetIds] = useState<Record<string, boolean>>({});

  const snippets = useMemo(
    () => [...(snippetsQuery.data ?? [])].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [snippetsQuery.data],
  );
  const isMutating = updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (snippetsQuery.isError) {
      toast.error(snippetsQuery.error instanceof Error ? snippetsQuery.error.message : "Failed to load snippets");
    }
  }, [snippetsQuery.error, snippetsQuery.isError]);

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">User Snippets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Save reusable notes and references for prompt composition.
          </p>
        </div>
        <Button onClick={() => navigate("/snippets/new")} disabled={isMutating}>
          <Plus className="mr-1 size-4" /> New Snippet
        </Button>
      </div>

      <div className="space-y-3">
        {snippetsQuery.isPending ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading snippets...
            </CardContent>
          </Card>
        ) : null}

        {!snippetsQuery.isPending && snippetsQuery.isError && snippets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Unable to load snippets right now.
            </CardContent>
          </Card>
        ) : null}

        {!snippetsQuery.isPending && !snippetsQuery.isError && snippets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No snippets yet. Add one to reuse text across prompts.
            </CardContent>
          </Card>
        ) : null}

        {snippets.map((snippet) => {
          const isExpanded = Boolean(expandedSnippetIds[snippet.id]);

          return (
            <Collapsible
              key={snippet.id}
              open={isExpanded}
              onOpenChange={(open) => {
                setExpandedSnippetIds((current) => ({
                  ...current,
                  [snippet.id]: open,
                }));
              }}
            >
              <Card>
                <CardContent className="py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                        <Code2 className="size-4" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <CardTitle className="text-base">{snippet.snippetId}</CardTitle>
                        <p className="text-sm text-muted-foreground">{snippet.description || "No description"}</p>
                        <p className="text-xs text-muted-foreground">Updated {formatDateTime(snippet.updatedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          Reference <code className="rounded bg-muted px-1">{`{{user.snippet.${snippet.snippetId}}}`}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 self-start">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <ChevronDown className={`size-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          {isExpanded ? "Hide" : "Show"}
                        </Button>
                      </CollapsibleTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-label={`Open actions for ${snippet.snippetId}`} size="icon" variant="ghost">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              void navigator.clipboard.writeText(`{{user.snippet.${snippet.snippetId}}}`);
                              toast.success("Snippet reference copied");
                            }}
                          >
                            <Copy className="size-4" />
                            Copy reference
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditing(snippet);
                              setShowForm(true);
                            }}
                          >
                            <Pencil className="size-4" />
                            Edit snippet
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeleting(snippet)} variant="destructive">
                            <Trash2 className="size-4" />
                            Delete snippet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CollapsibleContent className="pt-4">
                    <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{snippet.content}</pre>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!isMutating) { setShowForm(open); if (!open) { setEditing(null); } } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Snippet</DialogTitle>
          </DialogHeader>
          <SnippetForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            isPending={updateMutation.isPending}
            onCancel={closeForm}
            onSave={(data) => {
              if (editing) {
                updateMutation.mutate(
                  { snippetId: editing.id, data: data as UserSnippetUpdate },
                  {
                    onError: (error) => {
                      toast.error(error instanceof Error ? error.message : "Failed to update snippet");
                    },
                    onSuccess: () => { toast.success("Snippet updated"); closeForm(); },
                  },
                );
                return;
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete snippet"
        description={`Delete ${deleting?.snippetId ?? "this snippet"}? This cannot be undone.`}
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
            onError: (error) => {
              toast.error(error instanceof Error ? error.message : "Failed to delete snippet");
            },
            onSuccess: () => {
              toast.success("Snippet deleted");
              setDeleting(null);
            },
          });
        }}
      />
    </div>
  );
}
