import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromptTemplate,
  deletePromptTemplate,
  listPromptTemplates,
  updatePromptTemplate,
} from "@/lib/api/prompt-templates";
import { queryKeys } from "@/lib/query-keys";
import type { PromptTemplateUpdate, PromptTemplateWrite } from "@/lib/types/prompt";

type UpdatePromptTemplateVariables = {
  templateId: number;
  data: PromptTemplateUpdate;
};

export function usePromptTemplates() {
  return useQuery({
    queryKey: queryKeys.promptTemplates.list(),
    queryFn: ({ signal }) => listPromptTemplates(signal),
  });
}

export function useCreatePromptTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PromptTemplateWrite) => createPromptTemplate(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.promptTemplates.lists() }),
  });
}

export function useUpdatePromptTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, data }: UpdatePromptTemplateVariables) =>
      updatePromptTemplate(templateId, data),
    onSuccess: (_, { templateId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.promptTemplates.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.promptTemplates.detail(templateId) }),
      ]),
  });
}

export function useDeletePromptTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => deletePromptTemplate(templateId),
    onSuccess: (_, templateId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.promptTemplates.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.promptTemplates.detail(templateId) }),
      ]),
  });
}
