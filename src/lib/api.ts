import type * as ApiTypes from "./api-types";

type RequestMethod = "DELETE" | "GET" | "PATCH" | "POST";
type RequestQueryValue = boolean | number | string | null | undefined;

interface RequestOptions {
  body?: FormData | object | null;
  headers?: HeadersInit;
  method?: RequestMethod;
  query?: Record<string, RequestQueryValue>;
  signal?: AbortSignal;
}

interface ApiRequestErrorOptions {
  code: string;
  details?: ApiTypes.ApiErrorDetail[];
  message: string;
  status: number;
}

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export class ApiRequestError extends Error {
  readonly code: string;
  readonly details: ApiTypes.ApiErrorDetail[];
  readonly status: number;

  constructor({ status, code, message, details = [] }: ApiRequestErrorOptions) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function normalizeApiBaseUrl(value: string | undefined): string {
  const normalized = value?.trim();

  if (!normalized) {
    return DEFAULT_API_BASE_URL;
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function toPathSegment(value: string): string {
  return encodeURIComponent(value);
}

function buildQueryString(query?: Record<string, RequestQueryValue>): string {
  if (!query) {
    return "";
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams.toString();
}

function buildUrl(path: string, query?: Record<string, RequestQueryValue>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = buildQueryString(query);

  if (!queryString) {
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return `${API_BASE_URL}${normalizedPath}?${queryString}`;
}

function isApiErrorDetail(value: unknown): value is ApiTypes.ApiErrorDetail {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    typeof Reflect.get(value, "field") === "string" &&
    typeof Reflect.get(value, "issue") === "string"
  );
}

async function toApiRequestError(response: Response): Promise<ApiRequestError> {
  const defaultMessage = `Request failed with status ${response.status}`;
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as
      | (Partial<ApiTypes.ApiErrorResponse> & { detail?: unknown })
      | null;

    return new ApiRequestError({
      status: response.status,
      code: typeof payload?.code === "string" ? payload.code : "request_failed",
      message:
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.detail === "string"
            ? payload.detail
            : defaultMessage,
      details: Array.isArray(payload?.details)
        ? payload.details.filter(isApiErrorDetail)
        : [],
    });
  }

  const text = await response.text();

  return new ApiRequestError({
    status: response.status,
    code: "request_failed",
    message: text || defaultMessage,
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";
  let body: BodyInit | undefined;

  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined && options.body !== null) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(options.body);
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(buildUrl(path, options.query), {
    body,
    headers,
    method,
    signal: options.signal,
  });

  if (!response.ok) {
    throw await toApiRequestError(response);
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

function createCsvFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file, file.name);
  return formData;
}

function serializeSymbols(symbols: readonly string[]): string {
  return symbols
    .map((symbol) => symbol.trim())
    .filter((symbol) => symbol.length > 0)
    .join(",");
}

function portfolioPath(portfolioId: string): string {
  return `/portfolios/${toPathSegment(portfolioId)}`;
}

function stockAnalysisPath(portfolioId: string): string {
  return `${portfolioPath(portfolioId)}/stock-analysis`;
}

export function listPortfolios(signal?: AbortSignal): Promise<ApiTypes.PortfolioRead[]> {
  return request<ApiTypes.PortfolioRead[]>("/portfolios", { signal });
}

export function createPortfolio(
  input: ApiTypes.PortfolioWriteInput,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioRead> {
  return request<ApiTypes.PortfolioRead>("/portfolios", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getPortfolio(
  portfolioId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioRead> {
  return request<ApiTypes.PortfolioRead>(portfolioPath(portfolioId), { signal });
}

export function updatePortfolio(
  portfolioId: string,
  input: ApiTypes.PortfolioUpdateInput,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioRead> {
  return request<ApiTypes.PortfolioRead>(portfolioPath(portfolioId), {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deletePortfolio(portfolioId: string, signal?: AbortSignal): Promise<void> {
  return request<void>(portfolioPath(portfolioId), {
    method: "DELETE",
    signal,
  });
}

export function listBalances(
  portfolioId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.BalanceRead[]> {
  return request<ApiTypes.BalanceRead[]>(`${portfolioPath(portfolioId)}/balances`, {
    signal,
  });
}

export function createBalance(
  portfolioId: string,
  input: ApiTypes.BalanceWriteInput,
  signal?: AbortSignal,
): Promise<ApiTypes.BalanceRead> {
  return request<ApiTypes.BalanceRead>(`${portfolioPath(portfolioId)}/balances`, {
    body: input,
    method: "POST",
    signal,
  });
}

export function updateBalance(
  portfolioId: string,
  balanceId: string,
  input: ApiTypes.BalanceUpdateInput,
  signal?: AbortSignal,
): Promise<ApiTypes.BalanceRead> {
  return request<ApiTypes.BalanceRead>(
    `${portfolioPath(portfolioId)}/balances/${toPathSegment(balanceId)}`,
    {
      body: input,
      method: "PATCH",
      signal,
    },
  );
}

export function deleteBalance(
  portfolioId: string,
  balanceId: string,
  signal?: AbortSignal,
): Promise<void> {
  return request<void>(`${portfolioPath(portfolioId)}/balances/${toPathSegment(balanceId)}`, {
    method: "DELETE",
    signal,
  });
}

export function listPositions(
  portfolioId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.PositionRead[]> {
  return request<ApiTypes.PositionRead[]>(`${portfolioPath(portfolioId)}/positions`, {
    signal,
  });
}

export function createPosition(
  portfolioId: string,
  input: ApiTypes.PositionWriteInput,
  signal?: AbortSignal,
): Promise<ApiTypes.PositionRead> {
  return request<ApiTypes.PositionRead>(`${portfolioPath(portfolioId)}/positions`, {
    body: input,
    method: "POST",
    signal,
  });
}

export function updatePosition(
  portfolioId: string,
  positionId: string,
  input: ApiTypes.PositionUpdateInput,
  signal?: AbortSignal,
): Promise<ApiTypes.PositionRead> {
  return request<ApiTypes.PositionRead>(
    `${portfolioPath(portfolioId)}/positions/${toPathSegment(positionId)}`,
    {
      body: input,
      method: "PATCH",
      signal,
    },
  );
}

export function deletePosition(
  portfolioId: string,
  positionId: string,
  signal?: AbortSignal,
): Promise<void> {
  return request<void>(`${portfolioPath(portfolioId)}/positions/${toPathSegment(positionId)}`, {
    method: "DELETE",
    signal,
  });
}

export function previewPositionImport(
  portfolioId: string,
  file: File,
  signal?: AbortSignal,
): Promise<ApiTypes.CsvPreviewRead> {
  return request<ApiTypes.CsvPreviewRead>(`${portfolioPath(portfolioId)}/positions/imports/preview`, {
    body: createCsvFormData(file),
    method: "POST",
    signal,
  });
}

export function commitPositionImport(
  portfolioId: string,
  file: File,
  signal?: AbortSignal,
): Promise<ApiTypes.CsvCommitRead> {
  return request<ApiTypes.CsvCommitRead>(`${portfolioPath(portfolioId)}/positions/imports/commit`, {
    body: createCsvFormData(file),
    method: "POST",
    signal,
  });
}

export function listTradingOperations(
  portfolioId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.TradingOperationRead[]> {
  return request<ApiTypes.TradingOperationRead[]>(
    `${portfolioPath(portfolioId)}/trading-operations`,
    { signal },
  );
}

export function createTradingOperation(
  portfolioId: string,
  input: ApiTypes.TradingOperationInput,
  signal?: AbortSignal,
): Promise<ApiTypes.TradingOperationResult> {
  return request<ApiTypes.TradingOperationResult>(`${portfolioPath(portfolioId)}/trading-operations`, {
    body: input,
    method: "POST",
    signal,
  });
}

export function getMarketQuotes(
  portfolioId: string,
  params: ApiTypes.GetMarketQuotesParams,
  signal?: AbortSignal,
): Promise<ApiTypes.MarketQuoteListRead> {
  return request<ApiTypes.MarketQuoteListRead>(`${portfolioPath(portfolioId)}/market-data/quotes`, {
    query: { symbols: serializeSymbols(params.symbols) },
    signal,
  });
}

export function getMarketHistory(
  portfolioId: string,
  params: ApiTypes.GetMarketHistoryParams,
  signal?: AbortSignal,
): Promise<ApiTypes.MarketHistoryRead> {
  return request<ApiTypes.MarketHistoryRead>(`${portfolioPath(portfolioId)}/market-data/history`, {
    query: {
      range: params.range ?? "3mo",
      symbols: serializeSymbols(params.symbols),
    },
    signal,
  });
}

export function listLlmConfigs(signal?: AbortSignal): Promise<ApiTypes.LlmConfigRead[]> {
  return request<ApiTypes.LlmConfigRead[]>("/stock-analysis/llm-configs", { signal });
}

export function createLlmConfig(
  input: ApiTypes.LlmConfigWrite,
  signal?: AbortSignal,
): Promise<ApiTypes.LlmConfigRead> {
  return request<ApiTypes.LlmConfigRead>("/stock-analysis/llm-configs", {
    body: input,
    method: "POST",
    signal,
  });
}

export function getLlmConfig(
  configId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.LlmConfigRead> {
  return request<ApiTypes.LlmConfigRead>(`/stock-analysis/llm-configs/${toPathSegment(configId)}`, {
    signal,
  });
}

export function updateLlmConfig(
  configId: string,
  input: ApiTypes.LlmConfigUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.LlmConfigRead> {
  return request<ApiTypes.LlmConfigRead>(`/stock-analysis/llm-configs/${toPathSegment(configId)}`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deleteLlmConfig(configId: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/stock-analysis/llm-configs/${toPathSegment(configId)}`, {
    method: "DELETE",
    signal,
  });
}

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
  templateId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptTemplateRead> {
  return request<ApiTypes.PromptTemplateRead>(
    `/stock-analysis/prompt-templates/${toPathSegment(templateId)}`,
    { signal },
  );
}

export function updatePromptTemplate(
  templateId: string,
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

export function deletePromptTemplate(templateId: string, signal?: AbortSignal): Promise<void> {
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
  snippetId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.UserSnippetRead> {
  return request<ApiTypes.UserSnippetRead>(`/stock-analysis/snippets/${toPathSegment(snippetId)}`, {
    signal,
  });
}

export function updateUserSnippet(
  snippetId: string,
  input: ApiTypes.UserSnippetUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.UserSnippetRead> {
  return request<ApiTypes.UserSnippetRead>(`/stock-analysis/snippets/${toPathSegment(snippetId)}`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deleteUserSnippet(snippetId: string, signal?: AbortSignal): Promise<void> {
  return request<void>(`/stock-analysis/snippets/${toPathSegment(snippetId)}`, {
    method: "DELETE",
    signal,
  });
}

export function getPortfolioStockAnalysisSettings(
  portfolioId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioStockAnalysisSettingsRead> {
  return request<ApiTypes.PortfolioStockAnalysisSettingsRead>(`${stockAnalysisPath(portfolioId)}/settings`, {
    signal,
  });
}

export function updatePortfolioStockAnalysisSettings(
  portfolioId: string,
  input: ApiTypes.PortfolioStockAnalysisSettingsUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioStockAnalysisSettingsRead> {
  return request<ApiTypes.PortfolioStockAnalysisSettingsRead>(`${stockAnalysisPath(portfolioId)}/settings`, {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function listStockAnalysisConversations(
  portfolioId: string,
  params: ApiTypes.ListStockAnalysisConversationsParams = {},
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead[]> {
  return request<ApiTypes.StockAnalysisConversationRead[]>(`${stockAnalysisPath(portfolioId)}/conversations`, {
    query: {
      include_archived: params.includeArchived,
      symbol: params.symbol,
    },
    signal,
  });
}

export function createStockAnalysisConversation(
  portfolioId: string,
  input: ApiTypes.StockAnalysisConversationWrite,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead> {
  return request<ApiTypes.StockAnalysisConversationRead>(`${stockAnalysisPath(portfolioId)}/conversations`, {
    body: input,
    method: "POST",
    signal,
  });
}

export function getStockAnalysisConversation(
  portfolioId: string,
  conversationId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead> {
  return request<ApiTypes.StockAnalysisConversationRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}`,
    { signal },
  );
}

export function updateStockAnalysisConversation(
  portfolioId: string,
  conversationId: string,
  input: ApiTypes.StockAnalysisConversationUpdate,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisConversationRead> {
  return request<ApiTypes.StockAnalysisConversationRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}`,
    {
      body: input,
      method: "PATCH",
      signal,
    },
  );
}

export function listStockAnalysisRuns(
  portfolioId: string,
  conversationId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisRunRead[]> {
  return request<ApiTypes.StockAnalysisRunRead[]>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}/runs`,
    { signal },
  );
}

export function createStockAnalysisRun(
  portfolioId: string,
  conversationId: string,
  input: ApiTypes.StockAnalysisRunCreate,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisRunRead> {
  return request<ApiTypes.StockAnalysisRunRead>(
    `${stockAnalysisPath(portfolioId)}/conversations/${toPathSegment(conversationId)}/runs`,
    {
      body: input,
      method: "POST",
      signal,
    },
  );
}

export function getStockAnalysisRun(
  portfolioId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisRunRead> {
  return request<ApiTypes.StockAnalysisRunRead>(`${stockAnalysisPath(portfolioId)}/runs/${toPathSegment(runId)}`, {
    signal,
  });
}

export function executeStockAnalysisRun(
  portfolioId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisRunRead> {
  return request<ApiTypes.StockAnalysisRunRead>(`${stockAnalysisPath(portfolioId)}/runs/${toPathSegment(runId)}/execute`, {
    method: "POST",
    signal,
  });
}

export function listStockAnalysisResponses(
  portfolioId: string,
  params: ApiTypes.ListStockAnalysisResponsesParams = {},
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisResponseSummary[]> {
  return request<ApiTypes.StockAnalysisResponseSummary[]>(`${stockAnalysisPath(portfolioId)}/responses`, {
    query: {
      conversation_id: params.conversationId,
      limit: params.limit,
    },
    signal,
  });
}

export function listStockAnalysisVersions(
  portfolioId: string,
  params: ApiTypes.ListStockAnalysisVersionsParams = {},
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisVersionRead[]> {
  return request<ApiTypes.StockAnalysisVersionRead[]>(`${stockAnalysisPath(portfolioId)}/versions`, {
    query: { symbol: params.symbol },
    signal,
  });
}

export function getStockAnalysisVersion(
  portfolioId: string,
  versionId: string,
  signal?: AbortSignal,
): Promise<ApiTypes.StockAnalysisVersionRead> {
  return request<ApiTypes.StockAnalysisVersionRead>(
    `${stockAnalysisPath(portfolioId)}/versions/${toPathSegment(versionId)}`,
    { signal },
  );
}

export function previewStockAnalysisPrompt(
  portfolioId: string,
  input: ApiTypes.PromptPreviewRequest,
  signal?: AbortSignal,
): Promise<ApiTypes.PromptPreviewResponse> {
  return request<ApiTypes.PromptPreviewResponse>(`${stockAnalysisPath(portfolioId)}/prompt-preview`, {
    body: input,
    method: "POST",
    signal,
  });
}

export const portfoliosApi = {
  create: createPortfolio,
  delete: deletePortfolio,
  get: getPortfolio,
  list: listPortfolios,
  update: updatePortfolio,
} as const;

export const balancesApi = {
  create: createBalance,
  delete: deleteBalance,
  list: listBalances,
  update: updateBalance,
} as const;

export const positionsApi = {
  commitImport: commitPositionImport,
  create: createPosition,
  delete: deletePosition,
  list: listPositions,
  previewImport: previewPositionImport,
  update: updatePosition,
} as const;

export const tradingOperationsApi = {
  create: createTradingOperation,
  list: listTradingOperations,
} as const;

export const marketDataApi = {
  history: getMarketHistory,
  quotes: getMarketQuotes,
} as const;

export const llmConfigsApi = {
  create: createLlmConfig,
  delete: deleteLlmConfig,
  get: getLlmConfig,
  list: listLlmConfigs,
  update: updateLlmConfig,
} as const;

export const promptTemplatesApi = {
  create: createPromptTemplate,
  delete: deletePromptTemplate,
  get: getPromptTemplate,
  list: listPromptTemplates,
  preview: previewPromptTemplate,
  update: updatePromptTemplate,
} as const;

export const userSnippetsApi = {
  create: createUserSnippet,
  delete: deleteUserSnippet,
  get: getUserSnippet,
  list: listUserSnippets,
  update: updateUserSnippet,
} as const;

export const stockAnalysisApi = {
  conversations: {
    create: createStockAnalysisConversation,
    get: getStockAnalysisConversation,
    list: listStockAnalysisConversations,
    update: updateStockAnalysisConversation,
  },
  promptPreview: previewStockAnalysisPrompt,
  responses: {
    list: listStockAnalysisResponses,
  },
  runs: {
    create: createStockAnalysisRun,
    execute: executeStockAnalysisRun,
    get: getStockAnalysisRun,
    list: listStockAnalysisRuns,
  },
  settings: {
    get: getPortfolioStockAnalysisSettings,
    update: updatePortfolioStockAnalysisSettings,
  },
  versions: {
    get: getStockAnalysisVersion,
    list: listStockAnalysisVersions,
  },
} as const;

export const api = {
  balances: balancesApi,
  llmConfigs: llmConfigsApi,
  marketData: marketDataApi,
  portfolios: portfoliosApi,
  positions: positionsApi,
  promptTemplates: promptTemplatesApi,
  stockAnalysis: stockAnalysisApi,
  tradingOperations: tradingOperationsApi,
  userSnippets: userSnippetsApi,
} as const;
