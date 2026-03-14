import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useStockAnalysisRun } from "@/hooks/use-stock-analysis";
import { formatDateTime } from "@/lib/format";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RunStatusDisplayProps = {
  portfolioId?: string;
  runId?: string;
};

export function RunStatusDisplay({
  portfolioId,
  runId,
}: RunStatusDisplayProps) {
  const { data, error, isError, isPending, refetch } = useStockAnalysisRun(portfolioId, runId);
  const runStatus = data?.status;

  useEffect(() => {
    if (runStatus !== "queued" && runStatus !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      void refetch();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [refetch, runStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!runId ? (
          <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            Create and execute a run to inspect request progress here.
          </div>
        ) : isPending ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading run...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Run details unavailable."}
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{data.status}</Badge>
              <Badge variant="outline">{data.mode}</Badge>
              <Badge variant="outline">{data.provider}</Badge>
              <Badge variant="outline">{data.model}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border p-3 text-sm">
                Created {formatDateTime(data.createdAt)}
              </div>
              <div className="rounded-xl border p-3 text-sm">
                Updated {formatDateTime(data.updatedAt)}
              </div>
              <div className="rounded-xl border p-3 text-sm">
                Completed {data.completedAt ? formatDateTime(data.completedAt) : "In progress"}
              </div>
            </div>
            <div className="space-y-3">
              {data.requests.map((request) => (
                <div key={request.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{request.step}</Badge>
                    <Badge variant="outline">{request.status}</Badge>
                    <Badge variant="outline">{request.promptSource}</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap">
                      {request.instructionsSnapshot}
                    </pre>
                    <pre className="overflow-x-auto rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap">
                      {request.inputSnapshot}
                    </pre>
                  </div>
                  {request.response?.outputText ? (
                    <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-muted p-3 text-xs whitespace-pre-wrap">
                      {request.response.outputText}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
