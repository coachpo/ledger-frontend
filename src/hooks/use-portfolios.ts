import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPortfolio,
  deletePortfolio,
  getPortfolio,
  listPortfolios,
  updatePortfolio,
} from "@/lib/api";
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys";
import type { PortfolioUpdateInput, PortfolioWriteInput } from "@/lib/api-types";

type UpdatePortfolioVariables = {
  portfolioId: string;
  data: PortfolioUpdateInput;
};

export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios.list(),
    queryFn: ({ signal }) => listPortfolios(signal),
  });
}

export function usePortfolio(portfolioId: string | undefined) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.portfolios.detail(resolvedPortfolioId),
    queryFn: ({ signal }) => getPortfolio(resolvedPortfolioId, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PortfolioWriteInput) => createPortfolio(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.lists() }),
  });
}

export function useUpdatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ portfolioId, data }: UpdatePortfolioVariables) =>
      updatePortfolio(portfolioId, data),
    onSuccess: (_, { portfolioId }) =>
      invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (portfolioId: string) => deletePortfolio(portfolioId),
    onSuccess: async (_, portfolioId) => {
      queryClient.removeQueries({ queryKey: queryKeys.portfolios.detail(portfolioId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios.lists() });
    },
  });
}
