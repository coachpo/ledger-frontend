import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PromptPreviewPanel } from "@/components/stock-analysis/prompt-preview-panel";
import { RunBuilderModeFields } from "@/components/stock-analysis/run-builder-mode-fields";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ApiRequestError } from "@/lib/api";
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
  conversationId: string;
  isAnalysisEnabled: boolean;
  onRunStarted: (runId: string) => void;
  portfolioId: string;
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

  const [mode, setMode] = useState<StockAnalysisRunMode>("single_prompt");
  const [runType, setRunType] = useState<StockAnalysisRunType>("initial_review");
  const [llmConfigId, setLlmConfigId] = useState("");
  const [promptTemplateId, setPromptTemplateId] = useState<string | null>(null);
  const [reviewTrigger, setReviewTrigger] = useState("");
  const [userNote, setUserNote] = useState("");
  const [compareToOrigin, setCompareToOrigin] = useState(
    settings?.compareToOrigin ?? false,
  );
  const [instructionsText, setInstructionsText] = useState("");
  const [inputText, setInputText] = useState("");
  const [freshInstructionsOverride, setFreshInstructionsOverride] = useState("");
  const [freshInputOverride, setFreshInputOverride] = useState("");
  const [compareInstructionsOverride, setCompareInstructionsOverride] = useState("");
  const [compareInputOverride, setCompareInputOverride] = useState("");

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
    setCompareToOrigin(settings?.compareToOrigin ?? false);
  }, [settings?.compareToOrigin]);

  useEffect(() => {
    if (llmConfigId && configs.some((config) => config.id === llmConfigId)) {
      return;
    }

    const defaultConfigId = settings?.defaultLlmConfigId;

    if (defaultConfigId && configs.some((config) => config.id === defaultConfigId)) {
      setLlmConfigId(defaultConfigId);
      return;
    }

    setLlmConfigId(configs[0]?.id ?? "");
  }, [configs, llmConfigId, settings?.defaultLlmConfigId]);

  useEffect(() => {
    if (promptTemplateId && !templates.some((template) => template.id === promptTemplateId)) {
      setPromptTemplateId(null);
    }
  }, [promptTemplateId, templates]);

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
      llmConfigId: llmConfigId || undefined,
      portfolioId,
      reviewTrigger: opt(reviewTrigger),
      runType,
      step: isSinglePrompt ? "single" : "fresh_analysis",
      symbol,
      templateId: promptTemplateId,
      userNote: opt(userNote),
      inputTemplate: promptTemplateId ? null : opt(inlineInput),
      instructionsTemplate: promptTemplateId ? null : opt(inlineInstructions),
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
    : !promptTemplateId &&
      (!freshInstructionsOverride.trim() ||
        !freshInputOverride.trim() ||
        !compareInstructionsOverride.trim() ||
        !compareInputOverride.trim());

  async function submit() {
    if (!isAnalysisEnabled) {
      toast.error("Enable stock analysis for this portfolio before executing runs.");
      return;
    }

    if (!llmConfigId) {
      toast.error("Select an enabled LLM configuration first.");
      return;
    }

    if (missingPromptContent) {
      toast.error(
        isSinglePrompt
          ? "Add instructions and input text, or select a saved single-prompt template."
          : "Select a two-step template or fill in all four workflow override fields.",
      );
      return;
    }

    const payload: StockAnalysisRunCreate = {
      llmConfigId,
      mode,
      promptTemplateId,
      reviewTrigger: opt(reviewTrigger),
      runType,
      userNote: opt(userNote),
      compareToOrigin: isSinglePrompt ? null : compareToOrigin,
      compareInputOverride: null,
      compareInstructionsOverride: null,
      freshInputOverride: null,
      freshInstructionsOverride: null,
      inputText: null,
      instructionsText: null,
    };

    if (!promptTemplateId && isSinglePrompt) {
      payload.instructionsText = instructionsText.trim();
      payload.inputText = inputText.trim();
    }

    if (!promptTemplateId && !isSinglePrompt) {
      payload.freshInstructionsOverride = freshInstructionsOverride.trim();
      payload.freshInputOverride = freshInputOverride.trim();
      payload.compareInstructionsOverride = compareInstructionsOverride.trim();
      payload.compareInputOverride = compareInputOverride.trim();
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

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Mode
            </Label>
            <RadioGroup
              value={mode}
              onValueChange={(value) => setMode(value as StockAnalysisRunMode)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {RUN_MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    mode === option.value
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Run Type</Label>
              <Select
                value={runType}
                onValueChange={(value) => setRunType(value as StockAnalysisRunType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RUN_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>LLM Configuration</Label>
              <Select
                value={llmConfigId || undefined}
                onValueChange={setLlmConfigId}
                disabled={cfgQ.isPending || configs.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={cfgQ.isPending ? "Loading configs..." : "Select a config"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Prompt Template (Optional)</Label>
            <Select
              value={promptTemplateId ?? EMPTY_SELECT_VALUE}
              onValueChange={(value) =>
                setPromptTemplateId(value === EMPTY_SELECT_VALUE ? null : value)
              }
              disabled={tplQ.isPending}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={tplQ.isPending ? "Loading templates..." : "No saved template"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_SELECT_VALUE}>No saved template</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {promptTemplateId
                ? "Saved template content will drive this run."
                : "Leave this empty to use ad hoc fields below."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Review Trigger</Label>
              <Input
                value={reviewTrigger}
                onChange={(event) => setReviewTrigger(event.target.value)}
                placeholder="Earnings release, thesis check-in, breaking news"
              />
            </div>
            <div className="space-y-2">
              <Label>User Note</Label>
              <Textarea
                value={userNote}
                onChange={(event) => setUserNote(event.target.value)}
                rows={3}
                placeholder="Optional operator note stored with the run"
              />
            </div>
          </div>

          <RunBuilderModeFields
            compareInputOverride={compareInputOverride}
            compareInstructionsOverride={compareInstructionsOverride}
            compareToOrigin={compareToOrigin}
            disabled={Boolean(promptTemplateId)}
            freshInputOverride={freshInputOverride}
            freshInstructionsOverride={freshInstructionsOverride}
            inputText={inputText}
            instructionsText={instructionsText}
            isSinglePrompt={isSinglePrompt}
            onCompareInputOverrideChange={setCompareInputOverride}
            onCompareInstructionsOverrideChange={setCompareInstructionsOverride}
            onCompareToOriginChange={setCompareToOrigin}
            onFreshInputOverrideChange={setFreshInputOverride}
            onFreshInstructionsOverrideChange={setFreshInstructionsOverride}
            onInputTextChange={setInputText}
            onInstructionsTextChange={setInstructionsText}
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
              onClick={() => void submit()}
              disabled={
                busy || configs.length === 0 || missingPromptContent || !isAnalysisEnabled
              }
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {createRun.isPending
                ? "Creating run"
                : execRun.isPending
                  ? "Executing run"
                  : "Create and execute run"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PromptPreviewPanel request={previewRequest} />
    </div>
  );
}
