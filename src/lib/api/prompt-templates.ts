import type * as ApiTypes from "../api-types";
import { type IdParam, request, toPathSegment } from "../api-client";

export function listPromptTemplates(signal?: AbortSignal): Promise<ApiTypes.PromptTemplateRead[]> {
  return request<ApiTypes.PromptTemplateRead[]>("/stock-analysis/prompt-templates", { signal });
}

export function createPromptTemplate(
  input: ApiTypes.PromptTemplateWrite,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptTemplateRead> {
  return request<ApiTypes.PromptTemplateRead>("/stock-analysis/prompt-templates", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getPromptTemplate(
  templateId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptTemplateRead> {
  return request<ApiTypes.PromptTemplateRead>(
    `/stock-analysis/prompt-templates/${toPathSegment(templateId)}`,
    { signal },
  );
}

export function updatePromptTemplate(
  templateId: IdParam,
  input: ApiTypes.PromptTemplateUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptTemplateRead> {
  return request<ApiTypes.PromptTemplateRead>(
    `/stock-analysis/prompt-templates/${toPathSegment(templateId)}`,
    {
      body: input,
      method: "PATCH",
      signal,
    },
  );
}

export function deletePromptTemplate(templateId: IdParam, signal?: AbortSignal): Promise<void> {
  return request<void>(`/stock-analysis/prompt-templates/${toPathSegment(templateId)}`, {
    method: "DELETE",
    signal,
  });
}

export function previewPromptTemplate(
  input: ApiTypes.PromptPreviewRequest,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptPreviewResponse> {
  return request<ApiTypes.PromptPreviewResponse>("/stock-analysis/prompt-templates/preview", {
    body: input,
    method: "POST",
    signal,
  });
}

export const promptTemplatesApi = {
  create: createPromptTemplate,
  delete: deletePromptTemplate,
  get: getPromptTemplate,
  list: listPromptTemplates,
  preview: previewPromptTemplate,
  update: updatePromptTemplate,
} as const;
