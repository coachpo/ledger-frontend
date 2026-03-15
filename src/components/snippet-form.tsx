import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { UserSnippetCreate, UserSnippetRead, UserSnippetUpdate } from "@/lib/api-types";
import { snippetFormSchema, type SnippetFormValues } from "@/components/form-schemas";

import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

type SnippetFormProps = {
  initial?: UserSnippetRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: UserSnippetCreate | UserSnippetUpdate) => void;
};

export function SnippetForm({ initial, isPending, onCancel, onSave }: SnippetFormProps) {
  const form = useForm<SnippetFormValues>({
    defaultValues: {
      content: initial?.content ?? "",
      description: initial?.description ?? "",
      name: initial?.name ?? "",
      snippetAlias: initial?.snippetAlias ?? "",
    },
    resolver: zodResolver(snippetFormSchema),
  });

  useEffect(() => {
    form.reset({
      content: initial?.content ?? "",
      description: initial?.description ?? "",
      name: initial?.name ?? "",
      snippetAlias: initial?.snippetAlias ?? "",
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
            name: values.name.trim(),
            snippetAlias: values.snippetAlias.trim() || null,
          } satisfies UserSnippetCreate | UserSnippetUpdate),
        )}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="snippetAlias"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Snippet Alias</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} placeholder="hello_snippets" />
              </FormControl>
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
