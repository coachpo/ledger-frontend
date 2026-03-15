import type * as ApiTypes from "../api-types";
import { type IdParam, portfolioPath, request } from "../api-client";

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
  portfolioId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioRead> {
  return request<ApiTypes.PortfolioRead>(portfolioPath(portfolioId), { signal });
}

export function updatePortfolio(
  portfolioId: IdParam,
  input: ApiTypes.PortfolioUpdateInput,
  signal?: AbortSignal,
): Promise<ApiTypes.PortfolioRead> {
  return request<ApiTypes.PortfolioRead>(portfolioPath(portfolioId), {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deletePortfolio(portfolioId: IdParam, signal?: AbortSignal): Promise<void> {
  return request<void>(portfolioPath(portfolioId), {
    method: "DELETE",
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
