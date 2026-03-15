import type * as ApiTypes from "../api-types";
import { type IdParam, createCsvFormData, portfolioPath, request, toPathSegment } from "../api-client";

export function listPositions(
  portfolioId: IdParam,
  signal?: AbortSignal,
): Promise<ApiTypes.PositionRead[]> {
  return request<ApiTypes.PositionRead[]>(`${portfolioPath(portfolioId)}/positions`, {
    signal,
  });
}

export function createPosition(
  portfolioId: IdParam,
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
  portfolioId: IdParam,
  positionId: IdParam,
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
  portfolioId: IdParam,
  positionId: IdParam,
  signal?: AbortSignal,
): Promise<void> {
  return request<void>(`${portfolioPath(portfolioId)}/positions/${toPathSegment(positionId)}`, {
    method: "DELETE",
    signal,
  });
}

export function previewPositionImport(
  portfolioId: IdParam,
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
  portfolioId: IdParam,
  file: File,
  signal?: AbortSignal,
): Promise<ApiTypes.CsvCommitRead> {
  return request<ApiTypes.CsvCommitRead>(`${portfolioPath(portfolioId)}/positions/imports/commit`, {
    body: createCsvFormData(file),
    method: "POST",
    signal,
  });
}

export const positionsApi = {
  commitImport: commitPositionImport,
  create: createPosition,
  delete: deletePosition,
  list: listPositions,
  previewImport: previewPositionImport,
  update: updatePosition,
} as const;
