import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createUserSnippet,
  deleteUserSnippet,
  listUserSnippets,
  updateUserSnippet,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { UserSnippetCreate, UserSnippetUpdate } from "@/lib/api-types";

type UpdateSnippetVariables = {
  snippetId: string;
  data: UserSnippetUpdate;
};

export function useSnippets() {
  return useQuery({
    queryKey: queryKeys.snippets.list(),
    queryFn: ({ signal }) => listUserSnippets(signal),
  });
}

export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserSnippetCreate) => createUserSnippet(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.snippets.lists() }),
  });
}

export function useUpdateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ snippetId, data }: UpdateSnippetVariables) =>
      updateUserSnippet(snippetId, data),
    onSuccess: (_, { snippetId }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.snippets.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.snippets.detail(snippetId) }),
      ]),
  });
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (snippetId: string) => deleteUserSnippet(snippetId),
    onSuccess: (_, snippetId) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.snippets.lists() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.snippets.detail(snippetId) }),
      ]),
  });
}
