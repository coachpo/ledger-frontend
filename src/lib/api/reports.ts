import type { ReportRead, ReportUpdateInput } from "../types/report";
import { type IdParam, buildApiUrl, request, toPathSegment } from "../api-client";

function reportPath(reportId: IdParam): string {
  return `/reports/${toPathSegment(reportId)}`;
}

export function listReports(signal?: AbortSignal): Promise<ReportRead[]> {
  return request<ReportRead[]>("/reports", { signal });
}

export function getReport(
  reportId: IdParam,
  signal?: AbortSignal,
): Promise<ReportRead> {
  return request<ReportRead>(reportPath(reportId), { signal });
}

export function compileReport(
  templateId: IdParam,
  signal?: AbortSignal,
): Promise<ReportRead> {
  return request<ReportRead>(`/reports/compile/${toPathSegment(templateId)}`, {
    method: "POST",
    signal,
  });
}

export function updateReport(
  reportId: IdParam,
  input: ReportUpdateInput,
  signal?: AbortSignal,
): Promise<ReportRead> {
  return request<ReportRead>(reportPath(reportId), {
    body: input,
    method: "PATCH",
    signal,
  });
}

export function deleteReport(
  reportId: IdParam,
  signal?: AbortSignal,
): Promise<void> {
  return request<void>(reportPath(reportId), {
    method: "DELETE",
    signal,
  });
}

export function downloadReportUrl(reportId: IdParam): string {
  return buildApiUrl(`${reportPath(reportId)}/download`);
}

export const reportsApi = {
  compile: compileReport,
  delete: deleteReport,
  downloadUrl: downloadReportUrl,
  get: getReport,
  list: listReports,
  update: updateReport,
} as const;
