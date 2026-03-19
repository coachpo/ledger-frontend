import { useState } from "react";
import { Download, Eye, MoreHorizontal, Plus, Trash2, Upload } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCompileReport, useDeleteReport, useReports, useUploadReport } from "@/hooks/use-reports";
import { useTemplates } from "@/hooks/use-templates";
import { formatDateTime } from "@/lib/format";
import { downloadReportUrl } from "@/lib/api/reports";
import type { ReportRead } from "@/lib/api-types";
import { Badge } from "@/components/ui/badge";
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
import { GenerateReportDialog } from "@/components/forms/generate-report-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { ConfirmDeleteDialog } from "@/components/portfolios/confirm-delete-dialog";

export function ReportListPage() {
  const navigate = useNavigate();
  const reportsQuery = useReports();
  const templatesQuery = useTemplates();
  const compileMutation = useCompileReport();
  const deleteMutation = useDeleteReport();
  const uploadMutation = useUploadReport();
  
  const [deleting, setDeleting] = useState<ReportRead | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSlug, setUploadSlug] = useState("");
  const [uploadAuthor, setUploadAuthor] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadTags, setUploadTags] = useState("");

  const reports = reportsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  const handleGenerate = ({
    inputs,
    templateId,
  }: {
    inputs: Record<string, string>;
    templateId: string;
  }) => {
    compileMutation.mutate({
      templateId,
      input: { inputs },
    }, {
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : "Failed to generate report"),
      onSuccess: (report) => {
        toast.success(`Report "${report.name}" generated`);
        setGenerateOpen(false);
        navigate(`/reports/${report.slug}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const nameWithoutExt = file.name.replace(/\.md$/i, "");
      const generatedSlug = nameWithoutExt
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase();
      setUploadSlug(generatedSlug);
    } else {
      setUploadFile(null);
    }
  };

  const handleUpload = () => {
    if (!uploadFile || !uploadSlug) return;

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("slug", uploadSlug);
    if (uploadAuthor) formData.append("author", uploadAuthor);
    if (uploadDescription) formData.append("description", uploadDescription);
    if (uploadTags) formData.append("tags", uploadTags);

    uploadMutation.mutate(formData, {
      onError: (error) => {
        const status = (error as { status?: number }).status;
        if (status === 409) {
          toast.error("A report with this slug already exists");
        } else {
          toast.error(error instanceof Error ? error.message : "Failed to upload report");
        }
      },
      onSuccess: (report) => {
        toast.success(`Report "${report.name}" uploaded`);
        setUploadOpen(false);
        setUploadFile(null);
        setUploadSlug("");
        setUploadAuthor("");
        setUploadDescription("");
        setUploadTags("");
        navigate(`/reports/${report.slug}`);
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
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1 size-3.5" /> Upload Report
          </Button>
          <Button size="sm" onClick={() => setGenerateOpen(true)}>
            <Plus className="mr-1 size-3.5" /> Generate Report
          </Button>
        </div>
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
              No reports yet. Generate one from a template or upload a markdown file.
            </CardContent>
          </Card>
        ) : null}
        {reports.map((report) => {
          const sourceLabel =
            report.source === "uploaded"
              ? "Uploaded"
              : report.source === "external"
                ? "External"
                : "Compiled";
          const sourceBadgeVariant = report.source === "uploaded" ? "secondary" : "outline";

          return (
            <Card key={report.id} className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer space-y-0.5"
                  onClick={() => navigate(`/reports/${report.slug}`)}
                >
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium tracking-tight">
                      {report.name}
                    </CardTitle>
                    <Badge variant={sourceBadgeVariant} className="h-4 px-1.5 text-[10px]">
                      {sourceLabel}
                    </Badge>
                  </div>
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
                      <DropdownMenuItem onSelect={() => navigate(`/reports/${report.slug}`)}>
                        <Eye className="size-3.5" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={downloadReportUrl(report.slug)} download>
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
          );
        })}
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
          deleteMutation.mutate(deleting.slug, {
            onError: (error) =>
              toast.error(error instanceof Error ? error.message : "Failed to delete report"),
            onSuccess: () => {
              toast.success("Report deleted");
              setDeleting(null);
            },
          });
        }}
      />

      <GenerateReportDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
          templateOptions={templates.map((template) => ({
            id: String(template.id),
            name: template.name,
          }))}
          isPending={compileMutation.isPending}
          onGenerate={handleGenerate}
        />

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Report</DialogTitle>
            <DialogDescription>
              Upload a markdown file to create a new report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="file">Markdown File</Label>
              <Input
                id="file"
                type="file"
                accept=".md"
                onChange={handleFileChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={uploadSlug}
                onChange={(e) => setUploadSlug(e.target.value)}
                placeholder="my_report_slug"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author (optional)</Label>
              <Input
                id="author"
                value={uploadAuthor}
                onChange={(e) => setUploadAuthor(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Brief description of the report..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <Input
                id="tags"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                placeholder="q1, finance, summary (comma-separated)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadSlug || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
