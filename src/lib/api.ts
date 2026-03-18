export * from "./api-client";
export * from "./api/balances";
export * from "./api/market-data";
export * from "./api/portfolios";
export * from "./api/positions";
export * from "./api/reports";
export * from "./api/templates";
export * from "./api/trading-operations";

import { balancesApi } from "./api/balances";
import { marketDataApi } from "./api/market-data";
import { portfoliosApi } from "./api/portfolios";
import { positionsApi } from "./api/positions";
import { reportsApi } from "./api/reports";
import { templatesApi } from "./api/templates";
import { tradingOperationsApi } from "./api/trading-operations";

export const api = {
  balances: balancesApi,
  marketData: marketDataApi,
  portfolios: portfoliosApi,
  positions: positionsApi,
  reports: reportsApi,
  templates: templatesApi,
  tradingOperations: tradingOperationsApi,
} as const;
