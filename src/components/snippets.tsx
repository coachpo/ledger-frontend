import { useEffect, useState } from "react";
import { Code2, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateSnippet,
  useDeleteSnippet,
  useSnippets,
  useUpdateSnippet,
} from "@/hooks/use-snippets";
import type { UserSnippetCreate, UserSnippetRead, UserSnippetUpdate } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type SnippetFormProps = {
  initial?: UserSnippetRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: UserSnippetCreate | UserSnippetUpdate) => void;
};

function SnippetForm({ initial, isPending, onCancel, onSave }: SnippetFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <div className="space-y-4">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(event) => setDescription(event.target.value)} disabled={isPending} />
      </div>
      <div>
        <Label>Content</Label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          className="font-mono text-sm"
          disabled={isPending}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave({ name: name.trim(), description: description.trim() || null, content: content.trim() })}
          disabled={isPending || !name.trim() || !content.trim()}
        >
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

export function Snippets() {
  const snippetsQuery = useSnippets();
  const createMutation = useCreateSnippet();
  const updateMutation = useUpdateSnippet();
  const deleteMutation = useDeleteSnippet();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserSnippetRead | null>(null);

  const snippets = snippetsQuery.data ?? [];
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

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
        <Button onClick={() => setShowForm(true)} disabled={isMutating}>
          <Plus className="mr-1 size-4" /> New Snippet
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {snippetsQuery.isPending ? (
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading snippets...
            </CardContent>
          </Card>
        ) : null}

        {!snippetsQuery.isPending && snippets.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              No snippets yet. Add one to reuse text across prompts.
            </CardContent>
          </Card>
        ) : null}

        {snippets.map((snippet) => (
          <Card key={snippet.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <Code2 className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">{snippet.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{snippet.description || "No description"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Updated {formatDateTime(snippet.updatedAt)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(`{{user.snippet.${snippet.id}}}`);
                    toast.success("Snippet reference copied");
                  }}
                >
                  <Copy className="size-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(snippet); setShowForm(true); }}>
                  <Pencil className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    deleteMutation.mutate(snippet.id, {
                      onError: (error) => {
                        toast.error(error instanceof Error ? error.message : "Failed to delete snippet");
                      },
                      onSuccess: () => toast.success("Snippet deleted"),
                    });
                  }}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Reference <code className="rounded bg-muted px-1">{`{{user.snippet.${snippet.id}}}`}</code>
              </p>
              <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">{snippet.content}</pre>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={(open) => { if (!isMutating) { setShowForm(open); if (!open) { setEditing(null); } } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Snippet" : "New Snippet"}</DialogTitle>
          </DialogHeader>
          <SnippetForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            isPending={createMutation.isPending || updateMutation.isPending}
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

              createMutation.mutate(data as UserSnippetCreate, {
                onError: (error) => {
                  toast.error(error instanceof Error ? error.message : "Failed to create snippet");
                },
                onSuccess: () => { toast.success("Snippet created"); closeForm(); },
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
