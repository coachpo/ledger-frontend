import { useEffect, useId, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateLlmConfig,
  useDeleteLlmConfig,
  useLlmConfigs,
  useUpdateLlmConfig,
} from "@/hooks/use-llm-configs";
import { ApiRequestError } from "@/lib/api";
import type {
  LlmConfigRead,
  LlmConfigUpdate,
  LlmConfigWrite,
  LlmProvider,
  OpenaiEndpointMode,
  UnknownRecord,
} from "@/lib/api-types";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

const DEFAULT_TEMPERATURE = 0.5;
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TOP_P = 0.9;

const PROVIDER_LABELS: Record<LlmProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Gemini",
};

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  gemini: "gemini-2.0-flash",
};

const OPENAI_ENDPOINT_LABELS: Record<OpenaiEndpointMode, string> = {
  chat_completions: "Chat Completions",
  responses: "Responses",
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError || error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getNumberSetting(
  settings: UnknownRecord | null | undefined,
  key: "maxTokens" | "temperature" | "topP",
  fallback: number,
): number {
  const value = settings?.[key];

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function buildGenerationSettings(
  temperature: number,
  maxTokens: number,
  topP: number,
): UnknownRecord {
  return {
    temperature,
    maxTokens,
    topP,
  };
}

type ConfigFormProps = {
  initial?: LlmConfigRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: LlmConfigUpdate | LlmConfigWrite) => void;
};

function ConfigForm({ initial, isPending, onCancel, onSave }: ConfigFormProps) {
  const displayNameId = useId();
  const displayNameLabelId = useId();
  const providerId = useId();
  const providerLabelId = useId();
  const modelId = useId();
  const modelLabelId = useId();
  const openaiEndpointModeId = useId();
  const openaiEndpointModeLabelId = useId();
  const replaceApiKeyId = useId();
  const replaceApiKeyLabelId = useId();
  const apiKeyId = useId();
  const apiKeyLabelId = useId();
  const temperatureId = useId();
  const temperatureLabelId = useId();
  const maxTokensId = useId();
  const maxTokensLabelId = useId();
  const topPId = useId();
  const topPLabelId = useId();
  const enabledId = useId();
  const enabledLabelId = useId();
  const [displayName, setDisplayName] = useState(initial?.displayName ?? "");
  const [provider, setProvider] = useState<LlmProvider>(initial?.provider ?? "openai");
  const [model, setModel] = useState(initial?.model ?? DEFAULT_MODELS.openai);
  const [openaiEndpointMode, setOpenaiEndpointMode] = useState<OpenaiEndpointMode | null>(
    initial?.openaiEndpointMode ?? "responses",
  );
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [temperature, setTemperature] = useState(
    getNumberSetting(initial?.defaultGenerationSettings, "temperature", DEFAULT_TEMPERATURE),
  );
  const [maxTokens, setMaxTokens] = useState(
    getNumberSetting(initial?.defaultGenerationSettings, "maxTokens", DEFAULT_MAX_TOKENS),
  );
  const [topP, setTopP] = useState(
    getNumberSetting(initial?.defaultGenerationSettings, "topP", DEFAULT_TOP_P),
  );

  const isEditing = Boolean(initial);
  const isSaveDisabled =
    isPending ||
    displayName.trim().length === 0 ||
    model.trim().length === 0 ||
    (!isEditing && apiKeySecret.trim().length === 0);

  function handleProviderChange(nextProvider: LlmProvider) {
    setProvider(nextProvider);
    setModel(DEFAULT_MODELS[nextProvider]);
    setOpenaiEndpointMode(nextProvider === "openai" ? "responses" : null);
  }

  function handleSave() {
    const generationSettings = buildGenerationSettings(temperature, maxTokens, topP);

    if (initial) {
      const payload: LlmConfigUpdate = {
        displayName: displayName.trim(),
        model: model.trim(),
        openaiEndpointMode: provider === "openai" ? openaiEndpointMode ?? "responses" : null,
        enabled,
        defaultGenerationSettings: generationSettings,
      };

      if (apiKeySecret.trim().length > 0) {
        payload.apiKeySecret = apiKeySecret.trim();
      }

      onSave(payload);
      return;
    }

    const payload: LlmConfigWrite = {
      provider,
      displayName: displayName.trim(),
      model: model.trim(),
      apiKeySecret: apiKeySecret.trim(),
      enabled,
      defaultGenerationSettings: generationSettings,
      openaiEndpointMode: provider === "openai" ? openaiEndpointMode ?? "responses" : null,
    };

    onSave(payload);
  }

  return (
    <div className="space-y-4">
      <div>
        <Label id={displayNameLabelId} htmlFor={displayNameId}>Display Name</Label>
        <Input
          aria-label="Display Name"
          aria-labelledby={displayNameLabelId}
          id={displayNameId}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Config name"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label id={providerLabelId} htmlFor={providerId}>Provider</Label>
          <Select value={provider} onValueChange={handleProviderChange} disabled={isPending || isEditing}>
            <SelectTrigger aria-label="Provider" aria-labelledby={providerLabelId} id={providerId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label id={modelLabelId} htmlFor={modelId}>Model</Label>
          <Input
            aria-label="Model"
            aria-labelledby={modelLabelId}
            id={modelId}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
            disabled={isPending}
          />
        </div>
      </div>

      {provider === "openai" ? (
        <div>
          <Label id={openaiEndpointModeLabelId} htmlFor={openaiEndpointModeId}>OpenAI Endpoint Mode</Label>
          <Select
            value={openaiEndpointMode ?? "responses"}
            onValueChange={(value) => setOpenaiEndpointMode(value as OpenaiEndpointMode)}
            disabled={isPending}
          >
            <SelectTrigger aria-label="OpenAI Endpoint Mode" aria-labelledby={openaiEndpointModeLabelId} id={openaiEndpointModeId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OPENAI_ENDPOINT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {initial ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label>API Key</Label>
              <p className="text-xs text-muted-foreground">Stored secrets are write-only.</p>
            </div>
            <Badge variant={initial.hasApiKey ? "secondary" : "outline"}>
              {initial.hasApiKey ? "API key set" : "No API key stored"}
            </Badge>
          </div>
          <div>
            <Label id={replaceApiKeyLabelId} htmlFor={replaceApiKeyId}>Replace API Key</Label>
            <Input
              aria-label="Replace API Key"
              aria-labelledby={replaceApiKeyLabelId}
              id={replaceApiKeyId}
              type="password"
              value={apiKeySecret}
              onChange={(event) => setApiKeySecret(event.target.value)}
              placeholder="Leave blank to keep the current key"
              disabled={isPending}
            />
          </div>
        </div>
      ) : (
        <div>
          <Label id={apiKeyLabelId} htmlFor={apiKeyId}>API Key</Label>
          <Input
            aria-label="API Key"
            aria-labelledby={apiKeyLabelId}
            id={apiKeyId}
            type="password"
            value={apiKeySecret}
            onChange={(event) => setApiKeySecret(event.target.value)}
            placeholder="Paste provider API key"
            disabled={isPending}
          />
        </div>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <div>
          <Label>Default Generation Settings</Label>
          <p className="text-xs text-muted-foreground">
            Temperature, max tokens, and top P are saved inside
            {" "}
            <code className="rounded bg-muted px-1">defaultGenerationSettings</code>.
          </p>
        </div>

        <div>
          <Label id={temperatureLabelId} htmlFor={temperatureId}>Temperature: {temperature.toFixed(2)}</Label>
          <Slider
            aria-label="Temperature"
            aria-labelledby={temperatureLabelId}
            id={temperatureId}
            min={0}
            max={2}
            step={0.01}
            value={[temperature]}
            onValueChange={([value]) => setTemperature(value ?? DEFAULT_TEMPERATURE)}
            className="mt-2"
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label id={maxTokensLabelId} htmlFor={maxTokensId}>Max Tokens</Label>
            <Input
              aria-label="Max Tokens"
              aria-labelledby={maxTokensLabelId}
              id={maxTokensId}
              type="number"
              min={1}
              value={maxTokens}
              onChange={(event) => setMaxTokens(Number.parseInt(event.target.value, 10) || 0)}
              disabled={isPending}
            />
          </div>

          <div>
            <Label id={topPLabelId} htmlFor={topPId}>Top P: {topP.toFixed(2)}</Label>
            <Slider
              aria-label="Top P"
              aria-labelledby={topPLabelId}
              id={topPId}
              min={0}
              max={1}
              step={0.01}
              value={[topP]}
              onValueChange={([value]) => setTopP(value ?? DEFAULT_TOP_P)}
              className="mt-2"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label id={enabledLabelId} htmlFor={enabledId}>Enabled</Label>
          <p className="text-xs text-muted-foreground">Disabled configs stay in the library but cannot be selected.</p>
        </div>
        <Switch aria-label="Enabled" aria-labelledby={enabledLabelId} id={enabledId} checked={enabled} onCheckedChange={setEnabled} disabled={isPending} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaveDisabled}>
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Save
        </Button>
      </div>
    </div>
  );
}

export function LLMConfigs() {
  const {
    data: configItems = [],
    error,
    isLoading,
  } = useLlmConfigs();
  const createMutation = useCreateLlmConfig();
  const updateMutation = useUpdateLlmConfig();
  const deleteMutation = useDeleteLlmConfig();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LlmConfigRead | null>(null);
  const configs = useMemo(
    () => [...configItems].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [configItems],
  );

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error, "Failed to load configurations"));
    }
  }, [error]);

  function handleDelete(configId: string) {
    deleteMutation.mutate(configId, {
      onError: (mutationError) => {
        toast.error(getErrorMessage(mutationError, "Failed to delete configuration"));
      },
      onSuccess: () => {
        toast.success("Configuration deleted");
      },
    });
  }

  function handleSave(data: LlmConfigUpdate | LlmConfigWrite) {
    if (editing) {
      updateMutation.mutate(
        { configId: editing.id, data: data as LlmConfigUpdate },
        {
          onError: (mutationError) => {
            toast.error(getErrorMessage(mutationError, "Failed to update configuration"));
          },
          onSuccess: () => {
            toast.success("Configuration updated");
            setShowForm(false);
            setEditing(null);
          },
        },
      );

      return;
    }

    createMutation.mutate(data as LlmConfigWrite, {
      onError: (mutationError) => {
        toast.error(getErrorMessage(mutationError, "Failed to create configuration"));
      },
      onSuccess: () => {
        toast.success("Configuration created");
        setShowForm(false);
      },
    });
  }

  return (
    <div className="max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-tight">LLM Configurations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage model configurations for stock analysis
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          disabled={isMutating}
        >
          <Plus className="mr-1 size-4" /> New Config
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading configurations...
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && error && configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Unable to load configurations right now.
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !error && configs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No configurations yet. Create one to connect your model provider.
            </CardContent>
          </Card>
        ) : null}

        {!isLoading
          ? configs.map((config) => {
              const temperature = getNumberSetting(
                config.defaultGenerationSettings,
                "temperature",
                DEFAULT_TEMPERATURE,
              );
              const maxTokens = getNumberSetting(
                config.defaultGenerationSettings,
                "maxTokens",
                DEFAULT_MAX_TOKENS,
              );
              const topP = getNumberSetting(config.defaultGenerationSettings, "topP", DEFAULT_TOP_P);

              return (
                <Card key={config.id}>
                  <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                        <Settings2 className="size-4" />
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{config.displayName}</CardTitle>
                          <Badge variant="secondary">{PROVIDER_LABELS[config.provider]}</Badge>
                          <Badge variant="outline">{config.model}</Badge>
                          <Badge variant={config.enabled ? "secondary" : "outline"}>
                            {config.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          {config.provider === "openai" && config.openaiEndpointMode ? (
                            <Badge variant="outline">
                              {OPENAI_ENDPOINT_LABELS[config.openaiEndpointMode]}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>Temp: {temperature.toFixed(2)}</span>
                          <span>Tokens: {maxTokens}</span>
                          <span>Top P: {topP.toFixed(2)}</span>
                          <span>API key {config.hasApiKey ? "set" : "missing"}</span>
                          <span>Updated {config.updatedAt}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 self-start lg:self-center">
                      <Button
                        aria-label={`Edit configuration ${config.displayName}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(config);
                          setShowForm(true);
                        }}
                        disabled={isMutating}
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        aria-label={`Delete configuration ${config.displayName}`}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                        disabled={isMutating}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          : null}
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (isMutating) {
            return;
          }

          setShowForm(open);

          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Configuration" : "New Configuration"}</DialogTitle>
          </DialogHeader>
          <ConfigForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            isPending={createMutation.isPending || updateMutation.isPending}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
