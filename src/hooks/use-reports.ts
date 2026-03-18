import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  compileReport,
  deleteReport,
  getReport,
  listReports,
  updateReport,
} from "@/lib/api/reports";
import { queryKeys } from "@/lib/query-keys";
import type { ReportUpdateInput } from "@/lib/types/report";

type IdParam = number | string;

type UpdateReportVariables = {
  reportId: IdParam;
  data: ReportUpdateInput;
};

export function useReports() {
  return useQuery({
    queryKey: queryKeys.reports.list(),
    queryFn: ({ signal }) => listReports(signal),
  });
}

export function useReport(reportId: IdParam | undefined) {
  const resolvedId = reportId ?? "";

  return useQuery({
    queryKey: queryKeys.reports.detail(resolvedId),
    queryFn: ({ signal }) => getReport(resolvedId, signal),
    enabled: Boolean(reportId),
  });
}

export function useCompileReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: IdParam) => compileReport(templateId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list() }),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, data }: UpdateReportVariables) =>
      updateReport(reportId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.detail(variables.reportId),
      });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: IdParam) => deleteReport(reportId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list() }),
  });
}
