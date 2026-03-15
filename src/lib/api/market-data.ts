import type * as ApiTypes from "../api-types";
import { type IdParam, portfolioPath, request, serializeSymbols } from "../api-client";

export function getMarketQuotes(
  portfolioId: IdParam,
  params: ApiTypes.GetMarketQuotesParams,
  signal?: AbortSignal,
): Promise<ApiTypes.MarketQuoteListRead> {
  return request<ApiTypes.MarketQuoteListRead>(`${portfolioPath(portfolioId)}/market-data/quotes`, {
    query: { symbols: serializeSymbols(params.symbols) },
    signal,
  });
}

export function getMarketHistory(
  portfolioId: IdParam,
  params: ApiTypes.GetMarketHistoryParams,
  signal?: AbortSignal,
): Promise<ApiTypes.MarketHistoryRead> {
  return request<ApiTypes.MarketHistoryRead>(`${portfolioPath(portfolioId)}/market-data/history`, {
    query: {
      range: params.range ?? "3mo",
      symbols: serializeSymbols(params.symbols),
    },
    signal,
  });
}

export const marketDataApi = {
  history: getMarketHistory,
  quotes: getMarketQuotes,
} as const;
