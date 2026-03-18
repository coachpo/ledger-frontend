import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Save,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Eye,
  Code2,
  Braces,
  FileOutput,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useCompileReport } from "@/hooks/use-reports";
import { useDebounce } from "@/hooks/use-debounce";

export function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(templateId);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [placeholdersOpen, setPlaceholdersOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: template, isLoading: isLoadingTemplate } = useTemplate(templateId);
  const { data: placeholderTree, isLoading: isLoadingPlaceholders } = usePlaceholders();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const { mutate: compileInline, ...compileMutation } = useCompileInline();
  const compileReportMutation = useCompileReport();

  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
    }
  }, [template]);

  useEffect(() => {
    if (debouncedContent) {
      compileInline(debouncedContent);
    }
  }, [compileInline, debouncedContent]);

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
    } catch {
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

  const handleGenerateReport = () => {
    if (!templateId) return;

    compileReportMutation.mutate(templateId, {
      onError: () => toast.error("Failed to generate report"),
      onSuccess: (report) => {
        toast.success(`Report "${report.name}" generated`, {
          action: {
            label: "View",
            onClick: () => navigate(`/reports/${report.id}`),
          },
        });
      },
    });
  };

  if (isEditing && isLoadingTemplate) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isGenerating = compileReportMutation.isPending;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Code2 className="h-3 w-3" />
          <span>{isEditing ? "Edit" : "New"}</span>
        </div>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name…"
          className="h-9 min-w-[16rem] max-w-lg border-border/70 bg-background px-3 text-sm font-medium shadow-none focus-visible:ring-1"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-3 text-sm"
            onClick={() => setPlaceholdersOpen((o) => !o)}
          >
            <Braces className="h-3 w-3" />
            Vars
          </Button>
          <Separator orientation="vertical" className="h-5" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-sm"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 px-3.5 text-sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save
          </Button>
          {isEditing && templateId ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 px-3.5 text-sm"
              onClick={handleGenerateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileOutput className="h-3 w-3" />
              )}
              Generate Report
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 gap-1.5 px-3.5 text-sm"
              disabled
            >
              <FileOutput className="h-3 w-3" />
              Generate Report
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <div className="flex min-h-0 flex-col lg:border-r lg:border-border">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <Code2 className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Editor
            </span>
            <span className="ml-auto text-[10px] text-muted-foreground">
              Markdown + {"{{placeholders}}"}
            </span>
          </div>
          <div className="relative min-h-0 flex-1">
            <textarea
              id="content"
              ref={textareaRef}
              className="h-full w-full resize-none border-none bg-background px-4 py-3 font-mono text-sm leading-7 text-foreground placeholder:text-muted-foreground focus:outline-none"
              placeholder="Enter template content…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
            <Eye className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Preview
            </span>
            {compileMutation.isPending && (
              <Loader2 className="ml-auto h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="min-h-full bg-muted/30 px-4 py-3">
              {compileMutation.error ? (
                <div className="rounded border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                  {compileMutation.error instanceof Error
                    ? compileMutation.error.message
                    : "Compile error"}
                </div>
              ) : compileMutation.data ? (
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                  {compileMutation.data.compiled}
                </pre>
              ) : (
                <div className="flex items-center justify-center py-12 text-xs italic text-muted-foreground">
                  {content ? "Compiling…" : "Enter content to see preview"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {placeholdersOpen && (
        <div className="border-t border-border">
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2">
            <Braces className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Placeholder Reference
            </span>
            {isLoadingPlaceholders && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-5 w-5"
              onClick={() => setPlaceholdersOpen(false)}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
            <ScrollArea className="h-[220px] lg:h-[240px]">
              <div className="flex flex-wrap gap-x-8 gap-y-1 px-4 py-2">
              <PlaceholderGroup
                title="Portfolio"
                items={[
                  { path: "portfolios", type: "list" },
                  { path: "portfolios.<slug>", type: "object" },
                  { path: "portfolios.<slug>.name", type: "string" },
                  { path: "portfolios.<slug>.description", type: "string" },
                  { path: "portfolios.<slug>.base_currency", type: "string" },
                  { path: "portfolios.<slug>.position_count", type: "number" },
                  { path: "portfolios.<slug>.balance_count", type: "number" },
                  { path: "portfolios.<slug>.total_value", type: "number" },
                  { path: "portfolios.<slug>.unrealized_pnl", type: "number" },
                  { path: "portfolios.<slug>.created_at", type: "datetime" },
                  { path: "portfolios.<slug>.updated_at", type: "datetime" },
                ]}
                onInsert={insertPlaceholder}
              />
              <PlaceholderGroup
                title="Balance"
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
                title="Position"
                items={[
                  { path: "portfolios.<slug>.positions", type: "list" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>", type: "object" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.quantity", type: "string" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.average_cost", type: "string" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.currency", type: "string" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.name", type: "string" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.market_value", type: "number" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.unrealized_pnl", type: "number" },
                  { path: "portfolios.<slug>.positions.<SYMBOL>.unrealized_pnl_percent", type: "number" },
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
        </div>
      )}
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="min-w-[260px]">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-1 py-1 text-left text-xs font-medium text-foreground hover:text-primary">
          {isOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          {title}
          <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
            {items.length}
          </Badge>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col pb-1 pl-4">
        {items.map((item) => (
          <div
            key={item.path}
            className="group flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 hover:bg-accent"
            onClick={() => onInsert(item.path)}
          >
            <code className="flex-1 truncate text-[11px] text-primary">{item.path}</code>
            <Badge variant="outline" className="h-3.5 shrink-0 px-1 text-[8px] uppercase leading-none">
              {item.type}
            </Badge>
            <Copy className="h-2.5 w-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
