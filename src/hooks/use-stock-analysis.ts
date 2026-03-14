import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStockAnalysisConversation,
  createStockAnalysisRun,
  executeStockAnalysisRun,
  getPortfolioStockAnalysisSettings,
  getStockAnalysisRun,
  getStockAnalysisVersion,
  listStockAnalysisConversations,
  listStockAnalysisResponses,
  listStockAnalysisRuns,
  listStockAnalysisVersions,
  previewStockAnalysisPrompt,
  updatePortfolioStockAnalysisSettings,
  updateStockAnalysisConversation,
} from "@/lib/api";
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys";
import type {
  ListStockAnalysisConversationsParams,
  ListStockAnalysisResponsesParams,
  ListStockAnalysisVersionsParams,
  PortfolioStockAnalysisSettingsUpdate,
  PromptPreviewRequest,
  StockAnalysisConversationUpdate,
  StockAnalysisConversationWrite,
  StockAnalysisRunCreate,
} from "@/lib/api-types";

type UpdateConversationVariables = {
  conversationId: string;
  data: StockAnalysisConversationUpdate;
};

export function useStockAnalysisSettings(portfolioId: string | undefined) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.settings(resolvedPortfolioId),
    queryFn: ({ signal }) =>
      getPortfolioStockAnalysisSettings(resolvedPortfolioId, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useUpdateStockAnalysisSettings(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PortfolioStockAnalysisSettingsUpdate) =>
      updatePortfolioStockAnalysisSettings(portfolioId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useStockAnalysisConversations(
  portfolioId: string | undefined,
  params: ListStockAnalysisConversationsParams = {},
) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.conversations.list(resolvedPortfolioId, params),
    queryFn: ({ signal }) =>
      listStockAnalysisConversations(resolvedPortfolioId, params, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useCreateConversation(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StockAnalysisConversationWrite) =>
      createStockAnalysisConversation(portfolioId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useUpdateConversation(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, data }: UpdateConversationVariables) =>
      updateStockAnalysisConversation(portfolioId, conversationId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useStockAnalysisRuns(
  portfolioId: string | undefined,
  conversationId: string | undefined,
) {
  const resolvedPortfolioId = portfolioId ?? "";
  const resolvedConversationId = conversationId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.runs.list(
      resolvedPortfolioId,
      resolvedConversationId,
    ),
    queryFn: ({ signal }) =>
      listStockAnalysisRuns(resolvedPortfolioId, resolvedConversationId, signal),
    enabled: Boolean(portfolioId && conversationId),
  });
}

export function useCreateRun(portfolioId: string, conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StockAnalysisRunCreate) =>
      createStockAnalysisRun(portfolioId, conversationId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useExecuteRun(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (runId: string) => executeStockAnalysisRun(portfolioId, runId),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useStockAnalysisRun(
  portfolioId: string | undefined,
  runId: string | undefined,
) {
  const resolvedPortfolioId = portfolioId ?? "";
  const resolvedRunId = runId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.runs.detail(resolvedPortfolioId, resolvedRunId),
    queryFn: ({ signal }) => getStockAnalysisRun(resolvedPortfolioId, resolvedRunId, signal),
    enabled: Boolean(portfolioId && runId),
  });
}

export function useStockAnalysisVersions(
  portfolioId: string | undefined,
  params: ListStockAnalysisVersionsParams = {},
) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.versions.list(resolvedPortfolioId, params),
    queryFn: ({ signal }) => listStockAnalysisVersions(resolvedPortfolioId, params, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useStockAnalysisVersion(
  portfolioId: string | undefined,
  versionId: string | undefined,
) {
  const resolvedPortfolioId = portfolioId ?? "";
  const resolvedVersionId = versionId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.versions.detail(
      resolvedPortfolioId,
      resolvedVersionId,
    ),
    queryFn: ({ signal }) =>
      getStockAnalysisVersion(resolvedPortfolioId, resolvedVersionId, signal),
    enabled: Boolean(portfolioId && versionId),
  });
}

export function useStockAnalysisResponses(
  portfolioId: string | undefined,
  params: ListStockAnalysisResponsesParams = {},
) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.responses.list(resolvedPortfolioId, params),
    queryFn: ({ signal }) => listStockAnalysisResponses(resolvedPortfolioId, params, signal),
    enabled: Boolean(portfolioId),
  });
}

export function usePromptPreview(request: PromptPreviewRequest | undefined) {
  const portfolioId = request?.portfolioId;
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.stockAnalysis.promptPreview(resolvedPortfolioId, request),
    queryFn: ({ signal }) =>
      previewStockAnalysisPrompt(resolvedPortfolioId, request as PromptPreviewRequest, signal),
    enabled: Boolean(portfolioId && request),
  });
}
