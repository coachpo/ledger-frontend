import { useId, useState } from "react";

import type {
  PromptTemplateMode,
  PromptTemplateRead,
  PromptTemplateUpdate,
  PromptTemplateWrite,
} from "@/lib/api-types";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Textarea } from "./ui/textarea";

type PromptTemplateFormProps = {
  initial?: PromptTemplateRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: PromptTemplateWrite | PromptTemplateUpdate) => void;
};

type PlaceholderReferenceItem = {
  label: string;
  reference: string;
  description: string;
  example: string;
};

const PLACEHOLDER_REFERENCE_ITEMS: PlaceholderReferenceItem[] = [
  {
    label: "Current symbol",
    reference: "{{stock.symbol}}",
    description: "The selected stock symbol for this template or preview.",
    example: "Analyze {{stock.symbol}} for {{portfolio.name}}.",
  },
  {
    label: "Selected portfolio",
    reference: "{{portfolio.name}}",
    description: "Portfolio fields like name and baseCurrency for the active selection.",
    example: "Base currency: {{portfolio.baseCurrency}}.",
  },
  {
    label: "Active position",
    reference: "{{position.quantity}}",
    description: "Position fields for the selected symbol, including quantity, averageCost, and currency.",
    example: "Current position: {{position.quantity}} shares at {{position.averageCost}} {{position.currency}}.",
  },
  {
    label: "Prior response",
    reference: "{{response.123e4567-e89b-12d3-a456-426614174000}}",
    description: "The full output text from an earlier response in the same portfolio.",
    example:
      "Build on this earlier response: {{response.123e4567-e89b-12d3-a456-426614174000}}",
  },
  {
    label: "Saved snippet",
    reference: "{{user.snippet.123e4567-e89b-12d3-a456-426614174000}}",
    description: "Reusable text from the User Snippets page. The copied reference there is ready to paste here.",
    example:
      "Use this checklist: {{user.snippet.123e4567-e89b-12d3-a456-426614174000}}",
  },
  {
    label: "Another symbol",
    reference: "{{stock.MSFT.quote.summary}}",
    description: "Live quote or history context for another symbol mentioned inside the template.",
    example: "Compare {{stock.symbol}} with {{stock.MSFT.quote.summary}}",
  },
  {
    label: "Specific holding",
    reference: "{{position.AAPL.quantity}}",
    description: "Position data for a specific portfolio holding, even if it is not the active symbol.",
    example: "Reference the existing AAPL size: {{position.AAPL.quantity}} shares.",
  },
  {
    label: "Compare step output",
    reference: "{{freshAnalysis.thesis}}",
    description: "Available in compare-step prompts after the fresh analysis step has produced structured output.",
    example: "Re-evaluate the thesis: {{freshAnalysis.thesis}}",
  },
];

const PLACEHOLDER_REFERENCE_TIPS = [
  "Use dot paths, not shorthand. {{stock.symbol}} works, while {{stock}} does not.",
  "Response and snippet placeholders need real UUIDs. Preview will fail if the record does not exist.",
  "Response placeholders only work for responses that belong to the same portfolio.",
  "Use Prompt Preview to confirm the rendered text before saving a template.",
  "Escape literal braces with \\{{ and \\}} when you want to show placeholder syntax as plain text.",
];

function emptyText(value: string | null | undefined) {
  return value ?? "";
}

