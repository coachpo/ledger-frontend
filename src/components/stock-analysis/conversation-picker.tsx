import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import type {
  StockAnalysisConversationRead,
  StockAnalysisConversationWrite,
} from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [symbol, setSymbol] = useState("");
  const [title, setTitle] = useState("");
  const [reviewCadence, setReviewCadence] = useState("");
  const [nextReviewAt, setNextReviewAt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="space-y-4 rounded-2xl border p-5">
      <div>
        <p className="text-sm font-medium">Conversation</p>
        <p className="text-xs text-muted-foreground">
          Pick an existing analysis thread or create a new one.
        </p>
      </div>
      <div>
        <Label>Existing Conversations</Label>
        <Select
          value={selectedConversationId}
          onValueChange={onSelect}
          disabled={disabled || isLoading || conversations.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={isLoading ? "Loading conversations..." : "Select conversation"}
            />
          </SelectTrigger>
          <SelectContent>
            {conversations.map((conversation) => (
              <SelectItem key={conversation.id} value={String(conversation.id)}>
                {(conversation.title?.trim() || conversation.symbol)} -{" "}
                {formatDateTime(conversation.updatedAt)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Symbol</Label>
          <Input
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            disabled={disabled || isCreating}
          />
        </div>
        <div>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={disabled || isCreating}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Review Cadence</Label>
          <Input
            value={reviewCadence}
            onChange={(event) => setReviewCadence(event.target.value)}
            placeholder="monthly"
            disabled={disabled || isCreating}
          />
        </div>
        <div>
          <Label>Next Review</Label>
          <Input
            type="datetime-local"
            value={nextReviewAt}
            onChange={(event) => setNextReviewAt(event.target.value)}
            disabled={disabled || isCreating}
          />
        </div>
      </div>
      <Button
        disabled={disabled || isCreating || !symbol.trim()}
        onClick={async () => {
          setIsCreating(true);
          try {
            await onCreate({
              symbol: symbol.trim().toUpperCase(),
              title: title.trim() || null,
              reviewCadence: reviewCadence.trim() || null,
              nextReviewAt: nextReviewAt ? new Date(nextReviewAt).toISOString() : null,
            });
            setSymbol("");
            setTitle("");
            setReviewCadence("");
            setNextReviewAt("");
          } finally {
            setIsCreating(false);
          }
        }}
      >
        {isCreating ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Plus className="mr-2 size-4" />
        )}
        Create Conversation
      </Button>
    </div>
  );
}
