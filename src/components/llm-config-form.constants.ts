import type {
  LlmProvider,
  OpenaiEndpointMode,
  UnknownRecord,
} from "@/lib/api-types";

export const DEFAULT_TEMPERATURE = 0.5;
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TOP_P = 0.9;

export const PROVIDER_LABELS: Record<LlmProvider, string> = {
  anthropic: "Anthropic",
  gemini: "Gemini",
  openai: "OpenAI",
};

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.0-flash",
  openai: "gpt-4o-mini",
};

export const OPENAI_ENDPOINT_LABELS: Record<OpenaiEndpointMode, string> = {
  chat_completions: "Chat Completions",
  responses: "Responses",
};

export function getNumberSetting(
  settings: UnknownRecord | null | undefined,
  key: "maxTokens" | "temperature" | "topP",
  fallback: number,
): number {
  const value = settings?.[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}
