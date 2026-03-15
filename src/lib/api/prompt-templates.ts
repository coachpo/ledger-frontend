import type { PromptTemplateRead, PromptTemplateWrite, PromptTemplateUpdate } from "../types/prompt";
import type { PromptPreviewRequest, PromptPreviewResponse } from "../types/stock-analysis";
import { type IdParam, request, toPathSegment } from "../api-client";

export function listPromptTemplates(signal?: AbortSignal): Promise<PromptTemplateRead[]> {
  return request<PromptTemplateRead[]>("/stock-analysis/prompt-templates", { signal });
}

export function createPromptTemplate(
  input: PromptTemplateWrite,
  signal?: AbortSignal,
): Promise<PromptTemplateRead> {
  return request<PromptTemplateRead>("/stock-analysis/prompt-templates", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getPromptTemplate(
  templateId: IdParam,
  signal?: AbortSignal,
): Promise<PromptTemplateRead> {
  return request<PromptTemplateRead>(
    `/stock-analysis/prompt-templates/${toPathSegment(templateId)}`,
    { signal },
  );
}

export function updatePromptTemplate(
  templateId: IdParam,
  input: PromptTemplateUpdate,
  signal?: AbortSignal,
): Promise<PromptTemplateRead> {
  return request<PromptTemplateRead>(
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
  input: PromptPreviewRequest,
  signal?: AbortSignal,
): Promise<PromptPreviewResponse> {
  return request<PromptPreviewResponse>("/stock-analysis/prompt-templates/preview", {
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
