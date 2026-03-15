import type { QueryClient } from "@tanstack/react-query";
import type { ListStockAnalysisConversationsParams, ListStockAnalysisResponsesParams, ListStockAnalysisVersionsParams, PromptPreviewRequest } from "./types/stock-analysis";
import type { GetMarketHistoryParams, GetMarketQuotesParams } from "./types/market-data";

const apiRoot = ["api"] as const;
type IdParam = number | string;

function normalizeId(id: IdParam) {
  return String(id);
}

function portfolioRoot(portfolioId: IdParam) {
  return [...apiRoot, "portfolios", normalizeId(portfolioId)] as const;
}

function stockAnalysisRoot(portfolioId: IdParam) {
  return [...portfolioRoot(portfolioId), "stockAnalysis"] as const;
}

function normalizeSymbols(symbols: readonly string[]) {
  return [...new Set(symbols.map((symbol) => symbol.trim()).filter(Boolean))].sort();
}

function normalizeConversationParams(
  params: ListStockAnalysisConversationsParams = {},
) {
  return {
    includeArchived: params.includeArchived ?? false,
    symbol: params.symbol ?? null,
  };
}

function normalizeResponseParams(params: ListStockAnalysisResponsesParams = {}) {
  return {
    conversationId:
      params.conversationId === undefined || params.conversationId === null
        ? null
        : String(params.conversationId),
    limit: params.limit ?? 20,
  };
}

function normalizeVersionParams(params: ListStockAnalysisVersionsParams = {}) {
  return {
    symbol: params.symbol ?? null,
  };
}

function normalizeHistoryParams(params: GetMarketHistoryParams) {
  return {
    range: params.range ?? "3mo",
    symbols: normalizeSymbols(params.symbols),
  };
}

const portfoliosQueryKeys = {
  all: [...apiRoot, "portfolios"] as const,
  detail: (portfolioId: IdParam) =>
    [...apiRoot, "portfolios", "detail", normalizeId(portfolioId)] as const,
  details: () => [...apiRoot, "portfolios", "detail"] as const,
  list: () => [...apiRoot, "portfolios", "list"] as const,
  lists: () => [...apiRoot, "portfolios", "list"] as const,
} as const;

const balancesQueryKeys = {
  all: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "balances"] as const,
  detail: (portfolioId: IdParam, balanceId: IdParam) =>
    [...portfolioRoot(portfolioId), "balances", "detail", normalizeId(balanceId)] as const,
  list: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "balances", "list"] as const,
} as const;

const positionsQueryKeys = {
  all: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "positions"] as const,
  detail: (portfolioId: IdParam, positionId: IdParam) =>
    [...portfolioRoot(portfolioId), "positions", "detail", normalizeId(positionId)] as const,
  list: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "positions", "list"] as const,
} as const;

const tradesQueryKeys = {
  all: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "trades"] as const,
  detail: (portfolioId: IdParam, tradeId: IdParam) =>
    [...portfolioRoot(portfolioId), "trades", "detail", normalizeId(tradeId)] as const,
  list: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "trades", "list"] as const,
} as const;

const marketDataQueryKeys = {
  all: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "marketData"] as const,
  quotes: (portfolioId: IdParam, params: GetMarketQuotesParams) =>
    [...portfolioRoot(portfolioId), "marketData", "quotes", normalizeSymbols(params.symbols)] as const,
} as const;

const marketHistoryQueryKeys = {
  all: (portfolioId: IdParam) => [...portfolioRoot(portfolioId), "marketHistory"] as const,
  series: (portfolioId: IdParam, params: GetMarketHistoryParams) =>
    [...portfolioRoot(portfolioId), "marketHistory", "series", normalizeHistoryParams(params)] as const,
} as const;

const llmConfigsQueryKeys = {
  all: [...apiRoot, "llmConfigs"] as const,
  detail: (configId: IdParam) =>
    [...apiRoot, "llmConfigs", "detail", normalizeId(configId)] as const,
  details: () => [...apiRoot, "llmConfigs", "detail"] as const,
  list: () => [...apiRoot, "llmConfigs", "list"] as const,
  lists: () => [...apiRoot, "llmConfigs", "list"] as const,
} as const;

const promptTemplatesQueryKeys = {
  all: [...apiRoot, "promptTemplates"] as const,
  detail: (templateId: IdParam) =>
    [...apiRoot, "promptTemplates", "detail", normalizeId(templateId)] as const,
  details: () => [...apiRoot, "promptTemplates", "detail"] as const,
  list: () => [...apiRoot, "promptTemplates", "list"] as const,
  lists: () => [...apiRoot, "promptTemplates", "list"] as const,
  preview: (request: PromptPreviewRequest) =>
    [...apiRoot, "promptTemplates", "preview", request] as const,
} as const;

const snippetsQueryKeys = {
  all: [...apiRoot, "snippets"] as const,
  detail: (snippetId: IdParam) =>
    [...apiRoot, "snippets", "detail", normalizeId(snippetId)] as const,
  details: () => [...apiRoot, "snippets", "detail"] as const,
  list: () => [...apiRoot, "snippets", "list"] as const,
  lists: () => [...apiRoot, "snippets", "list"] as const,
} as const;

const stockAnalysisQueryKeys = {
  all: (portfolioId: IdParam) => [...stockAnalysisRoot(portfolioId)] as const,
  promptPreview: (portfolioId: IdParam, request?: PromptPreviewRequest) =>
    [...stockAnalysisRoot(portfolioId), "promptPreview", request ?? null] as const,
  settings: (portfolioId: IdParam) => [...stockAnalysisRoot(portfolioId), "settings"] as const,
  conversations: {
    all: (portfolioId: IdParam) => [...stockAnalysisRoot(portfolioId), "conversations"] as const,
    detail: (portfolioId: IdParam, conversationId: IdParam) =>
      [
        ...stockAnalysisRoot(portfolioId),
        "conversations",
        "detail",
        normalizeId(conversationId),
      ] as const,
    list: (
      portfolioId: IdParam,
      params: ListStockAnalysisConversationsParams = {},
    ) =>
      [
        ...stockAnalysisRoot(portfolioId),
        "conversations",
        "list",
        normalizeConversationParams(params),
      ] as const,
  },
  responses: {
    all: (portfolioId: IdParam) => [...stockAnalysisRoot(portfolioId), "responses"] as const,
    list: (
      portfolioId: IdParam,
      params: ListStockAnalysisResponsesParams = {},
    ) =>
      [...stockAnalysisRoot(portfolioId), "responses", "list", normalizeResponseParams(params)] as const,
  },
  runs: {
    all: (portfolioId: IdParam) => [...stockAnalysisRoot(portfolioId), "runs"] as const,
    detail: (portfolioId: IdParam, runId: IdParam) =>
      [...stockAnalysisRoot(portfolioId), "runs", "detail", normalizeId(runId)] as const,
    list: (portfolioId: IdParam, conversationId: IdParam) =>
      [...stockAnalysisRoot(portfolioId), "runs", "list", normalizeId(conversationId)] as const,
  },
  versions: {
    all: (portfolioId: IdParam) => [...stockAnalysisRoot(portfolioId), "versions"] as const,
    detail: (portfolioId: IdParam, versionId: IdParam) =>
      [
        ...stockAnalysisRoot(portfolioId),
        "versions",
        "detail",
        normalizeId(versionId),
      ] as const,
    list: (
      portfolioId: IdParam,
      params: ListStockAnalysisVersionsParams = {},
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
  portfolioId: IdParam,
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
