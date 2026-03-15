import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { UserSnippetCreate, UserSnippetRead, UserSnippetUpdate } from "@/lib/types/snippet";
import { snippetFormSchema, type SnippetFormValues } from "@/components/shared/form-schemas";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type SnippetFormProps = {
  initial?: UserSnippetRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: UserSnippetCreate | UserSnippetUpdate) => void;
};

export function SnippetForm({ initial, isPending, onCancel, onSave }: SnippetFormProps) {
  const isEditing = Boolean(initial);
  const form = useForm<SnippetFormValues>({
    defaultValues: {
      content: initial?.content ?? "",
      description: initial?.description ?? "",
      snippetId: initial?.snippetId ?? "",
    },
    resolver: zodResolver(snippetFormSchema),
  });

  useEffect(() => {
    form.reset({
      content: initial?.content ?? "",
      description: initial?.description ?? "",
      snippetId: initial?.snippetId ?? "",
    });
  }, [form, initial]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          onSave({
            content: values.content.trim(),
            description: values.description.trim() || null,
            ...(isEditing ? {} : { snippetId: values.snippetId.trim() }),
          } satisfies UserSnippetCreate | UserSnippetUpdate),
        )}
      >
        <FormField
          control={form.control}
          name="snippetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Snippet ID</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending || isEditing} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Letters, numbers, and underscores only. This becomes the prompt placeholder segment.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline" disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
