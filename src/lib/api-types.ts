export interface ApiErrorDetail {
  field: string;
  issue: string;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details: ApiErrorDetail[];
}

export type UnknownRecord = Record<string, unknown>;

export type TradingSide = "BUY" | "SELL" | "DIVIDEND" | "SPLIT";
export type MarketHistoryRange = "1mo" | "3mo" | "ytd" | "1y" | "max";
export type CsvImportMode = "upsert";
export type LlmProvider = "openai" | "anthropic" | "gemini";
export type OpenaiEndpointMode = "chat_completions" | "responses";
export type PromptTemplateMode = "single" | "two_step";
export type PromptTemplateStatus = "active" | "archived";
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

export interface PortfolioRead {
  id: number;
  name: string;
  description: string | null;
  baseCurrency: string;
  positionCount: number;
  balanceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioWriteInput {
  name: string;
  description?: string | null;
  baseCurrency: string;
}

export interface PortfolioUpdateInput {
  name?: string;
  description?: string | null;
}

export interface BalanceRead {
  id: number;
  portfolioId: number;
  label: string;
  amount: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BalanceWriteInput {
  label: string;
  amount: string;
}

export interface BalanceUpdateInput {
  label?: string;
  amount?: string;
}

export interface PositionRead {
  id: number;
  portfolioId: number;
  symbol: string;
  name: string | null;
  quantity: string;
  averageCost: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PositionWriteInput {
  symbol: string;
  name?: string | null;
  quantity: string;
  averageCost: string;
}

export interface PositionUpdateInput {
  name?: string | null;
  quantity?: string;
  averageCost?: string;
}

export interface CsvAcceptedRow {
  row: number;
  symbol: string;
  quantity: string;
  averageCost: string;
  name: string | null;
}

export interface CsvRowError {
  row: number;
  field: string;
  issue: string;
}

export interface CsvPreviewRead {
  fileName: string;
  mode: CsvImportMode;
  acceptedRows: CsvAcceptedRow[];
  errors: CsvRowError[];
}

export interface CsvCommitRead {
  fileName: string;
  mode: CsvImportMode;
  inserted: number;
  updated: number;
  unchanged: number;
  errors: CsvRowError[];
}

export interface TradingOperationBase {
  balanceId: number;
  symbol: string;
  executedAt: string;
}

export interface BuyOperationInput extends TradingOperationBase {
  side: "BUY";
  quantity: string;
  price: string;
  commission?: string;
}

export interface SellOperationInput extends TradingOperationBase {
  side: "SELL";
  quantity: string;
  price: string;
  commission?: string;
}

export interface DividendOperationInput extends TradingOperationBase {
  side: "DIVIDEND";
  dividendAmount: string;
  commission?: string;
}

export interface SplitOperationInput extends TradingOperationBase {
  side: "SPLIT";
  splitRatio: string;
}

export type TradingOperationInput =
  | BuyOperationInput
  | SellOperationInput
  | DividendOperationInput
  | SplitOperationInput;

export interface TradingOperationRead {
  id: number;
  portfolioId: number;
  balanceId: number | null;
  balanceLabel: string;
  symbol: string;
  side: TradingSide;
  quantity: string | null;
  price: string | null;
  commission: string;
  dividendAmount: string | null;
  splitRatio: string | null;
  currency: string;
  executedAt: string;
  createdAt: string;
}

export interface PositionCompactRead {
  symbol: string;
  quantity: string;
  averageCost: string;
  currency: string;
}

export interface BalanceCompactRead {
  id: number;
  label: string;
  amount: string;
  currency: string;
}

export interface TradingOperationResult {
  operation: TradingOperationRead;
  updatedPosition: PositionCompactRead | null;
  updatedBalance: BalanceCompactRead;
}

export interface MarketQuoteRead {
  symbol: string;
  price: string;
  currency: string;
  provider: string;
  asOf: string | null;
  isStale: boolean;
  previousClose: string | null;
}

export interface MarketQuoteListRead {
  quotes: MarketQuoteRead[];
  warnings: string[];
}

export interface MarketHistoryPointRead {
  at: string;
  close: string;
}

export interface MarketHistorySeriesRead {
  symbol: string;
  currency: string | null;
  provider: string;
  points: MarketHistoryPointRead[];
}

export interface MarketHistoryRead {
  range: MarketHistoryRange;
  interval: string;
  series: MarketHistorySeriesRead[];
  warnings: string[];
}

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

export interface PromptTemplateRead {
  id: number;
  name: string;
  description: string | null;
  revision: number;
  status: PromptTemplateStatus;
  templateMode: PromptTemplateMode;
  instructionsTemplate: string | null;
  inputTemplate: string | null;
  freshInstructionsTemplate: string;
  freshInputTemplate: string;
  compareInstructionsTemplate: string;
  compareInputTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateWrite {
  name: string;
  description?: string | null;
  templateMode?: PromptTemplateMode;
  instructionsTemplate?: string | null;
  inputTemplate?: string | null;
  freshInstructionsTemplate?: string | null;
  freshInputTemplate?: string | null;
  compareInstructionsTemplate?: string | null;
  compareInputTemplate?: string | null;
}

export interface PromptTemplateUpdate {
  name?: string | null;
  description?: string | null;
  templateMode?: PromptTemplateMode | null;
  instructionsTemplate?: string | null;
  inputTemplate?: string | null;
  freshInstructionsTemplate?: string | null;
  freshInputTemplate?: string | null;
  compareInstructionsTemplate?: string | null;
  compareInputTemplate?: string | null;
  status?: PromptTemplateStatus | null;
}

export interface UserSnippetRead {
  id: number;
  snippetId: string;
  content: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSnippetCreate {
  snippetId: string;
  content: string;
  description?: string | null;
}

export interface UserSnippetUpdate {
  content?: string | null;
  description?: string | null;
}

export interface PortfolioStockAnalysisSettingsRead {
  id: number;
  portfolioId: number;
  enabled: boolean;
  defaultPromptTemplateId: number | null;
  defaultLlmConfigId: number | null;
  compareToOrigin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioStockAnalysisSettingsUpdate {
  enabled?: boolean | null;
  defaultPromptTemplateId?: number | null;
  defaultLlmConfigId?: number | null;
  compareToOrigin?: boolean | null;
}

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

export interface GetMarketQuotesParams {
  symbols: string[];
}

export interface GetMarketHistoryParams {
  symbols: string[];
  range?: MarketHistoryRange;
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
