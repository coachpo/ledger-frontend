import type { QueryClient } from "@tanstack/react-query";
import type * as ApiTypes from "./api-types";

const apiRoot = ["api"] as const;

function portfolioRoot(portfolioId: string) {
  return [...apiRoot, "portfolios", portfolioId] as const;
}

function stockAnalysisRoot(portfolioId: string) {
  return [...portfolioRoot(portfolioId), "stockAnalysis"] as const;
}

function normalizeSymbols(symbols: readonly string[]) {
  return [...new Set(symbols.map((symbol) => symbol.trim()).filter(Boolean))].sort();
}

function normalizeConversationParams(
  params: ApiTypes.ListStockAnalysisConversationsParams = {},
) {
  return {
    includeArchived: params.includeArchived ?? false,
    symbol: params.symbol ?? null,
  };
}

function normalizeResponseParams(params: ApiTypes.ListStockAnalysisResponsesParams = {}) {
  return {
    conversationId: params.conversationId ?? null,
    limit: params.limit ?? 20,
  };
}

function normalizeVersionParams(params: ApiTypes.ListStockAnalysisVersionsParams = {}) {
  return {
    symbol: params.symbol ?? null,
  };
}

function normalizeHistoryParams(params: ApiTypes.GetMarketHistoryParams) {
  return {
    range: params.range ?? "3mo",
    symbols: normalizeSymbols(params.symbols),
  };
}

const portfoliosQueryKeys = {
  all: [...apiRoot, "portfolios"] as const,
  detail: (portfolioId: string) => [...apiRoot, "portfolios", "detail", portfolioId] as const,
  details: () => [...apiRoot, "portfolios", "detail"] as const,
  list: () => [...apiRoot, "portfolios", "list"] as const,
  lists: () => [...apiRoot, "portfolios", "list"] as const,
} as const;

const balancesQueryKeys = {
  all: (portfolioId: string) => [...portfolioRoot(portfolioId), "balances"] as const,
  detail: (portfolioId: string, balanceId: string) =>
    [...portfolioRoot(portfolioId), "balances", "detail", balanceId] as const,
  list: (portfolioId: string) => [...portfolioRoot(portfolioId), "balances", "list"] as const,
} as const;

const positionsQueryKeys = {
  all: (portfolioId: string) => [...portfolioRoot(portfolioId), "positions"] as const,
  detail: (portfolioId: string, positionId: string) =>
    [...portfolioRoot(portfolioId), "positions", "detail", positionId] as const,
  list: (portfolioId: string) => [...portfolioRoot(portfolioId), "positions", "list"] as const,
} as const;

const tradesQueryKeys = {
  all: (portfolioId: string) => [...portfolioRoot(portfolioId), "trades"] as const,
  detail: (portfolioId: string, tradeId: string) =>
    [...portfolioRoot(portfolioId), "trades", "detail", tradeId] as const,
  list: (portfolioId: string) => [...portfolioRoot(portfolioId), "trades", "list"] as const,
} as const;

const marketDataQueryKeys = {
  all: (portfolioId: string) => [...portfolioRoot(portfolioId), "marketData"] as const,
  quotes: (portfolioId: string, params: ApiTypes.GetMarketQuotesParams) =>
    [...portfolioRoot(portfolioId), "marketData", "quotes", normalizeSymbols(params.symbols)] as const,
} as const;

const marketHistoryQueryKeys = {
  all: (portfolioId: string) => [...portfolioRoot(portfolioId), "marketHistory"] as const,
  series: (portfolioId: string, params: ApiTypes.GetMarketHistoryParams) =>
    [...portfolioRoot(portfolioId), "marketHistory", "series", normalizeHistoryParams(params)] as const,
} as const;

const llmConfigsQueryKeys = {
  all: [...apiRoot, "llmConfigs"] as const,
  detail: (configId: string) => [...apiRoot, "llmConfigs", "detail", configId] as const,
  details: () => [...apiRoot, "llmConfigs", "detail"] as const,
  list: () => [...apiRoot, "llmConfigs", "list"] as const,
  lists: () => [...apiRoot, "llmConfigs", "list"] as const,
} as const;

