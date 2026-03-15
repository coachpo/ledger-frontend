import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODELS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
  getNumberSetting,
  OPENAI_ENDPOINT_LABELS,
  PROVIDER_LABELS,
} from "@/components/llm-config-form.constants";
import {
  llmConfigCreateFormSchema,
  llmConfigUpdateFormSchema,
  type LlmConfigCreateFormValues,
} from "@/components/form-schemas";
import type {
  LlmConfigRead,
  LlmConfigUpdate,
  LlmConfigWrite,
  LlmProvider,
  OpenaiEndpointMode,
  UnknownRecord,
} from "@/lib/api-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

function buildGenerationSettings(
  temperature: number,
  maxTokens: number,
  topP: number,
): UnknownRecord {
  return {
    maxTokens,
    temperature,
    topP,
  };
}

function getDefaultValues(initial?: LlmConfigRead): LlmConfigCreateFormValues {
  return {
    apiKeySecret: "",
    displayName: initial?.displayName ?? "",
    enabled: initial?.enabled ?? true,
    maxTokens: getNumberSetting(
      initial?.defaultGenerationSettings,
      "maxTokens",
      DEFAULT_MAX_TOKENS,
    ),
    model: initial?.model ?? DEFAULT_MODELS.openai,
    openaiEndpointMode: initial?.openaiEndpointMode ?? "responses",
    provider: initial?.provider ?? "openai",
    temperature: getNumberSetting(
      initial?.defaultGenerationSettings,
      "temperature",
      DEFAULT_TEMPERATURE,
    ),
    topP: getNumberSetting(initial?.defaultGenerationSettings, "topP", DEFAULT_TOP_P),
  };
}

type ConfigFormProps = {
  initial?: LlmConfigRead;
  isPending: boolean;
  onCancel: () => void;
  onSave: (data: LlmConfigUpdate | LlmConfigWrite) => void;
};

export function LLMConfigForm({
  initial,
  isPending,
  onCancel,
  onSave,
}: ConfigFormProps) {
  const isEditing = Boolean(initial);
  const providerOptions = Object.keys(PROVIDER_LABELS) as LlmProvider[];
  const openAiEndpointOptions = Object.keys(OPENAI_ENDPOINT_LABELS) as OpenaiEndpointMode[];
  const form = useForm<LlmConfigCreateFormValues>({
    defaultValues: getDefaultValues(initial),
    mode: "onChange",
    resolver: zodResolver(isEditing ? llmConfigUpdateFormSchema : llmConfigCreateFormSchema),
  });
  const provider = form.watch("provider") as LlmProvider;

  useEffect(() => {
    form.reset(getDefaultValues(initial));
  }, [form, initial]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          const generationSettings = buildGenerationSettings(
            values.temperature,
            values.maxTokens,
            values.topP,
          );

          if (initial) {
            const payload: LlmConfigUpdate = {
              defaultGenerationSettings: generationSettings,
              displayName: values.displayName.trim(),
              enabled: values.enabled,
              model: values.model.trim(),
              openaiEndpointMode: values.provider === "openai"
                ? values.openaiEndpointMode ?? "responses"
                : null,
            };

            if (values.apiKeySecret.trim()) {
              payload.apiKeySecret = values.apiKeySecret.trim();
            }

            onSave(payload);
            return;
          }

          onSave({
            apiKeySecret: values.apiKeySecret.trim(),
            defaultGenerationSettings: generationSettings,
            displayName: values.displayName.trim(),
            enabled: values.enabled,
            model: values.model.trim(),
            openaiEndpointMode: values.provider === "openai"
              ? values.openaiEndpointMode ?? "responses"
              : null,
            provider: values.provider,
          });
        })}
      >
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} placeholder="Config name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <Select
                  disabled={isPending || isEditing}
                  value={field.value}
                  onValueChange={(value) => {
                    const nextProvider = value as LlmProvider;
                    field.onChange(nextProvider);
                    form.setValue("model", DEFAULT_MODELS[nextProvider], {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue(
                      "openaiEndpointMode",
                      nextProvider === "openai" ? "responses" : null,
                      { shouldDirty: true, shouldValidate: true },
                    );
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {providerOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {PROVIDER_LABELS[value]}
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
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder={DEFAULT_MODELS[provider]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {provider === "openai" ? (
          <FormField
            control={form.control}
            name="openaiEndpointMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OpenAI Endpoint Mode</FormLabel>
                <Select
                  disabled={isPending}
                  value={field.value ?? "responses"}
                  onValueChange={(value) => field.onChange(value as OpenaiEndpointMode)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {openAiEndpointOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {OPENAI_ENDPOINT_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        {initial ? (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">API Key</p>
                <p className="text-xs text-muted-foreground">Stored secrets are write-only.</p>
              </div>
              <Badge variant={initial.hasApiKey ? "secondary" : "outline"}>
                {initial.hasApiKey ? "API key set" : "No API key stored"}
              </Badge>
            </div>
            <FormField
              control={form.control}
              name="apiKeySecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Replace API Key</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Leave blank to keep the current key"
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name="apiKeySecret"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    disabled={isPending}
                    placeholder="Paste provider API key"
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-3 rounded-lg border p-4">
          <div>
            <p className="text-sm font-medium">Default Generation Settings</p>
            <p className="text-xs text-muted-foreground">
              Temperature, max tokens, and top P are saved inside {" "}
              <code className="rounded bg-muted px-1">defaultGenerationSettings</code>.
            </p>
          </div>

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value.toFixed(2)}</FormLabel>
                <FormControl>
                  <Slider
                    disabled={isPending}
                    max={2}
                    min={0}
                    step={0.01}
                    value={[field.value]}
                    onValueChange={([value]) => field.onChange(value ?? DEFAULT_TEMPERATURE)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="maxTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Tokens</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isPending}
                      min={1}
                      type="number"
                      value={field.value}
                      onChange={(event) =>
                        field.onChange(Number.parseInt(event.target.value, 10) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topP"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top P: {field.value.toFixed(2)}</FormLabel>
                  <FormControl>
                    <Slider
                      disabled={isPending}
                      max={1}
                      min={0}
                      step={0.01}
                      value={[field.value]}
                      onValueChange={([value]) => field.onChange(value ?? DEFAULT_TOP_P)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <FormLabel>Enabled</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Disabled configs stay in the library but cannot be selected.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  disabled={isPending}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending || !form.formState.isValid} type="submit">
            {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
