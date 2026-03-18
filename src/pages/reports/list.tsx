import { useState } from "react";
import { Download, Eye, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCompileReport, useDeleteReport, useReports } from "@/hooks/use-reports";
import { useTemplates } from "@/hooks/use-templates";
import { formatDateTime } from "@/lib/format";
import { downloadReportUrl } from "@/lib/api/reports";
import type { ReportRead } from "@/lib/api-types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ConfirmDeleteDialog } from "@/components/portfolios/confirm-delete-dialog";

export function ReportListPage() {
  const navigate = useNavigate();
  const reportsQuery = useReports();
  const templatesQuery = useTemplates();
  const compileMutation = useCompileReport();
  const deleteMutation = useDeleteReport();
  const [deleting, setDeleting] = useState<ReportRead | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const reports = reportsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  const handleGenerate = () => {
    if (!selectedTemplateId) return;

    compileMutation.mutate(selectedTemplateId, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Failed to generate report"),
      onSuccess: (report) => {
        toast.success(`Report "${report.name}" generated`);
        setGenerateOpen(false);
        setSelectedTemplateId("");
        navigate(`/reports/${report.id}`);
      },
    });
  };

  return (
    <div className="max-w-6xl space-y-3 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
          <p className="text-xs text-muted-foreground">
            Compiled template snapshots — point-in-time deliverables.
          </p>
        </div>
        <Button size="sm" onClick={() => setGenerateOpen(true)}>
          <Plus className="mr-1 size-3.5" /> Generate Report
        </Button>
      </div>

      <div className="space-y-2">
        {reportsQuery.isPending ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-muted-foreground">
              Loading reports...
            </CardContent>
          </Card>
        ) : null}
        {reportsQuery.isError ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-muted-foreground">
              {reportsQuery.error instanceof Error
                ? reportsQuery.error.message
                : "Failed to load reports."}
            </CardContent>
          </Card>
        ) : null}
        {!reportsQuery.isPending && !reportsQuery.isError && reports.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-xs text-muted-foreground">
              No reports yet. Generate one from a template.
            </CardContent>
          </Card>
        ) : null}
        {reports.map((report) => (
          <Card key={report.id} className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
              <div
                className="min-w-0 flex-1 cursor-pointer space-y-0.5"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <CardTitle className="text-sm font-medium tracking-tight">
                  {report.name}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Created {formatDateTime(report.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label={`Open actions for ${report.name}`}
                      size="icon"
                      variant="ghost"
                      className="size-7"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => navigate(`/reports/${report.id}`)}>
                      <Eye className="size-3.5" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={downloadReportUrl(report.id)} download>
                        <Download className="size-3.5" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => setDeleting(report)}
                      variant="destructive"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        title="Delete report"
        description={`Delete "${deleting?.name ?? "this report"}"? This cannot be undone.`}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        onConfirm={() => {
          if (!deleting) return;
          deleteMutation.mutate(deleting.id, {
            onError: (error) =>
              toast.error(error instanceof Error ? error.message : "Failed to delete report"),
            onSuccess: () => {
              toast.success("Report deleted");
              setDeleting(null);
            },
          });
        }}
      />

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Select a template to compile into a report snapshot.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template…" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenerateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedTemplateId || compileMutation.isPending}
            >
              {compileMutation.isPending ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
