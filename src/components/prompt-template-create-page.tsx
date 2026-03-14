import { useNavigate } from "react-router";
import { toast } from "sonner";

import { useCreatePromptTemplate } from "@/hooks/use-prompt-templates";
import type { PromptTemplateWrite } from "@/lib/api-types";

import { PromptTemplateForm, PromptTemplatePlaceholderReference } from "./prompt-template-form";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function PromptTemplateCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreatePromptTemplate();

  return (
    <div className="max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl tracking-tight">New Prompt Template</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a reusable prompt structure for single-step or two-step stock analysis workflows.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <PromptTemplateForm
            isPending={createMutation.isPending}
            onCancel={() => navigate("/templates")}
            onSave={(data) => {
              createMutation.mutate(data as PromptTemplateWrite, {
                onError: (error) => {
                  toast.error(error instanceof Error ? error.message : "Failed to create template");
                },
                onSuccess: () => {
                  toast.success("Template created");
                  navigate("/templates");
                },
              });
            }}
          />
        </CardContent>
      </Card>

      <PromptTemplatePlaceholderReference />
    </div>
  );
}
