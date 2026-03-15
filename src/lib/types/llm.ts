import type { UnknownRecord } from "./common";

export type LlmProvider = "openai" | "anthropic" | "gemini";
export type OpenaiEndpointMode = "chat_completions" | "responses";

export interface LlmConfigRead {
  id: number;
  provider: LlmProvider;
  displayName: string;
  model: string;
  openaiEndpointMode: OpenaiEndpointMode | null;
  baseUrl: string | null;
  hasApiKey: boolean;
  enabled: boolean;
  defaultGenerationSettings: UnknownRecord | null;
  createdAt: string;
  updatedAt: string;
}

export interface LlmConfigWrite {
  provider: LlmProvider;
  displayName: string;
  model: string;
  openaiEndpointMode?: OpenaiEndpointMode | null;
  baseUrl?: string | null;
  apiKeySecret: string;
  enabled?: boolean;
  defaultGenerationSettings?: UnknownRecord | null;
}

export interface LlmConfigUpdate {
  displayName?: string | null;
  model?: string | null;
  openaiEndpointMode?: OpenaiEndpointMode | null;
  baseUrl?: string | null;
  apiKeySecret?: string | null;
  enabled?: boolean | null;
  defaultGenerationSettings?: UnknownRecord | null;
}