const promptTemplatesQueryKeys = {
  all: [...apiRoot, "promptTemplates"] as const,
  detail: (templateId: string) => [...apiRoot, "promptTemplates", "detail", templateId] as const,
  details: () => [...apiRoot, "promptTemplates", "detail"] as const,
  list: () => [...apiRoot, "promptTemplates", "list"] as const,
  lists: () => [...apiRoot, "promptTemplates", "list"] as const,
  preview: (request: ApiTypes.PromptPreviewRequest) =>
    [...apiRoot, "promptTemplates", "preview", request] as const,
} as const;

const snippetsQueryKeys = {
  all: [...apiRoot, "snippets"] as const,
  detail: (snippetId: string) => [...apiRoot, "snippets", "detail", snippetId] as const,
  details: () => [...apiRoot, "snippets", "detail"] as const,
  list: () => [...apiRoot, "snippets", "list"] as const,
  lists: () => [...apiRoot, "snippets", "list"] as const,
} as const;

const stockAnalysisQueryKeys = {
  all: (portfolioId: string) => [...stockAnalysisRoot(portfolioId)] as const,
  promptPreview: (portfolioId: string, request?: ApiTypes.PromptPreviewRequest) =>
    [...stockAnalysisRoot(portfolioId), "promptPreview", request ?? null] as const,
  settings: (portfolioId: string) => [...stockAnalysisRoot(portfolioId), "settings"] as const,
  conversations: {
    all: (portfolioId: string) => [...stockAnalysisRoot(portfolioId), "conversations"] as const,
    detail: (portfolioId: string, conversationId: string) =>
      [...stockAnalysisRoot(portfolioId), "conversations", "detail", conversationId] as const,
    list: (
      portfolioId: string,
      params: ApiTypes.ListStockAnalysisConversationsParams = {},
    ) =>
      [
        ...stockAnalysisRoot(portfolioId),
        "conversations",
        "list",
        normalizeConversationParams(params),
      ] as const,
  },
  responses: {
    all: (portfolioId: string) => [...stockAnalysisRoot(portfolioId), "responses"] as const,
    list: (
      portfolioId: string,
      params: ApiTypes.ListStockAnalysisResponsesParams = {},
    ) =>
      [...stockAnalysisRoot(portfolioId), "responses", "list", normalizeResponseParams(params)] as const,
  },
  versions: {
    all: (portfolioId: string) => [...stockAnalysisRoot(portfolioId), "versions"] as const,
    detail: (portfolioId: string, versionId: string) =>
      [...stockAnalysisRoot(portfolioId), "versions", "detail", versionId] as const,
    list: (
      portfolioId: string,
      params: ApiTypes.ListStockAnalysisVersionsParams = {},
    ) =>
      [...stockAnalysisRoot(portfolioId), "versions", "list", normalizeVersionParams(params)] as const,
  },
} as const;

export const queryKeys = {
  all: apiRoot,
  balances: balancesQueryKeys,
  llmConfigs: llmConfigsQueryKeys,
  marketData: marketDataQueryKeys,
  marketHistory: marketHistoryQueryKeys,
  portfolios: portfoliosQueryKeys,
  positions: positionsQueryKeys,
  promptTemplates: promptTemplatesQueryKeys,
  snippets: snippetsQueryKeys,
  stockAnalysis: stockAnalysisQueryKeys,
  trades: tradesQueryKeys,
  tradingOperations: tradesQueryKeys,
  userSnippets: snippetsQueryKeys,
} as const;

export async function invalidatePortfolioScope(
  queryClient: QueryClient,
  portfolioId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.detail(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.balances.all(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.positions.all(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.trades.all(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.marketData.all(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.marketHistory.all(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.stockAnalysis.all(portfolioId) }),
  ]);
}
