import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  runBuilderFormSchema,
  type RunBuilderFormValues,
} from "@/components/shared/form-schemas";
import { PromptPreviewPanel } from "@/components/stock-analysis/prompt-preview-panel";
import { RunBuilderModeFields } from "@/components/stock-analysis/run-builder-mode-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";
import { useLlmConfigs } from "@/hooks/use-llm-configs";
import { usePromptTemplates } from "@/hooks/use-prompt-templates";
import { useCreateRun, useExecuteRun } from "@/hooks/use-stock-analysis";
import { ApiRequestError } from "@/lib/api-client";
import type {
  PortfolioStockAnalysisSettingsRead,
  PromptPreviewRequest,
  StockAnalysisRunCreate,
  StockAnalysisRunMode,
  StockAnalysisRunType,
} from "@/lib/api-types";

const EMPTY_SELECT_VALUE = "__none__";

const RUN_MODE_OPTIONS: Array<{
  description: string;
  label: string;
  value: StockAnalysisRunMode;
}> = [
  {
    description: "One request with ad hoc instructions or a single saved template.",
    label: "Single prompt",
    value: "single_prompt",
  },
  {
    description: "Fresh analysis plus compare-and-reflect follow-up steps.",
    label: "Two-step workflow",
    value: "two_step_workflow",
  },
];

const RUN_TYPE_OPTIONS: Array<{ label: string; value: StockAnalysisRunType }> = [
  { label: "Initial review", value: "initial_review" },
  { label: "Periodic review", value: "periodic_review" },
  { label: "Event review", value: "event_review" },
  { label: "Manual follow-up", value: "manual_follow_up" },
];

type Props = {
  conversationId: number;
  isAnalysisEnabled: boolean;
  onRunStarted: (runId: number) => void;
  portfolioId: number | string;
  settings?: PortfolioStockAnalysisSettingsRead;
  symbol: string;
};

function errMsg(error: unknown, fallback: string) {
  return error instanceof ApiRequestError || error instanceof Error
    ? error.message
    : fallback;
}

