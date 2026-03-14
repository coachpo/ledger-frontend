import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBalance,
  deleteBalance,
  listBalances,
  updateBalance,
} from "@/lib/api";
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys";
import type { BalanceUpdateInput, BalanceWriteInput } from "@/lib/api-types";

type UpdateBalanceVariables = {
  balanceId: string;
  data: BalanceUpdateInput;
};

export function useBalances(portfolioId: string | undefined) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.balances.list(resolvedPortfolioId),
    queryFn: ({ signal }) => listBalances(resolvedPortfolioId, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useCreateBalance(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BalanceWriteInput) => createBalance(portfolioId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useUpdateBalance(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ balanceId, data }: UpdateBalanceVariables) =>
      updateBalance(portfolioId, balanceId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useDeleteBalance(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (balanceId: string) => deleteBalance(portfolioId, balanceId),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}
