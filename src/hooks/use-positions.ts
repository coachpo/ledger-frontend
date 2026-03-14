import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  commitPositionImport,
  createPosition,
  deletePosition,
  listPositions,
  previewPositionImport,
  updatePosition,
} from "@/lib/api";
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys";
import type { PositionUpdateInput, PositionWriteInput } from "@/lib/api-types";

type UpdatePositionVariables = {
  positionId: string;
  data: PositionUpdateInput;
};

export function usePositions(portfolioId: string | undefined) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.positions.list(resolvedPortfolioId),
    queryFn: ({ signal }) => listPositions(resolvedPortfolioId, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useCreatePosition(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PositionWriteInput) => createPosition(portfolioId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useUpdatePosition(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ positionId, data }: UpdatePositionVariables) =>
      updatePosition(portfolioId, positionId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useDeletePosition(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: string) => deletePosition(portfolioId, positionId),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useCsvPreview(portfolioId: string) {
  return useMutation({
    mutationFn: (file: File) => previewPositionImport(portfolioId, file),
  });
}

export function useCsvCommit(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => commitPositionImport(portfolioId, file),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}