function opt(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function templateMode(mode: StockAnalysisRunMode) {
  return mode === "single_prompt" ? "single" : "two_step";
}

export function RunBuilderForm({
  conversationId,
  isAnalysisEnabled,
  onRunStarted,
  portfolioId,
  settings,
  symbol,
}: Props) {
  const cfgQ = useLlmConfigs();
  const tplQ = usePromptTemplates();
  const createRun = useCreateRun(portfolioId, conversationId);
  const execRun = useExecuteRun(portfolioId);
  const form = useForm<RunBuilderFormValues>({
    defaultValues: {
      compareInputOverride: "",
      compareInstructionsOverride: "",
      compareToOrigin: settings?.compareToOrigin ?? false,
      freshInputOverride: "",
      freshInstructionsOverride: "",
      inputText: "",
      instructionsText: "",
      llmConfigId: "",
      mode: "single_prompt",
      promptTemplateId: "",
      reviewTrigger: "",
      runType: "initial_review",
      userNote: "",
    },
    mode: "onChange",
    resolver: zodResolver(runBuilderFormSchema),
  });

  const mode = form.watch("mode");
  const runType = form.watch("runType");
  const llmConfigId = form.watch("llmConfigId");
  const promptTemplateId = form.watch("promptTemplateId");
  const reviewTrigger = form.watch("reviewTrigger");
  const userNote = form.watch("userNote");
  const instructionsText = form.watch("instructionsText");
  const inputText = form.watch("inputText");
  const freshInstructionsOverride = form.watch("freshInstructionsOverride");
  const freshInputOverride = form.watch("freshInputOverride");
  const compareInstructionsOverride = form.watch("compareInstructionsOverride");
  const compareInputOverride = form.watch("compareInputOverride");

  const configs = useMemo(
    () => (cfgQ.data ?? []).filter((config) => config.enabled),
    [cfgQ.data],
  );
  const templates = useMemo(
    () =>
      (tplQ.data ?? []).filter(
        (template) =>
          template.status === "active" && template.templateMode === templateMode(mode),
      ),
    [mode, tplQ.data],
  );
  const isSinglePrompt = mode === "single_prompt";
  const busy = createRun.isPending || execRun.isPending;

  useEffect(() => {
    form.setValue("compareToOrigin", settings?.compareToOrigin ?? false, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [form, settings?.compareToOrigin]);

  useEffect(() => {
    if (llmConfigId && configs.some((config) => String(config.id) === llmConfigId)) {
      return;
    }

    const defaultConfigId = settings?.defaultLlmConfigId;

    if (defaultConfigId && configs.some((config) => config.id === defaultConfigId)) {
      form.setValue("llmConfigId", String(defaultConfigId), {
        shouldDirty: false,
        shouldValidate: true,
      });
      return;
    }

    form.setValue("llmConfigId", configs[0] ? String(configs[0].id) : "", {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [configs, form, llmConfigId, settings?.defaultLlmConfigId]);

  useEffect(() => {
    if (!promptTemplateId || templates.some((template) => String(template.id) === promptTemplateId)) {
      return;
    }

    form.setValue("promptTemplateId", "", { shouldDirty: true, shouldValidate: true });
  }, [form, promptTemplateId, templates]);

  const previewRequest = useMemo<PromptPreviewRequest | undefined>(() => {
    const inlineInstructions = isSinglePrompt
      ? instructionsText
      : freshInstructionsOverride;
    const inlineInput = isSinglePrompt ? inputText : freshInputOverride;

    if (!promptTemplateId && (!opt(inlineInstructions) || !opt(inlineInput))) {
      return undefined;
    }

    return {
      conversationId,
      inputTemplate: promptTemplateId ? null : opt(inlineInput),
      instructionsTemplate: promptTemplateId ? null : opt(inlineInstructions),
      llmConfigId: llmConfigId ? Number(llmConfigId) : undefined,
      portfolioId: Number(portfolioId),
      reviewTrigger: opt(reviewTrigger),
      runType,
      step: isSinglePrompt ? "single" : "fresh_analysis",
      symbol,
      templateId: promptTemplateId ? Number(promptTemplateId) : null,
      userNote: opt(userNote),
    };
  }, [
    conversationId,
    freshInputOverride,
    freshInstructionsOverride,
    inputText,
    instructionsText,
    isSinglePrompt,
    llmConfigId,
    portfolioId,
    promptTemplateId,
    reviewTrigger,
    runType,
    symbol,
    userNote,
  ]);

  const missingPromptContent = isSinglePrompt
    ? !promptTemplateId && (!instructionsText.trim() || !inputText.trim())
    : !promptTemplateId
      && (!freshInstructionsOverride.trim()
        || !freshInputOverride.trim()
        || !compareInstructionsOverride.trim()
        || !compareInputOverride.trim());

  async function submit(values: RunBuilderFormValues) {
    if (!isAnalysisEnabled) {
      toast.error("Enable stock analysis for this portfolio before executing runs.");
      return;
    }

    if (!values.llmConfigId) {
      toast.error("Select an enabled LLM configuration first.");
      return;
    }

    const payload: StockAnalysisRunCreate = {
      compareInputOverride: null,
      compareInstructionsOverride: null,
      compareToOrigin: isSinglePrompt ? null : values.compareToOrigin,
      freshInputOverride: null,
      freshInstructionsOverride: null,
      inputText: null,
      instructionsText: null,
      llmConfigId: Number(values.llmConfigId),
      mode: values.mode,
      promptTemplateId: values.promptTemplateId ? Number(values.promptTemplateId) : null,
      reviewTrigger: opt(values.reviewTrigger),
      runType: values.runType,
      userNote: opt(values.userNote),
    };

    if (!values.promptTemplateId && isSinglePrompt) {
      payload.instructionsText = values.instructionsText.trim();
      payload.inputText = values.inputText.trim();
    }

    if (!values.promptTemplateId && !isSinglePrompt) {
      payload.freshInstructionsOverride = values.freshInstructionsOverride.trim();
      payload.freshInputOverride = values.freshInputOverride.trim();
      payload.compareInstructionsOverride = values.compareInstructionsOverride.trim();
      payload.compareInputOverride = values.compareInputOverride.trim();
    }

    try {
      const run = await createRun.mutateAsync(payload);
      onRunStarted(run.id);
      toast.success("Run created. Starting execution...");
      await execRun.mutateAsync(run.id);
      toast.success("Run execution started.");
    } catch (error) {
      toast.error(errMsg(error, "Failed to create or execute run."));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <Card className="border-border/60">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">Run builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the next {symbol} analysis pass and execute it immediately.
              </p>
            </div>
            <Badge variant="secondary">{symbol}</Badge>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{configs.length} enabled configs</Badge>
            <Badge variant="outline">{templates.length} matching templates</Badge>
            {settings?.defaultPromptTemplateId ? (
              <Badge variant="outline">Portfolio defaults available</Badge>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {cfgQ.isError ? (
            <Alert variant="destructive">
              <AlertTitle>LLM configurations failed to load</AlertTitle>
              <AlertDescription>
                {errMsg(cfgQ.error, "You need at least one enabled configuration.")}
              </AlertDescription>
            </Alert>
          ) : null}
          {tplQ.isError ? (
            <Alert>
              <AlertTitle>Prompt templates are unavailable</AlertTitle>
              <AlertDescription>
                {errMsg(tplQ.error, "You can still use ad hoc prompt text.")}
              </AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(submit)}>
              <FormField
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Mode
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        className="grid gap-3 sm:grid-cols-2"
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        {RUN_MODE_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                              field.value === option.value
                                ? "border-primary bg-primary/5"
                                : "border-border/70 hover:border-primary/40",
                            )}
                          >
                            <RadioGroupItem value={option.value} className="mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{option.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {option.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="runType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Run Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RUN_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="llmConfigId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LLM Configuration</FormLabel>
                      <Select
                        disabled={cfgQ.isPending || configs.length === 0}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={cfgQ.isPending ? "Loading configs..." : "Select a config"}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {configs.map((config) => (
                            <SelectItem key={config.id} value={String(config.id)}>
                              {config.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="promptTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt Template (Optional)</FormLabel>
                    <Select
                      disabled={tplQ.isPending}
                      value={field.value || EMPTY_SELECT_VALUE}
                      onValueChange={(value) =>
                        field.onChange(value === EMPTY_SELECT_VALUE ? "" : value)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={tplQ.isPending ? "Loading templates..." : "No saved template"}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>No saved template</SelectItem>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={String(template.id)}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {field.value
                        ? "Saved template content will drive this run."
                        : "Leave this empty to use ad hoc fields below."}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reviewTrigger"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Trigger</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Earnings release, thesis check-in, breaking news"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="userNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User Note</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Optional operator note stored with the run"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <RunBuilderModeFields
                control={form.control}
                disabled={Boolean(promptTemplateId)}
                isSinglePrompt={isSinglePrompt}
              />

              {!isAnalysisEnabled ? (
                <Alert>
                  <AlertTitle>Analysis disabled</AlertTitle>
                  <AlertDescription>
                    Enable stock analysis in portfolio settings to execute runs.
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {missingPromptContent
                    ? "Add prompt content or select a saved template before executing this run."
                    : "The run will be created first, then immediately sent for execution."}
                </p>
                <Button
                  disabled={busy || configs.length === 0 || missingPromptContent || !isAnalysisEnabled}
                  type="submit"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {createRun.isPending
                    ? "Creating run"
                    : execRun.isPending
                      ? "Executing run"
                      : "Create and execute run"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <PromptPreviewPanel request={previewRequest} />
    </div>
  );
}