export function PromptTemplateForm({
  initial,
  isPending,
  onCancel,
  onSave,
}: PromptTemplateFormProps) {
  const nameId = useId();
  const descriptionId = useId();
  const instructionsId = useId();
  const inputId = useId();
  const freshInstructionsId = useId();
  const freshInputId = useId();
  const compareInstructionsId = useId();
  const compareInputId = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [templateMode, setTemplateMode] = useState<PromptTemplateMode>(
    initial?.templateMode ?? "single",
  );
  const [instructionsTemplate, setInstructionsTemplate] = useState(
    emptyText(initial?.instructionsTemplate),
  );
  const [inputTemplate, setInputTemplate] = useState(emptyText(initial?.inputTemplate));
  const [freshInstructionsTemplate, setFreshInstructionsTemplate] = useState(
    emptyText(initial?.freshInstructionsTemplate),
  );
  const [freshInputTemplate, setFreshInputTemplate] = useState(
    emptyText(initial?.freshInputTemplate),
  );
  const [compareInstructionsTemplate, setCompareInstructionsTemplate] = useState(
    emptyText(initial?.compareInstructionsTemplate),
  );
  const [compareInputTemplate, setCompareInputTemplate] = useState(
    emptyText(initial?.compareInputTemplate),
  );

  const isSingle = templateMode === "single";
  const hasRequiredFields = isSingle
    ? name.trim() && instructionsTemplate.trim() && inputTemplate.trim()
    : name.trim() &&
      freshInstructionsTemplate.trim() &&
      freshInputTemplate.trim() &&
      compareInstructionsTemplate.trim() &&
      compareInputTemplate.trim();

  function handleSave() {
    const shared = {
      name: name.trim(),
      description: description.trim() || null,
      templateMode,
    };

    if (isSingle) {
      onSave({
        ...shared,
        instructionsTemplate: instructionsTemplate.trim(),
        inputTemplate: inputTemplate.trim(),
        freshInstructionsTemplate: null,
        freshInputTemplate: null,
        compareInstructionsTemplate: null,
        compareInputTemplate: null,
      });
      return;
    }

    onSave({
      ...shared,
      instructionsTemplate: null,
      inputTemplate: null,
      freshInstructionsTemplate: freshInstructionsTemplate.trim(),
      freshInputTemplate: freshInputTemplate.trim(),
      compareInstructionsTemplate: compareInstructionsTemplate.trim(),
      compareInputTemplate: compareInputTemplate.trim(),
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={nameId}>Name</Label>
          <Input id={nameId} value={name} onChange={(event) => setName(event.target.value)} disabled={isPending} />
        </div>
        <div>
          <Label htmlFor={descriptionId}>Description</Label>
          <Input
            id={descriptionId}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Template Mode</Label>
        <Tabs value={templateMode} onValueChange={(value) => setTemplateMode(value as PromptTemplateMode)}>
          <TabsList aria-label="Template Mode" className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Prompt</TabsTrigger>
            <TabsTrigger value="two_step">Two Step</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isSingle ? (
        <div className="space-y-4 rounded-xl border p-4">
          <div>
            <Label htmlFor={instructionsId}>Instructions Template</Label>
            <Textarea
              id={instructionsId}
              value={instructionsTemplate}
              onChange={(event) => setInstructionsTemplate(event.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={isPending}
            />
          </div>
          <div>
            <Label htmlFor={inputId}>Input Template</Label>
            <Textarea
              id={inputId}
              value={inputTemplate}
              onChange={(event) => setInputTemplate(event.target.value)}
              rows={8}
              className="font-mono text-sm"
              disabled={isPending}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor={freshInstructionsId}>Fresh Instructions Template</Label>
              <Textarea
                id={freshInstructionsId}
                value={freshInstructionsTemplate}
                onChange={(event) => setFreshInstructionsTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor={freshInputId}>Fresh Input Template</Label>
              <Textarea
                id={freshInputId}
                value={freshInputTemplate}
                onChange={(event) => setFreshInputTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <Label htmlFor={compareInstructionsId}>Compare Instructions Template</Label>
              <Textarea
                id={compareInstructionsId}
                value={compareInstructionsTemplate}
                onChange={(event) => setCompareInstructionsTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
            <div>
              <Label htmlFor={compareInputId}>Compare Input Template</Label>
              <Textarea
                id={compareInputId}
                value={compareInputTemplate}
                onChange={(event) => setCompareInputTemplate(event.target.value)}
                rows={8}
                className="font-mono text-sm"
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isPending || !hasRequiredFields}>
          Save
        </Button>
      </div>
    </div>
  );
}

export function PromptTemplatePlaceholderReference() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Placeholder Reference</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          Placeholders resolve against live portfolio context during prompt preview. Use full dot
          paths like <code className="rounded bg-muted px-1">{"{{stock.symbol}}"}</code> and{" "}
          <code className="rounded bg-muted px-1">{"{{portfolio.name}}"}</code> in either the
          instructions or input template.
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="grid gap-3 md:grid-cols-2">
            {PLACEHOLDER_REFERENCE_ITEMS.map((item) => (
              <div key={item.reference} className="space-y-2 rounded-xl border p-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    {item.label}
                  </p>
                  <code className="mt-2 inline-block rounded bg-muted px-1 py-0.5 text-xs">
                    {item.reference}
                  </code>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Example</p>
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs leading-5">
                    {item.example}
                  </pre>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                Usage Tips
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Preview is the fastest way to verify that a placeholder resolves to the value you expect.
              </p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {PLACEHOLDER_REFERENCE_TIPS.map((tip) => (
                <p key={tip} className="rounded-lg bg-muted/60 p-3">
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
