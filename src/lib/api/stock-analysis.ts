import type * as ApiTypes from "../api-types";
import { type IdParam, request, stockAnalysisPath, toPathSegment } from "../api-client";

export function getPortfolioStockAnalysisSettings(
  portfolioId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioStockAnalysisSettingsRead> {
  return request<ApiTypes.PortfolioStockAnalysisSettingsRead>(`${stockAnalysisPath(portfolioId)}/settings`, {
    signal,
  });
}

export function updatePortfolioStockAnalysisSettings(
  portfolioId: IdParam,
  input: ApiTypes.PortfolioStockAnalysisSettingsUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioStockAnalysisSettingsRead> {
  return request<ApiTypes.PortfolioStockAnalysisSettingsRead>(`${stockAnalysisPath(portfolioId)}/settings`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function listStockAnalysisConversations(
  portfolioId: IdParam,
  params: ApiTypes.ListStockAnalysisConversationsParams = {},
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead[]> {
  return request<ApiTypes.StockAnalysisConversationRead[]>(`${stockAnalysisPath(portfolioId)}/conversations`, {
    query: {
      include_archived: params.includeArchived,
      symbol: params.symbol,
    },
    signal,
  });
}

export function createStockAnalysisConversation(
  portfolioId: IdParam,
  input: ApiTypes.StockAnalysisConversationWrite,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead> {
  return request<ApiTypes.StockAnalysisConversationRead>(`${stockAnalysisPath(portfolioId)}/conversations`, {
    body: input,
    method: "POST",
    signal,
  });
}

export function getStockAnalysisConversation(
  portfolioId: IdParam,
  conversationId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead> {
  return request<ApiTypes.StockAnalysisConversationRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}`,
    { signal },
  );
}

export function updateStockAnalysisConversation(
  portfolioId: IdParam,
  conversationId: IdParam,
  input: ApiTypes.StockAnalysisConversationUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead> {
  return request<ApiTypes.StockAnalysisConversationRead>(
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
): Promise<ApiTypes.StockAnalysisRunRead[]> {
  return request<ApiTypes.StockAnalysisRunRead[]>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}/runs`,
    { signal },
  );
}

export function createStockAnalysisRun(
  portfolioId: IdParam,
  conversationId: IdParam,
  input: ApiTypes.StockAnalysisRunCreate,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisRunRead> {
  return request<ApiTypes.StockAnalysisRunRead>(
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
): Promise<ApiTypes.StockAnalysisRunRead> {
  return request<ApiTypes.StockAnalysisRunRead>(
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
): Promise<ApiTypes.StockAnalysisRunRead> {
  return request<ApiTypes.StockAnalysisRunRead>(
    `${stockAnalysisPath(portfolioId)}/runs/${toPathSegment(runId)}/execute`,
    {
      method: "POST",
      signal,
    },
  );
}

export function listStockAnalysisResponses(
  portfolioId: IdParam,
  params: ApiTypes.ListStockAnalysisResponsesParams = {},
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisResponseSummary[]> {
  return request<ApiTypes.StockAnalysisResponseSummary[]>(`${stockAnalysisPath(portfolioId)}/responses`, {
    query: {
      conversation_id: params.conversationId,
      limit: params.limit,
    },
    signal,
  });
}

export function listStockAnalysisVersions(
  portfolioId: IdParam,
  params: ApiTypes.ListStockAnalysisVersionsParams = {},
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisVersionRead[]> {
  return request<ApiTypes.StockAnalysisVersionRead[]>(`${stockAnalysisPath(portfolioId)}/versions`, {
    query: { symbol: params.symbol },
    signal,
  });
}

export function getStockAnalysisVersion(
  portfolioId: IdParam,
  versionId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisVersionRead> {
  return request<ApiTypes.StockAnalysisVersionRead>(
    `${stockAnalysisPath(portfolioId)}/versions/${toPathSegment(versionId)}`,
    { signal },
  );
}

export function previewStockAnalysisPrompt(
  portfolioId: IdParam,
  input: ApiTypes.PromptPreviewRequest,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptPreviewResponse> {
  return request<ApiTypes.PromptPreviewResponse>(`${stockAnalysisPath(portfolioId)}/prompt-preview`, {
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
