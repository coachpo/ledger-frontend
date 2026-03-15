import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type {
  PromptTemplateRead,
  PromptTemplateUpdate,
  PromptTemplateWrite,
} from "@/lib/api-types";
import {
  promptTemplateFormSchema,
  type PromptTemplateFormValues,
} from "@/components/form-schemas";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
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
    reference: "{{response.42}}",
    description: "The full output text from an earlier response in the same portfolio.",
    example: "Build on this earlier response: {{response.42}}",
  },
  {
    label: "Saved snippet",
    reference: "{{user.snippet.core_thesis}}",
    description: "Reusable text from the User Snippets page. The copied reference there is ready to paste here.",
    example: "Use this checklist: {{user.snippet.core_thesis}}",
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
  "Response placeholders need real numeric ids, and snippet placeholders use saved aliases. Preview will fail if the record does not exist.",
  "Response placeholders only work for responses that belong to the same portfolio.",
  "Use Prompt Preview to confirm the rendered text before saving a template.",
  "Escape literal braces with \\{{ and \\}} when you want to show placeholder syntax as plain text.",
];

function emptyText(value: string | null | undefined) {
  return value ?? "";
}

function getDefaultValues(initial?: PromptTemplateRead): PromptTemplateFormValues {
  return {
    compareInputTemplate: emptyText(initial?.compareInputTemplate),
    compareInstructionsTemplate: emptyText(initial?.compareInstructionsTemplate),
    description: initial?.description ?? "",
    freshInputTemplate: emptyText(initial?.freshInputTemplate),
    freshInstructionsTemplate: emptyText(initial?.freshInstructionsTemplate),
    inputTemplate: emptyText(initial?.inputTemplate),
    instructionsTemplate: emptyText(initial?.instructionsTemplate),
    name: initial?.name ?? "",
    templateMode: initial?.templateMode ?? "single",
  };
}

export function PromptTemplateForm({
  initial,
  isPending,
  onCancel,
  onSave,
}: PromptTemplateFormProps) {
  const form = useForm<PromptTemplateFormValues>({
    defaultValues: getDefaultValues(initial),
    resolver: zodResolver(promptTemplateFormSchema),
  });
  const templateMode = form.watch("templateMode");
  const isSingle = templateMode === "single";

  useEffect(() => {
    form.reset(getDefaultValues(initial));
  }, [form, initial]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const shared = {
            description: values.description.trim() || null,
            name: values.name.trim(),
            templateMode: values.templateMode,
          };

          if (values.templateMode === "single") {
            onSave({
              ...shared,
              compareInputTemplate: null,
              compareInstructionsTemplate: null,
              freshInputTemplate: null,
              freshInstructionsTemplate: null,
              inputTemplate: values.inputTemplate.trim(),
              instructionsTemplate: values.instructionsTemplate.trim(),
            } satisfies PromptTemplateWrite | PromptTemplateUpdate);
            return;
          }

          onSave({
            ...shared,
            compareInputTemplate: values.compareInputTemplate.trim(),
            compareInstructionsTemplate: values.compareInstructionsTemplate.trim(),
            freshInputTemplate: values.freshInputTemplate.trim(),
            freshInstructionsTemplate: values.freshInstructionsTemplate.trim(),
            inputTemplate: null,
            instructionsTemplate: null,
          } satisfies PromptTemplateWrite | PromptTemplateUpdate);
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="templateMode"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Template Mode</FormLabel>
              <Tabs value={field.value} onValueChange={field.onChange}>
                <TabsList aria-label="Template Mode" className="grid w-full grid-cols-2">
                  <TabsTrigger value="single">Single Prompt</TabsTrigger>
                  <TabsTrigger value="two_step">Two Step</TabsTrigger>
                </TabsList>
              </Tabs>
              <FormMessage />
            </FormItem>
          )}
        />

        {isSingle ? (
          <div className="space-y-4 rounded-xl border p-4">
            <FormField
              control={form.control}
              name="instructionsTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions Template</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inputTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Input Template</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border p-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="freshInstructionsTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fresh Instructions Template</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freshInputTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fresh Input Template</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="compareInstructionsTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare Instructions Template</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="compareInputTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compare Input Template</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="font-mono text-sm" disabled={isPending} rows={8} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} type="button" variant="outline" disabled={isPending}>
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            Save
          </Button>
        </div>
      </form>
    </Form>
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
