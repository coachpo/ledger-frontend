import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { getErrorMessage } from "@/lib/format"
import { buildPortfolioDashboard } from "@/lib/portfolio-analytics"
import { queryKeys } from "@/lib/query-keys"
import {
  sortBalances,
  sortOperations,
  sortPortfolios,
  sortPositions,
} from "@/lib/workspace"
import type { FeedStatus } from "@/components/portfolios/model"

export function usePortfolioWorkspaceData(portfolioId: string) {
  const portfoliosQuery = useQuery({
    queryKey: queryKeys.portfolios(),
    queryFn: api.listPortfolios,
  })
  const portfolioQuery = useQuery({
    enabled: Boolean(portfolioId),
    queryKey: queryKeys.portfolio(portfolioId),
    queryFn: () => api.getPortfolio(portfolioId),
  })
  const balancesQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.balances(portfolioId),
    queryFn: () => api.listBalances(portfolioId),
  })
  const positionsQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.positions(portfolioId),
    queryFn: () => api.listPositions(portfolioId),
  })
  const operationsQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.trades(portfolioId),
    queryFn: () => api.listTradingOperations(portfolioId),
  })

  const portfolios = React.useMemo(
    () => sortPortfolios(portfoliosQuery.data ?? []),
    [portfoliosQuery.data],
  )
  const balances = React.useMemo(
    () => sortBalances(balancesQuery.data ?? []),
    [balancesQuery.data],
  )
  const positions = React.useMemo(
    () => sortPositions(positionsQuery.data ?? []),
    [positionsQuery.data],
  )
  const operations = React.useMemo(
    () => sortOperations(operationsQuery.data ?? []),
    [operationsQuery.data],
  )
  const symbols = React.useMemo(
    () => positions.map((position) => position.symbol),
    [positions],
  )
  const marketQuery = useQuery({
    enabled: portfolioQuery.isSuccess && symbols.length > 0,
    queryKey: queryKeys.marketData(portfolioId, symbols),
    queryFn: () => api.getMarketQuotes(portfolioId, symbols),
  })

  const quotes = React.useMemo(
    () => marketQuery.data?.quotes ?? [],
    [marketQuery.data?.quotes],
  )
  const warnings = React.useMemo(
    () => marketQuery.data?.warnings ?? [],
    [marketQuery.data?.warnings],
  )
  const quoteMap = React.useMemo(
    () => new Map(quotes.map((quote) => [quote.symbol.toUpperCase(), quote])),
    [quotes],
  )
  const latestQuoteAsOf = React.useMemo(() => {
    const timestamps = quotes
      .map((quote) => quote.asOf)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())

    if (timestamps.length === 0) {
      return null
    }

    return new Date(Math.max(...timestamps)).toISOString()
  }, [quotes])
  const quoteFeedStatus = React.useMemo<FeedStatus>(() => {
    if (symbols.length === 0) {
      return "unavailable"
    }

    if (marketQuery.error || (!marketQuery.isPending && quotes.length === 0)) {
      return "unavailable"
    }

    if (quotes.some((quote) => quote.isStale)) {
      return "stale"
    }

    return "delayed"
  }, [marketQuery.error, marketQuery.isPending, quotes, symbols.length])

  const dashboard = React.useMemo(
    () =>
      buildPortfolioDashboard({
        balances,
        positions,
        quotes,
        operations,
      }),
    [balances, operations, positions, quotes],
  )

  const dataErrors = [
    portfoliosQuery.error,
    portfolioQuery.error,
    balancesQuery.error,
    positionsQuery.error,
    operationsQuery.error,
  ]
    .filter(Boolean)
    .map((error) => getErrorMessage(error))

  return {
    balances,
    balancesQuery,
    dashboard,
    dataErrors,
    latestQuoteAsOf,
    marketQuery,
    operations,
    operationsQuery,
    portfolio: portfolioQuery.data ?? null,
    portfolioQuery,
    portfolios,
    portfoliosQuery,
    positions,
    positionsQuery,
    quoteFeedStatus,
    quoteMap,
    quotes,
    symbols,
    warnings,
  }
}
