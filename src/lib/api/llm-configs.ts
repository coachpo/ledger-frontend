import type { LlmConfigRead, LlmConfigWrite, LlmConfigUpdate } from "../types/llm";
import { type IdParam, request, toPathSegment } from "../api-client";

export function listLlmConfigs(signal?: AbortSignal): Promise<LlmConfigRead[]> {
  return request<LlmConfigRead[]>("/stock-analysis/llm-configs", { signal });
}

export function createLlmConfig(
  input: LlmConfigWrite,
  signal?: AbortSignal,
): Promise<LlmConfigRead> {
  return request<LlmConfigRead>("/stock-analysis/llm-configs", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getLlmConfig(
  configId: IdParam,
  signal?: AbortSignal,
): Promise<LlmConfigRead> {
  return request<LlmConfigRead>(`/stock-analysis/llm-configs/${toPathSegment(configId)}`, {
    signal,
  });
}

export function updateLlmConfig(
  configId: IdParam,
  input: LlmConfigUpdate,
  signal?: AbortSignal,
): Promise<LlmConfigRead> {
  return request<LlmConfigRead>(`/stock-analysis/llm-configs/${toPathSegment(configId)}`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deleteLlmConfig(configId: IdParam, signal?: AbortSignal): Promise<void> {
  return request<void>(`/stock-analysis/llm-configs/${toPathSegment(configId)}`, {
    method: "DELETE",
    signal,
  });
}

export const llmConfigsApi = {
  create: createLlmConfig,
  delete: deleteLlmConfig,
  get: getLlmConfig,
  list: listLlmConfigs,
  update: updateLlmConfig,
} as const;
