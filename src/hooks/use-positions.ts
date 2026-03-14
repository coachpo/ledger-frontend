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

type IdParam = number | string;

type UpdatePositionVariables = {
  positionId: number;
  data: PositionUpdateInput;
};

export function usePositions(portfolioId: IdParam | undefined) {
  const resolvedPortfolioId = portfolioId ?? "";

  return useQuery({
    queryKey: queryKeys.positions.list(resolvedPortfolioId),
    queryFn: ({ signal }) => listPositions(resolvedPortfolioId, signal),
    enabled: Boolean(portfolioId),
  });
}

export function useCreatePosition(portfolioId: IdParam) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PositionWriteInput) => createPosition(portfolioId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useUpdatePosition(portfolioId: IdParam) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ positionId, data }: UpdatePositionVariables) =>
      updatePosition(portfolioId, positionId, data),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useDeletePosition(portfolioId: IdParam) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (positionId: number) => deletePosition(portfolioId, positionId),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}

export function useCsvPreview(portfolioId: IdParam) {
  return useMutation({
    mutationFn: (file: File) => previewPositionImport(portfolioId, file),
  });
}

export function useCsvCommit(portfolioId: IdParam) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => commitPositionImport(portfolioId, file),
    onSuccess: () => invalidatePortfolioScope(queryClient, portfolioId),
  });
}
