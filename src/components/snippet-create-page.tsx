import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCreateSnippet } from "@/hooks/use-snippets";
import type { UserSnippetCreate } from "@/lib/api-types";

import { SnippetForm } from "@/components/forms/snippet-form";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function SnippetCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateSnippet();

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl tracking-tight">New Snippet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save reusable notes and references for prompt composition.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Snippet Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <SnippetForm
            isPending={createMutation.isPending}
            onCancel={() => navigate("/snippets")}
            onSave={(data) => {
              createMutation.mutate(data as UserSnippetCreate, {
                onError: (error) => {
                  toast.error(error instanceof Error ? error.message : "Failed to create snippet");
                },
                onSuccess: () => {
                  toast.success("Snippet created");
                  navigate("/snippets");
                },
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
