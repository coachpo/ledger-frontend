import type * as ApiTypes from "../api-types";
import { type IdParam, portfolioPath, request } from "../api-client";

export function listTradingOperations(
  portfolioId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.TradingOperationRead[]> {
  return request<ApiTypes.TradingOperationRead[]>(
    `${portfolioPath(portfolioId)}/trading-operations`,
    { signal },
  );
}

export function createTradingOperation(
  portfolioId: IdParam,
  input: ApiTypes.TradingOperationInput,
  signal?: AbortSignal,
): Promise<ApiTypes.TradingOperationResult> {
  return request<ApiTypes.TradingOperationResult>(`${portfolioPath(portfolioId)}/trading-operations`, {
    body: input,
    method: "POST",
    signal,
  });
}

export const tradingOperationsApi = {
  create: createTradingOperation,
  list: listTradingOperations,
} as const;
