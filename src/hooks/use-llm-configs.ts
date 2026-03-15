import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLlmConfig,
  deleteLlmConfig,
  listLlmConfigs,
  updateLlmConfig,
} from "@/lib/api/llm-configs";
import { queryKeys } from "@/lib/query-keys";
import type { LlmConfigUpdate, LlmConfigWrite } from "@/lib/api-types";

type UpdateLlmConfigVariables = {
  configId: number;
  data: LlmConfigUpdate;
};

export function useLlmConfigs() {
  return useQuery({
    queryKey: queryKeys.llmConfigs.list(),
    queryFn: ({ signal }) => listLlmConfigs(signal),
  });
}

export function useCreateLlmConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LlmConfigWrite) => createLlmConfig(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.lists() }),
  });
}

export function useUpdateLlmConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ configId, data }: UpdateLlmConfigVariables) =>
      updateLlmConfig(configId, data),
    onSuccess: (_, { configId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.detail(configId) }),
      ]),
  });
}

export function useDeleteLlmConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (configId: number) => deleteLlmConfig(configId),
    onSuccess: (_, configId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.llmConfigs.detail(configId) }),
      ]),
  });
}
