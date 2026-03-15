import type { UnknownRecord } from "./common";
import type { LlmProvider } from "./llm";

export type StockAnalysisRunMode = "single_prompt" | "two_step_workflow";
export type StockAnalysisRunType =
  | "initial_review"
  | "periodic_review"
  | "event_review"
  | "manual_follow_up";
export type StockAnalysisRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial_failure"
  | "failed";
export type StockAnalysisPromptStep =
  | "fresh_analysis"
  | "compare_decide_reflect"
  | "single"
  | "follow_up";
export type StockAnalysisAction =
  | "buy"
  | "add"
  | "hold"
  | "trim"
  | "sell"
  | "avoid"
  | "watch"
  | "no_action";
export type StockAnalysisRequestStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";
export type StockAnalysisPromptSource = "ad_hoc" | "saved_template";
export type StockAnalysisParseStatus =
  | "pending"
  | "parsed_success"
  | "parsed_failure";

export interface StockAnalysisConversationRead {
  id: number;
  portfolioId: number;
  symbol: string;
  title: string | null;
  reviewCadence: string | null;
  nextReviewAt: string | null;
  isArchived: boolean;
  runCount: number;
  versionCount: number;
  latestAction: StockAnalysisAction | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockAnalysisConversationWrite {
  symbol: string;
  title?: string | null;
  reviewCadence?: string | null;
  nextReviewAt?: string | null;
}

export interface StockAnalysisConversationUpdate {
  title?: string | null;
  isArchived?: boolean | null;
  reviewCadence?: string | null;
  nextReviewAt?: string | null;
}

export interface StockAnalysisRunCreate {
  mode?: StockAnalysisRunMode;
  runType: StockAnalysisRunType;
  llmConfigId: number;
  promptTemplateId?: number | null;
  reviewTrigger?: string | null;
  userNote?: string | null;
  compareToOrigin?: boolean | null;
  instructionsText?: string | null;
  inputText?: string | null;
  freshInstructionsOverride?: string | null;
  freshInputOverride?: string | null;
  compareInstructionsOverride?: string | null;
  compareInputOverride?: string | null;
}

export interface StockAnalysisResponseRead {
  id: number;
  requestId: number;
  provider: LlmProvider;
  providerResponseId: string | null;
  outputText: string | null;
  parsedPayload: UnknownRecord | null;
  parseStatus: StockAnalysisParseStatus;
  inputTokens: number | null;
  outputTokens: number | null;
  reasoningTokens: number | null;
  createdAt: string;
}

export interface StockAnalysisRequestRead {
  id: number;
  runId: number;
  step: StockAnalysisPromptStep;
  stepIndex: number;
  status: StockAnalysisRequestStatus;
  promptSource: StockAnalysisPromptSource;
  instructionsSnapshot: string;
  inputSnapshot: string;
  submittedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  response: StockAnalysisResponseRead | null;
}

export interface StockAnalysisRunRead {
  id: number;
  conversationId: number;
  mode: StockAnalysisRunMode;
  runType: StockAnalysisRunType;
  status: StockAnalysisRunStatus;
  provider: LlmProvider;
  model: string;
  providerEndpoint: string | null;
  reviewTrigger: string | null;
  userNote: string | null;
  promptTemplateId: number | null;
  promptTemplateRevision: number | null;
  compareToOrigin: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  requests: StockAnalysisRequestRead[];
}

export interface StockAnalysisResponseSummary {
  id: number;
  requestId: number;
  runId: number;
  conversationId: number;
  symbol: string;
  step: StockAnalysisPromptStep;
  outputTextPreview: string;
  createdAt: string;
}

export interface StockAnalysisVersionRead {
  id: number;
  conversationId: number;
  runId: number;
  versionNumber: number;
  symbol: string;
  action: StockAnalysisAction;
  confidenceScore: number | null;
  freshAnalysis: UnknownRecord;
  comparison: UnknownRecord;
  decision: UnknownRecord;
  reflection: UnknownRecord;
  createdAt: string;
}

export interface PromptPreviewRequest {
  templateId?: number | null;
  step: StockAnalysisPromptStep;
  portfolioId: number;
  symbol: string;
  llmConfigId?: number | null;
  conversationId?: number | null;
  runType?: StockAnalysisRunType | null;
  reviewTrigger?: string | null;
  userNote?: string | null;
  freshAnalysisPayload?: UnknownRecord | null;
  instructionsTemplate?: string | null;
  inputTemplate?: string | null;
}

export interface PromptPreviewReferencedRecord {
  namespace: string;
  identifiers: string[];
}

export interface PromptPreviewResponse {
  renderedInstructions: string;
  renderedInput: string;
  placeholderValues: Record<string, string>;
  referencedRecords: PromptPreviewReferencedRecord[];
  warnings: string[];
  errors: string[];
}

export interface ListStockAnalysisConversationsParams {
  symbol?: string;
  includeArchived?: boolean;
}

export interface ListStockAnalysisResponsesParams {
  conversationId?: number;
  limit?: number;
}

export interface ListStockAnalysisVersionsParams {
  symbol?: string;
}
