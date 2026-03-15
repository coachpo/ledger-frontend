import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import type { StockAnalysisConversationRead, StockAnalysisConversationWrite } from "@/lib/types/stock-analysis";
import { formatDateTime } from "@/lib/format";
import {
  conversationFormSchema,
  type ConversationFormValues,
} from "@/components/shared/form-schemas";
import { SearchableSelect } from "@/components/shared/searchable-select";

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

type ConversationPickerProps = {
  conversations: StockAnalysisConversationRead[];
  selectedConversationId: string;
  isLoading: boolean;
  disabled: boolean;
  onSelect: (conversationId: string) => void;
  onCreate: (data: StockAnalysisConversationWrite) => Promise<void>;
};

export function ConversationPicker({
  conversations,
  selectedConversationId,
  isLoading,
  disabled,
  onSelect,
  onCreate,
}: ConversationPickerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const form = useForm<ConversationFormValues>({
    defaultValues: {
      nextReviewAt: "",
      reviewCadence: "",
      symbol: "",
      title: "",
    },
    mode: "onChange",
    resolver: zodResolver(conversationFormSchema),
  });
  const conversationOptions = conversations.map((conversation) => ({
    description: formatDateTime(conversation.updatedAt),
    keywords: [conversation.symbol, conversation.title ?? ""],
    label: conversation.title?.trim() || conversation.symbol,
    value: String(conversation.id),
  }));

  return (
    <div className="space-y-4 rounded-2xl border p-5">
      <div>
        <p className="text-sm font-medium">Conversation</p>
        <p className="text-xs text-muted-foreground">
          Pick an existing analysis thread or create a new one.
        </p>
      </div>
      <div>
        <FormLabel>Existing Conversations</FormLabel>
        <div className="mt-2">
          <SearchableSelect
            disabled={disabled || isLoading}
            emptyText="No conversations match your search."
            onValueChange={onSelect}
            options={conversationOptions}
            placeholder={isLoading ? "Loading conversations..." : "Select conversation"}
            searchPlaceholder="Search conversations..."
            value={selectedConversationId}
          />
        </div>
      </div>
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            setIsCreating(true);
            try {
              await onCreate({
                nextReviewAt: values.nextReviewAt ? new Date(values.nextReviewAt).toISOString() : null,
                reviewCadence: values.reviewCadence.trim() || null,
                symbol: values.symbol.trim().toUpperCase(),
                title: values.title.trim() || null,
              } satisfies StockAnalysisConversationWrite);
              form.reset({
                nextReviewAt: "",
                reviewCadence: "",
                symbol: "",
                title: "",
              });
            } finally {
              setIsCreating(false);
            }
          })}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled || isCreating}
                      onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled || isCreating} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="reviewCadence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Cadence</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled || isCreating} placeholder="monthly" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextReviewAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Review</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={disabled || isCreating} type="datetime-local" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button disabled={disabled || isCreating || !form.formState.isValid} type="submit">
            {isCreating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Create Conversation
          </Button>
        </form>
      </Form>
    </div>
  );
}
