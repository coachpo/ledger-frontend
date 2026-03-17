import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import {
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useCompileInline,
  usePlaceholders,
} from "@/hooks/use-templates";
import { useDebounce } from "@/hooks/use-debounce";

export function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(templateId);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: template, isLoading: isLoadingTemplate } = useTemplate(templateId);
  const { data: placeholderTree, isLoading: isLoadingPlaceholders } = usePlaceholders();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const compileMutation = useCompileInline();

  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
    }
  }, [template]);

  useEffect(() => {
    if (debouncedContent) {
      compileMutation.mutate(debouncedContent);
    }
  }, [debouncedContent]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    try {
      if (isEditing && templateId) {
        await updateMutation.mutateAsync({
          templateId,
          data: { name, content },
        });
        toast.success("Template updated successfully");
      } else {
        const newTemplate = await createMutation.mutateAsync({ name, content });
        toast.success("Template created successfully");
        navigate(`/templates/${newTemplate.id}/edit`);
      }
    } catch (error) {
      toast.error("Failed to save template");
    }
  };

  const insertPlaceholder = (placeholder: string) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newContent = `${before}{{${placeholder}}}${after}`;

    setContent(newContent);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = start + placeholder.length + 4;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  if (isEditing && isLoadingTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Edit Template" : "New Template"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Template name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  ref={textareaRef}
                  className="min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter template content (Markdown supported)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Placeholder Reference</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="flex flex-col p-4 gap-4">
                  <PlaceholderGroup
                    title="Portfolio Fields"
                    items={[
                      { path: "portfolios", type: "list" },
                      { path: "portfolios.<slug>", type: "object" },
                      { path: "portfolios.<slug>.name", type: "string" },
                      { path: "portfolios.<slug>.description", type: "string" },
                      { path: "portfolios.<slug>.base_currency", type: "string" },
                      { path: "portfolios.<slug>.position_count", type: "number" },
                      { path: "portfolios.<slug>.balance_count", type: "number" },
                      { path: "portfolios.<slug>.created_at", type: "datetime" },
                      { path: "portfolios.<slug>.updated_at", type: "datetime" },
                    ]}
                    onInsert={insertPlaceholder}
                  />
                  <PlaceholderGroup
                    title="Balance Fields"
                    items={[
                      { path: "portfolios.<slug>.balance", type: "object" },
                      { path: "portfolios.<slug>.balance.label", type: "string" },
                      { path: "portfolios.<slug>.balance.amount", type: "string" },
                      { path: "portfolios.<slug>.balance.operation_type", type: "string" },
                      { path: "portfolios.<slug>.balance.currency", type: "string" },
                    ]}
                    onInsert={insertPlaceholder}
                  />
                  <PlaceholderGroup
                    title="Position Fields"
                    items={[
                      { path: "portfolios.<slug>.positions", type: "list" },
                      { path: "portfolios.<slug>.positions.<SYMBOL>", type: "object" },
                      { path: "portfolios.<slug>.positions.<SYMBOL>.quantity", type: "string" },
                      { path: "portfolios.<slug>.positions.<SYMBOL>.average_cost", type: "string" },
                      { path: "portfolios.<slug>.positions.<SYMBOL>.currency", type: "string" },
                      { path: "portfolios.<slug>.positions.<SYMBOL>.name", type: "string" },
                    ]}
                    onInsert={insertPlaceholder}
                  />

                  {placeholderTree?.portfolios.map((p) => (
                    <PlaceholderGroup
                      key={p.slug}
                      title={p.name}
                      items={[
                        { path: `portfolios.${p.slug}`, type: "object" },
                        ...p.positions.map((pos) => ({
                          path: `portfolios.${p.slug}.positions.${pos.symbol}`,
                          type: "object",
                        })),
                      ]}
                      onInsert={insertPlaceholder}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Live Preview
                {compileMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {compileMutation.error ? (
                  <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
                    Failed to compile template: {compileMutation.error instanceof Error ? compileMutation.error.message : "Unknown error"}
                  </div>
                ) : compileMutation.data ? (
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {compileMutation.data.compiled}
                  </pre>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground italic">
                    {content ? "Compiling..." : "Enter content to see preview"}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface PlaceholderItem {
  path: string;
  type: string;
}

interface PlaceholderGroupProps {
  title: string;
  items: PlaceholderItem[];
  onInsert: (path: string) => void;
}

function PlaceholderGroup({ title, items, onInsert }: PlaceholderGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between p-2 hover:bg-accent"
        >
          <span className="font-semibold">{title}</span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1 pl-4 pt-1">
        {items.map((item) => (
          <div
            key={item.path}
            className="flex items-center justify-between rounded-md p-2 hover:bg-accent cursor-pointer group"
            onClick={() => onInsert(item.path)}
          >
            <code className="text-xs text-primary">{item.path}</code>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase">
                {item.type}
              </Badge>
              <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
