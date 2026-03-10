import type { QueryClient } from "@tanstack/react-query"

export const queryKeys = {
  portfolios: () => ["portfolios"] as const,
  portfolio: (portfolioId: string) => ["portfolios", portfolioId] as const,
  balances: (portfolioId: string) => ["portfolios", portfolioId, "balances"] as const,
  positions: (portfolioId: string) => ["portfolios", portfolioId, "positions"] as const,
  trades: (portfolioId: string) =>
    ["portfolios", portfolioId, "trading-operations"] as const,
  marketDataBase: (portfolioId: string) =>
    ["portfolios", portfolioId, "market-data"] as const,
  marketData: (portfolioId: string, symbols: string[]) =>
    ["portfolios", portfolioId, "market-data", symbols.join(",")] as const,
}

export async function invalidatePortfolioScope(
  queryClient: QueryClient,
  portfolioId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.portfolio(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.balances(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.positions(portfolioId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.trades(portfolioId) }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.marketDataBase(portfolioId),
    }),
  ])
}
