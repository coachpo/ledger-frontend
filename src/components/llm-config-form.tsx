import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  llmConfigCreateFormSchema,
  llmConfigUpdateFormSchema,
  type LlmConfigCreateFormValues,
} from "@/components/form-schemas";
import type {
  LlmConfigRead,
  LlmConfigUpdate,
  LlmConfigWrite,
} from "@/lib/api-types";
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
import { Switch } from "@/components/ui/switch";

function getDefaultValues(initial?: LlmConfigRead): LlmConfigCreateFormValues {
  return {
    apiKeySecret: "",
    baseUrl: initial?.baseUrl ?? "",
    displayName: initial?.displayName ?? "",
    enabled: initial?.enabled ?? true,
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
  const form = useForm<LlmConfigCreateFormValues>({
    defaultValues: getDefaultValues(initial),
    mode: "onChange",
    resolver: zodResolver(isEditing ? llmConfigUpdateFormSchema : llmConfigCreateFormSchema),
  });

  useEffect(() => {
    form.reset(getDefaultValues(initial));
  }, [form, initial]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) => {
          if (initial) {
            const payload: LlmConfigUpdate = {
              baseUrl: values.baseUrl?.trim() || null,
              displayName: values.displayName.trim(),
              enabled: values.enabled,
            };

            if (values.apiKeySecret.trim()) {
              payload.apiKeySecret = values.apiKeySecret.trim();
            }

            onSave(payload);
            return;
          }

          onSave({
            apiKeySecret: values.apiKeySecret.trim(),
            baseUrl: values.baseUrl?.trim() || null,
            displayName: values.displayName.trim(),
            enabled: values.enabled,
            model: "gpt-5.4",
            openaiEndpointMode: "responses",
            provider: "openai",
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

        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL (Optional)</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} placeholder="https://api.openai.com/v1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {initial ? (
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
                    placeholder="Leave blank to keep the current key"
                    type="password"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {initial.hasApiKey ? "API key is set" : "No API key stored"}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
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
