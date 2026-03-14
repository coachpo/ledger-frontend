import { AlertCircle, Loader2, Sparkles, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePromptPreview } from "@/hooks/use-stock-analysis";
import type { PromptPreviewRequest } from "@/lib/api-types";

type PromptPreviewPanelProps = {
  request: PromptPreviewRequest | undefined;
};

function stepLabel(step: PromptPreviewRequest["step"]) {
  switch (step) {
    case "single":
      return "Single prompt preview";
    case "compare_decide_reflect":
      return "Compare step preview";
    case "follow_up":
      return "Follow-up preview";
    default:
      return "Fresh analysis preview";
  }
}

export function PromptPreviewPanel({ request }: PromptPreviewPanelProps) {
  const previewQuery = usePromptPreview(request);
  const preview = previewQuery.data;
  const placeholderEntries = Object.entries(preview?.placeholderValues ?? {});

  return (
    <Card className="border-border/60 bg-muted/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          {request ? stepLabel(request.step) : "Prompt preview"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!request ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Add a symbol and prompt content to preview the next request.
          </div>
        ) : null}
        {request && previewQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Rendering live portfolio context...
          </div>
        ) : null}
        {request && previewQuery.error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Preview unavailable</AlertTitle>
            <AlertDescription>
              {previewQuery.error instanceof Error
                ? previewQuery.error.message
                : "Preview failed."}
            </AlertDescription>
          </Alert>
        ) : null}
        {preview?.warnings.length ? (
          <Alert>
            <TriangleAlert />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>{preview.warnings.join(" ")}</AlertDescription>
          </Alert>
        ) : null}
        {preview?.errors.length ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Template issues</AlertTitle>
            <AlertDescription>{preview.errors.join(" ")}</AlertDescription>
          </Alert>
        ) : null}
        {preview ? (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">Instructions</h3>
                  <Badge variant="outline">{preview.renderedInstructions.length} chars</Badge>
                </div>
                <pre className="min-h-32 whitespace-pre-wrap rounded-lg border bg-card p-3 text-xs leading-5">
                  {preview.renderedInstructions || "No instructions rendered."}
                </pre>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">Input</h3>
                  <Badge variant="outline">{preview.renderedInput.length} chars</Badge>
                </div>
                <pre className="min-h-32 whitespace-pre-wrap rounded-lg border bg-card p-3 text-xs leading-5">
                  {preview.renderedInput || "No input rendered."}
                </pre>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Resolved placeholders</h3>
              <div className="flex flex-wrap gap-2">
                {placeholderEntries.length > 0 ? (
                  placeholderEntries.map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="max-w-full truncate">
                      {`${key}: ${value}`}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No placeholders resolved.
                  </span>
                )}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
