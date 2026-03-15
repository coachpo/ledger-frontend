import type { PortfolioStockAnalysisSettingsRead, PortfolioStockAnalysisSettingsUpdate } from "../types/portfolio";
import type { ListStockAnalysisConversationsParams, StockAnalysisConversationRead, StockAnalysisConversationWrite, StockAnalysisConversationUpdate, StockAnalysisRunRead, StockAnalysisRunCreate, ListStockAnalysisResponsesParams, StockAnalysisResponseSummary, ListStockAnalysisVersionsParams, StockAnalysisVersionRead, PromptPreviewRequest, PromptPreviewResponse } from "../types/stock-analysis";
import { type IdParam, request, stockAnalysisPath, toPathSegment } from "../api-client";

export function getPortfolioStockAnalysisSettings(
  portfolioId: IdParam,
  signal?: AbortSignal,
): Promise<PortfolioStockAnalysisSettingsRead> {
  return request<PortfolioStockAnalysisSettingsRead>(`${stockAnalysisPath(portfolioId)}/settings`, {
    signal,
  });
}

export function updatePortfolioStockAnalysisSettings(
  portfolioId: IdParam,
  input: PortfolioStockAnalysisSettingsUpdate,
  signal?: AbortSignal,
): Promise<PortfolioStockAnalysisSettingsRead> {
  return request<PortfolioStockAnalysisSettingsRead>(`${stockAnalysisPath(portfolioId)}/settings`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function listStockAnalysisConversations(
  portfolioId: IdParam,
  params: ListStockAnalysisConversationsParams = {},
  signal?: AbortSignal,
): Promise<StockAnalysisConversationRead[]> {
  return request<StockAnalysisConversationRead[]>(`${stockAnalysisPath(portfolioId)}/conversations`, {
    query: {
      include_archived: params.includeArchived,
      symbol: params.symbol,
    },
    signal,
  });
}

export function createStockAnalysisConversation(
  portfolioId: IdParam,
  input: StockAnalysisConversationWrite,
  signal?: AbortSignal,
): Promise<StockAnalysisConversationRead> {
  return request<StockAnalysisConversationRead>(`${stockAnalysisPath(portfolioId)}/conversations`, {
    body: input,
    method: "POST",
    signal,
  });
}

export function getStockAnalysisConversation(
  portfolioId: IdParam,
  conversationId: IdParam,
  signal?: AbortSignal,
): Promise<StockAnalysisConversationRead> {
  return request<StockAnalysisConversationRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}`,
    { signal },
  );
}

export function updateStockAnalysisConversation(
  portfolioId: IdParam,
  conversationId: IdParam,
  input: StockAnalysisConversationUpdate,
  signal?: AbortSignal,
): Promise<StockAnalysisConversationRead> {
  return request<StockAnalysisConversationRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}`,
    {
      body: input,
      method: "PATCH",
      signal,
    },
  );
}

export function listStockAnalysisRuns(
  portfolioId: IdParam,
  conversationId: IdParam,
  signal?: AbortSignal,
): Promise<StockAnalysisRunRead[]> {
  return request<StockAnalysisRunRead[]>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}/runs`,
    { signal },
  );
}

export function createStockAnalysisRun(
  portfolioId: IdParam,
  conversationId: IdParam,
  input: StockAnalysisRunCreate,
  signal?: AbortSignal,
): Promise<StockAnalysisRunRead> {
  return request<StockAnalysisRunRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}/runs`,
    {
      body: input,
      method: "POST",
      signal,
    },
  );
}

export function getStockAnalysisRun(
  portfolioId: IdParam,
  runId: IdParam,
  signal?: AbortSignal,
): Promise<StockAnalysisRunRead> {
  return request<StockAnalysisRunRead>(
    `${stockAnalysisPath(portfolioId)}/runs/${toPathSegment(runId)}`,
    {
      signal,
    },
  );
}

export function executeStockAnalysisRun(
  portfolioId: IdParam,
  runId: IdParam,
  signal?: AbortSignal,
): Promise<StockAnalysisRunRead> {
  return request<StockAnalysisRunRead>(
    `${stockAnalysisPath(portfolioId)}/runs/${toPathSegment(runId)}/execute`,
    {
      method: "POST",
      signal,
    },
  );
}

export function listStockAnalysisResponses(
  portfolioId: IdParam,
  params: ListStockAnalysisResponsesParams = {},
  signal?: AbortSignal,
): Promise<StockAnalysisResponseSummary[]> {
  return request<StockAnalysisResponseSummary[]>(`${stockAnalysisPath(portfolioId)}/responses`, {
    query: {
      conversation_id: params.conversationId,
      limit: params.limit,
    },
    signal,
  });
}

export function listStockAnalysisVersions(
  portfolioId: IdParam,
  params: ListStockAnalysisVersionsParams = {},
  signal?: AbortSignal,
): Promise<StockAnalysisVersionRead[]> {
  return request<StockAnalysisVersionRead[]>(`${stockAnalysisPath(portfolioId)}/versions`, {
    query: { symbol: params.symbol },
    signal,
  });
}

export function getStockAnalysisVersion(
  portfolioId: IdParam,
  versionId: IdParam,
  signal?: AbortSignal,
): Promise<StockAnalysisVersionRead> {
  return request<StockAnalysisVersionRead>(
    `${stockAnalysisPath(portfolioId)}/versions/${toPathSegment(versionId)}`,
    { signal },
  );
}

export function previewStockAnalysisPrompt(
  portfolioId: IdParam,
  input: PromptPreviewRequest,
  signal?: AbortSignal,
): Promise<PromptPreviewResponse> {
  return request<PromptPreviewResponse>(`${stockAnalysisPath(portfolioId)}/prompt-preview`, {
    body: input,
    method: "POST",
    signal,
  });
}

export const stockAnalysisApi = {
  conversations: {
    create: createStockAnalysisConversation,
    get: getStockAnalysisConversation,
    list: listStockAnalysisConversations,
    update: updateStockAnalysisConversation,
  },
  promptPreview: previewStockAnalysisPrompt,
  responses: {
    list: listStockAnalysisResponses,
  },
  runs: {
    create: createStockAnalysisRun,
    execute: executeStockAnalysisRun,
    get: getStockAnalysisRun,
    list: listStockAnalysisRuns,
  },
  settings: {
    get: getPortfolioStockAnalysisSettings,
    update: updatePortfolioStockAnalysisSettings,
  },
  versions: {
    get: getStockAnalysisVersion,
    list: listStockAnalysisVersions,
  },
} as const;
