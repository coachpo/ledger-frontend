import { useId, useState } from "react";

import type { UserSnippetCreate, UserSnippetRead, UserSnippetUpdate } from "@/lib/api-types";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type SnippetFormProps = {
  initial?: UserSnippetRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: UserSnippetCreate | UserSnippetUpdate) => void;
};

export function SnippetForm({ initial, isPending, onCancel, onSave }: SnippetFormProps) {
  const nameId = useId();
  const snippetAliasId = useId();
  const descriptionId = useId();
  const contentId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [snippetAlias, setSnippetAlias] = useState(initial?.snippetAlias ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={nameId}>Name</Label>
        <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
      </div>
      <div>
        <Label htmlFor={snippetAliasId}>Snippet Alias</Label>
        <Input
          id={snippetAliasId}
          value={snippetAlias}
          onChange={(event) => setSnippetAlias(event.target.value)}
          placeholder="hello_snippets"
          disabled={isPending}
        />
      </div>
      <div>
        <Label htmlFor={descriptionId}>Description</Label>
        <Input id={descriptionId} value={description} onChange={(event) => setDescription(event.target.value)} disabled={isPending} />
      </div>
      <div>
        <Label htmlFor={contentId}>Content</Label>
        <Textarea
          id={contentId}
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
          onClick={() =>
            onSave({
              name: name.trim(),
              snippetAlias: snippetAlias.trim() || null,
              description: description.trim() || null,
              content: content.trim(),
            })
          }
          disabled={isPending || !name.trim() || !content.trim()}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
