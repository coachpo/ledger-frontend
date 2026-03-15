export * from "./api-client";
export * from "./api/balances";
export * from "./api/llm-configs";
export * from "./api/market-data";
export * from "./api/portfolios";
export * from "./api/positions";
export * from "./api/prompt-templates";
export * from "./api/snippets";
export * from "./api/stock-analysis";
export * from "./api/trading-operations";

import { balancesApi } from "./api/balances";
import { llmConfigsApi } from "./api/llm-configs";
import { marketDataApi } from "./api/market-data";
import { portfoliosApi } from "./api/portfolios";
import { positionsApi } from "./api/positions";
import { promptTemplatesApi } from "./api/prompt-templates";
import { userSnippetsApi } from "./api/snippets";
import { stockAnalysisApi } from "./api/stock-analysis";
import { tradingOperationsApi } from "./api/trading-operations";

export const api = {
  balances: balancesApi,
  llmConfigs: llmConfigsApi,
  marketData: marketDataApi,
  portfolios: portfoliosApi,
  positions: positionsApi,
  promptTemplates: promptTemplatesApi,
  stockAnalysis: stockAnalysisApi,
  tradingOperations: tradingOperationsApi,
  userSnippets: userSnippetsApi,
} as const;
