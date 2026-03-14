import { useQuery } from "@tanstack/react-query";
import { getMarketHistory, getMarketQuotes } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { GetMarketHistoryParams, GetMarketQuotesParams } from "@/lib/api-types";

export function useMarketQuotes(
  portfolioId: string | undefined,
  symbols: GetMarketQuotesParams["symbols"],
) {
  const resolvedPortfolioId = portfolioId ?? "";
  const hasSymbols = symbols.some((symbol) => symbol.trim().length > 0);

  return useQuery({
    queryKey: queryKeys.marketData.quotes(resolvedPortfolioId, { symbols }),
    queryFn: ({ signal }) => getMarketQuotes(resolvedPortfolioId, { symbols }, signal),
    enabled: Boolean(portfolioId) && hasSymbols,
  });
}

export function useMarketHistory(
  portfolioId: string | undefined,
  symbols: GetMarketHistoryParams["symbols"],
  range?: GetMarketHistoryParams["range"],
) {
  const resolvedPortfolioId = portfolioId ?? "";
  const params: GetMarketHistoryParams = { symbols, range };
  const hasSymbols = symbols.some((symbol) => symbol.trim().length > 0);

  return useQuery({
    queryKey: queryKeys.marketHistory.series(resolvedPortfolioId, params),
    queryFn: ({ signal }) => getMarketHistory(resolvedPortfolioId, params, signal),
    enabled: Boolean(portfolioId) && hasSymbols,
  });
}
