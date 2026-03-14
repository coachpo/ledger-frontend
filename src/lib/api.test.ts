import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PortfolioRead, PortfolioWriteInput } from "./api-types";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const ORIGINAL_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ORIGINAL_FETCH = globalThis.fetch;

function createFetchMock() {
  return vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain" },
  });
}

async function loadApiModule(baseUrl: string = "") {
  vi.resetModules();
  Reflect.set(import.meta.env, "VITE_API_BASE_URL", baseUrl);
  return import("./api");
}

function getLastFetchCall(fetchMock: ReturnType<typeof createFetchMock>): {

  init: RequestInit | undefined;
  url: string;
} {
  const call = fetchMock.mock.calls.at(-1);

  if (!call) {
    throw new Error("Expected fetch to be called");
  }

  const [input, init] = call;
  return { init, url: String(input) };
}

const portfolioFixture: PortfolioRead = {
  id: 1,
  name: "Retirement",
  description: "Long-term holdings",
  baseCurrency: "USD",
  positionCount: 3,
  balanceCount: 2,
  createdAt: "2024-03-15T12:00:00Z",
  updatedAt: "2024-03-15T12:00:00Z",
};

const portfolioInput: PortfolioWriteInput = {
  name: "Retirement",
  description: "Long-term holdings",
  baseCurrency: "USD",
};

let fetchMock = createFetchMock();

beforeEach(() => {

  fetchMock = createFetchMock();
  globalThis.fetch = fetchMock as typeof fetch;
  Reflect.set(import.meta.env, "VITE_API_BASE_URL", "");
});

afterEach(() => {
  vi.restoreAllMocks();
  globalThis.fetch = ORIGINAL_FETCH;
  Reflect.set(import.meta.env, "VITE_API_BASE_URL", ORIGINAL_API_BASE_URL);
});

describe("api client", () => {
  it("sends a successful GET request for listPortfolios", async () => {
    const { listPortfolios } = await loadApiModule();
    fetchMock.mockResolvedValueOnce(jsonResponse([portfolioFixture], 200));

    await expect(listPortfolios()).resolves.toEqual([portfolioFixture]);

    const { init, url } = getLastFetchCall(fetchMock);
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/portfolios`);
    expect(init?.method).toBe("GET");
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
  });

  it("sends a successful POST request for createPortfolio", async () => {
    const { createPortfolio } = await loadApiModule();
    fetchMock.mockResolvedValueOnce(jsonResponse(portfolioFixture, 201));

    await expect(createPortfolio(portfolioInput)).resolves.toEqual(portfolioFixture);

    const { init, url } = getLastFetchCall(fetchMock);
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/portfolios`);
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe(JSON.stringify(portfolioInput));
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
  });

  it("maps JSON detail strings into ApiRequestError messages for 404 responses", async () => {
    const { ApiRequestError, getPortfolio } = await loadApiModule();
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Portfolio not found" }, 404));

    let error: unknown;
    try {
      await getPortfolio(999);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 404,
      code: "request_failed",
      message: "Portfolio not found",
      details: [],
    });
  });

  it("preserves status, code, message, and validation details for 422 responses", async () => {
    const { ApiRequestError, createPortfolio } = await loadApiModule();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          code: "validation_error",
          message: "Validation failed",
          details: [
            { field: "name", issue: "Required" },
            { field: "baseCurrency", issue: "Unsupported currency" },
            { issue: "Missing field" },
          ],
        },
        422,
      ),
    );

    let error: unknown;
    try {
      await createPortfolio(portfolioInput);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 422,
      code: "validation_error",
      message: "Validation failed",
      details: [
        { field: "name", issue: "Required" },
        { field: "baseCurrency", issue: "Unsupported currency" },
      ],
    });
  });

  it("falls back to a generic request_failed error for 500 text responses", async () => {
    const { ApiRequestError, listPortfolios } = await loadApiModule();
    fetchMock.mockResolvedValueOnce(textResponse("Internal Server Error", 500));

    let error: unknown;
    try {
      await listPortfolios();
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(ApiRequestError);
    expect(error).toMatchObject({
      status: 500,
      code: "request_failed",
      message: "Internal Server Error",
      details: [],
    });
  });

  it("encodes path segments and query parameters against a configured base URL", async () => {
    const { listStockAnalysisConversations } = await loadApiModule("https://ledger.example.com/api/v2/");
    fetchMock.mockResolvedValueOnce(jsonResponse([], 200));

    await expect(
      listStockAnalysisConversations("portfolio with/slash", {
        includeArchived: true,
        symbol: "BRK/B",
      }),
    ).resolves.toEqual([]);

    const { url } = getLastFetchCall(fetchMock);
    expect(url).toBe(
      "https://ledger.example.com/api/v2/portfolios/portfolio%20with%2Fslash/stock-analysis/conversations?include_archived=true&symbol=BRK%2FB",
    );
  });
});
