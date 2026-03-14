import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, FolderKanban, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { ConversationPicker } from "@/components/stock-analysis/conversation-picker";
import { RunBuilderForm } from "@/components/stock-analysis/run-builder-form";
import { RunStatusDisplay } from "@/components/stock-analysis/run-status-display";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePortfolios } from "@/hooks/use-portfolios";
import {
  useCreateConversation,
  useStockAnalysisConversations,
  useStockAnalysisSettings,
} from "@/hooks/use-stock-analysis";

export function RunBuilderPage() {
  const portfoliosQuery = usePortfolios();
  const [portfolioId, setPortfolioId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [activeRunId, setActiveRunId] = useState<number | null>(null);

  const portfolios = useMemo(() => portfoliosQuery.data ?? [], [portfoliosQuery.data]);
  const settingsQuery = useStockAnalysisSettings(portfolioId || undefined);
  const conversationsQuery = useStockAnalysisConversations(portfolioId || undefined, {
    includeArchived: false,
  });
  const createConversation = useCreateConversation(portfolioId || "__missing__");
  const selectedPortfolio = useMemo(
    () =>
      portfolios.find((portfolio) => String(portfolio.id) === portfolioId) ?? null,
    [portfolioId, portfolios],
  );
  const selectedConversation = useMemo(
    () =>
      (conversationsQuery.data ?? []).find(
        (conversation) => String(conversation.id) === selectedConversationId,
      ) ?? null,
    [conversationsQuery.data, selectedConversationId],
  );

  useEffect(() => {
    if (!portfolioId && portfolios.length > 0) {
      setPortfolioId(String(portfolios[0].id));
    }
  }, [portfolioId, portfolios]);

  function resetBuilderState() {
    setSelectedConversationId("");
    setActiveRunId(null);
  }

  function handlePortfolioChange(nextPortfolioId: string) {
    setPortfolioId(nextPortfolioId);
    resetBuilderState();
  }

  function handleConversationSelect(conversationId: string) {
    setSelectedConversationId(conversationId);
    setActiveRunId(null);
  }

  if (portfoliosQuery.isPending) {
    return (
      <div className="max-w-6xl space-y-6 p-6">
        <Card>
          <CardContent className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading portfolios...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (portfoliosQuery.isError) {
    return (
      <div className="max-w-6xl space-y-6 p-6">
        <Card>
          <CardContent className="flex flex-col gap-4 py-12 sm:flex-row sm:items-center sm:justify-between">
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

  if (portfolios.length === 0) {
    return (
      <div className="max-w-6xl space-y-6 p-6">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Create a portfolio before launching stock analysis runs.
          </CardContent>
        </Card>
      </div>
    );
  }

  const analysisEnabled = settingsQuery.data?.enabled ?? true;

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-sky-50 via-background to-amber-50 p-6 shadow-sm dark:from-sky-950/20 dark:via-background dark:to-amber-950/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <BrainCircuit className="size-3.5" />
              Conversation to run to execution
            </Badge>
            <div>
              <h1 className="text-2xl tracking-tight">Stock analysis runs</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick a portfolio, open a conversation thread, then launch a real
                backend run.
              </p>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Portfolio
            </span>
            <Select value={portfolioId} onValueChange={handlePortfolioChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a portfolio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={String(portfolio.id)}>
                    {portfolio.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedPortfolio ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="gap-1.5">
              <FolderKanban className="size-3" />
              {selectedPortfolio.positionCount} positions
            </Badge>
            <Badge variant="outline">{selectedPortfolio.balanceCount} balances</Badge>
            <Badge variant="outline">
              Base currency: {selectedPortfolio.baseCurrency}
            </Badge>
            {settingsQuery.isPending ? (
              <Badge variant="outline" className="gap-1.5">
                <Loader2 className="size-3 animate-spin" /> Loading defaults
              </Badge>
            ) : null}
            {settingsQuery.data?.defaultLlmConfigId ? (
              <Badge variant="outline">Default config ready</Badge>
            ) : null}
            {settingsQuery.data?.defaultPromptTemplateId ? (
              <Badge variant="outline">Default template ready</Badge>
            ) : null}
          </div>
        ) : null}
      </section>

      {settingsQuery.isError ? (
        <Alert>
          <AlertTitle>Portfolio settings are temporarily unavailable</AlertTitle>
          <AlertDescription>
            {settingsQuery.error instanceof Error
              ? settingsQuery.error.message
              : "Run defaults could not be loaded, but you can still configure a run manually."}
          </AlertDescription>
        </Alert>
      ) : null}

      {selectedPortfolio && !analysisEnabled ? (
        <Alert>
          <AlertTitle>Stock analysis is disabled for this portfolio</AlertTitle>
          <AlertDescription>
            Conversation browsing stays available, but run execution remains blocked
            until the portfolio setting is enabled.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <ConversationPicker
          conversations={conversationsQuery.data ?? []}
          selectedConversationId={selectedConversationId}
          isLoading={conversationsQuery.isPending}
          disabled={!portfolioId || createConversation.isPending}
          onSelect={handleConversationSelect}
          onCreate={async (data) => {
            try {
              const conversation = await createConversation.mutateAsync(data);
              toast.success("Conversation created");
              setSelectedConversationId(String(conversation.id));
            } catch (error) {
              toast.error(
                error instanceof Error ? error.message : "Failed to create conversation",
              );
            }
          }}
        />

        <div className="space-y-6">
          {selectedConversation && selectedPortfolio ? (
            <>
              <Card className="border-border/60 bg-muted/10">
                <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {selectedConversation.title?.trim() ||
                        `${selectedConversation.symbol} coverage`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Build the next run for {selectedConversation.symbol} inside this
                      conversation.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{selectedConversation.symbol}</Badge>
                    <Badge variant="outline">
                      {selectedConversation.runCount} runs
                    </Badge>
                    <Badge variant="outline">
                      {selectedConversation.versionCount} versions
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <RunBuilderForm
                conversationId={selectedConversation.id}
                isAnalysisEnabled={analysisEnabled}
                onRunStarted={setActiveRunId}
                portfolioId={selectedPortfolio.id}
                settings={settingsQuery.data}
                symbol={selectedConversation.symbol}
              />
            </>
          ) : (
            <Card className="border-border/60 bg-muted/10">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Choose an existing conversation or create one on the left to unlock
                the run builder.
              </CardContent>
            </Card>
          )}

          <RunStatusDisplay portfolioId={selectedPortfolio?.id} runId={activeRunId ?? undefined} />
        </div>
      </div>
    </div>
  );
}
