import { useEffect, useMemo, useState } from "react";
import { Clock, Filter, MessageSquare, RefreshCw } from "lucide-react";

import {
  useStockAnalysisConversations,
  useStockAnalysisResponses,
} from "@/hooks/use-stock-analysis";
import { usePortfolios } from "@/hooks/use-portfolios";
import type { StockAnalysisPromptStep } from "@/lib/api-types";
import { SearchableSelect } from "@/components/searchable-select";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const ALL_CONVERSATIONS = "__all_conversations__";

const STEP_LABELS: Record<StockAnalysisPromptStep, string> = {
  fresh_analysis: "Fresh Analysis",
  compare_decide_reflect: "Compare / Decide / Reflect",
  single: "Single Prompt",
  follow_up: "Follow-up",
};

function formatDateLabel(value: string | null) {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ResponsesSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-3 h-7 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="space-y-3 pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-40" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-8/12" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ResponsesPage() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>("");
  const [selectedConversationId, setSelectedConversationId] =
    useState<string>(ALL_CONVERSATIONS);

  const portfoliosQuery = usePortfolios();
  const portfolios = portfoliosQuery.data ?? [];
  const conversationsQuery = useStockAnalysisConversations(
    selectedPortfolioId || undefined,
    { includeArchived: true },
  );
  const responseParams = useMemo(
    () => ({
      conversationId:
        selectedConversationId === ALL_CONVERSATIONS
          ? undefined
          : Number(selectedConversationId),
      limit: 100,
    }),
    [selectedConversationId],
  );
  const responsesQuery = useStockAnalysisResponses(
    selectedPortfolioId || undefined,
    responseParams,
  );

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );
  const portfolioOptions = portfolios.map((portfolio) => ({
    description: `${portfolio.positionCount} positions · ${portfolio.balanceCount} balances`,
    keywords: [portfolio.baseCurrency],
    label: portfolio.name,
    value: String(portfolio.id),
  }));
  const conversationOptions = [
    { label: "All conversations", value: ALL_CONVERSATIONS },
    ...conversations.map((conversation) => ({
      description: conversation.symbol,
      keywords: [conversation.symbol],
      label: conversation.title?.trim() || conversation.symbol,
      value: String(conversation.id),
    })),
  ];
  const responses = useMemo(
    () => [...(responsesQuery.data ?? [])].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [responsesQuery.data],
  );
  const latestResponse = responses[0] ?? null;

  useEffect(() => {
    setSelectedConversationId(ALL_CONVERSATIONS);
  }, [selectedPortfolioId]);

  useEffect(() => {
    if (
      selectedConversationId !== ALL_CONVERSATIONS
      && !conversations.some((conversation) => String(conversation.id) === selectedConversationId)
    ) {
      setSelectedConversationId(ALL_CONVERSATIONS);
    }
  }, [conversations, selectedConversationId]);

  if (portfoliosQuery.isPending) {
    return <ResponsesSkeleton />;
  }

  if (portfoliosQuery.isError) {
    return (
      <div className="p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl tracking-tight">Responses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse live stock-analysis responses by portfolio and conversation.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-lg">Unable to load portfolios.</p>
              <p className="text-sm text-muted-foreground">
                {portfoliosQuery.error instanceof Error
                  ? portfoliosQuery.error.message
                  : "Check the backend connection and try again."}
              </p>
            </div>
            <Button onClick={() => void portfoliosQuery.refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedConversation = conversations.find(
    (conversation) => String(conversation.id) === selectedConversationId,
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl tracking-tight">Responses</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse live stock-analysis responses by portfolio and conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Portfolio
              </p>
              <SearchableSelect
                onValueChange={setSelectedPortfolioId}
                options={portfolioOptions}
                placeholder="Select a portfolio"
                searchPlaceholder="Search portfolios..."
                value={selectedPortfolioId}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Conversation Filter
              </p>
              <SearchableSelect
                disabled={!selectedPortfolioId || conversationsQuery.isPending}
                onValueChange={setSelectedConversationId}
                options={conversationOptions}
                placeholder="All conversations"
                searchPlaceholder="Search conversations..."
                value={selectedConversationId}
              />
              {selectedPortfolioId && conversationsQuery.isError ? (
                <p className="text-xs text-muted-foreground">
                  Conversation filters are unavailable right now.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl">{selectedPortfolioId ? responses.length : 0}</p>
                  <p className="text-xs text-muted-foreground">Visible responses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Filter className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {selectedConversation?.title?.trim()
                      || selectedConversation?.symbol
                      || "All conversations"}
                  </p>
                  <p className="text-xs text-muted-foreground">Current scope</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {formatDateLabel(latestResponse?.createdAt ?? null)}
                  </p>
                  <p className="text-xs text-muted-foreground">Latest response</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!selectedPortfolioId ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a portfolio to load stock-analysis responses.
          </CardContent>
        </Card>
      ) : responsesQuery.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3 pb-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-44" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-9/12" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : responsesQuery.isError ? (
        <Card>
          <CardContent className="flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-lg">Unable to load responses.</p>
              <p className="text-sm text-muted-foreground">
                {responsesQuery.error instanceof Error
                  ? responsesQuery.error.message
                  : "Check the backend connection and try again."}
              </p>
            </div>
            <Button onClick={() => void responsesQuery.refetch()}>
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : responses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No responses found for this portfolio yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => {
            const conversation = conversations.find(
              (conversationItem) => conversationItem.id === response.conversationId,
            );

            return (
              <Card key={response.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{response.symbol}</CardTitle>
                        <Badge variant="outline">{STEP_LABELS[response.step]}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{formatDateLabel(response.createdAt)}</span>
                        <span>
                          {conversation?.title?.trim() || conversation?.symbol || response.conversationId}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">{response.id}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {response.outputTextPreview}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
