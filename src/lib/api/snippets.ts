import type * as ApiTypes from "../api-types";
import { type IdParam, request, toPathSegment } from "../api-client";

export function listUserSnippets(signal?: AbortSignal): Promise<ApiTypes.UserSnippetRead[]> {
  return request<ApiTypes.UserSnippetRead[]>("/stock-analysis/snippets", { signal });
}

export function createUserSnippet(
  input: ApiTypes.UserSnippetCreate,
  signal?: AbortSignal,
): Promise<ApiTypes.UserSnippetRead> {
  return request<ApiTypes.UserSnippetRead>("/stock-analysis/snippets", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getUserSnippet(
  snippetId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.UserSnippetRead> {
  return request<ApiTypes.UserSnippetRead>(`/stock-analysis/snippets/${toPathSegment(snippetId)}`, {
    signal,
  });
}

export function updateUserSnippet(
  snippetId: IdParam,
  input: ApiTypes.UserSnippetUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.UserSnippetRead> {
  return request<ApiTypes.UserSnippetRead>(`/stock-analysis/snippets/${toPathSegment(snippetId)}`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deleteUserSnippet(snippetId: IdParam, signal?: AbortSignal): Promise<void> {
  return request<void>(`/stock-analysis/snippets/${toPathSegment(snippetId)}`, {
    method: "DELETE",
    signal,
  });
}

export const userSnippetsApi = {
  create: createUserSnippet,
  delete: deleteUserSnippet,
  get: getUserSnippet,
  list: listUserSnippets,
  update: updateUserSnippet,
} as const;
