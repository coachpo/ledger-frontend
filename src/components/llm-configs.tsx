import { useEffect, useMemo, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateLlmConfig,
  useDeleteLlmConfig,
  useLlmConfigs,
  useUpdateLlmConfig,
} from "@/hooks/use-llm-configs";
import { ApiRequestError } from "@/lib/api";
import type { LlmConfigRead, LlmConfigUpdate, LlmConfigWrite } from "@/lib/api-types";


import { LLMConfigForm } from "@/components/forms/llm-config-form";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError || error instanceof Error) {
    return error.message;
  }

  return fallback;
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

  function handleDelete(configId: number) {
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
            Manage model configurations for stock analysis.
          </p>
        </div>
        <Button
          disabled={isMutating}
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
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
                          <Badge variant="outline">{config.model}</Badge>
                          <Badge variant={config.enabled ? "secondary" : "outline"}>
                            {config.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span>API key {config.hasApiKey ? "set" : "missing"}</span>
                          {config.baseUrl ? <span>Base URL: {config.baseUrl}</span> : null}
                          <span>Updated {config.updatedAt}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-label={`Open actions for configuration ${config.displayName}`}
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => {
                            setEditing(config);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          Edit configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleDelete(config.id)}
                          variant="destructive"
                        >
                          <Trash2 className="size-4" />
                          Delete configuration
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
          <LLMConfigForm
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
