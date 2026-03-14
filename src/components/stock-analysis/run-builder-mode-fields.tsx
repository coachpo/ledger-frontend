import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  compareInputOverride: string;
  compareInstructionsOverride: string;
  compareToOrigin: boolean;
  disabled: boolean;
  freshInputOverride: string;
  freshInstructionsOverride: string;
  inputText: string;
  instructionsText: string;
  isSinglePrompt: boolean;
  onCompareInputOverrideChange: (value: string) => void;
  onCompareInstructionsOverrideChange: (value: string) => void;
  onCompareToOriginChange: (value: boolean) => void;
  onFreshInputOverrideChange: (value: string) => void;
  onFreshInstructionsOverrideChange: (value: string) => void;
  onInputTextChange: (value: string) => void;
  onInstructionsTextChange: (value: string) => void;
};

export function RunBuilderModeFields({
  compareInputOverride,
  compareInstructionsOverride,
  compareToOrigin,
  disabled,
  freshInputOverride,
  freshInstructionsOverride,
  inputText,
  instructionsText,
  isSinglePrompt,
  onCompareInputOverrideChange,
  onCompareInstructionsOverrideChange,
  onCompareToOriginChange,
  onFreshInputOverrideChange,
  onFreshInstructionsOverrideChange,
  onInputTextChange,
  onInstructionsTextChange,
}: Props) {
  if (isSinglePrompt) {
    return (
      <div className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Instructions</Label>
          <Textarea value={instructionsText} onChange={(event) => onInstructionsTextChange(event.target.value)} rows={10} className="font-mono text-sm" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Input</Label>
          <Textarea value={inputText} onChange={(event) => onInputTextChange(event.target.value)} rows={10} className="font-mono text-sm" disabled={disabled} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>Fresh Instructions</Label>
          <Textarea value={freshInstructionsOverride} onChange={(event) => onFreshInstructionsOverrideChange(event.target.value)} rows={8} className="font-mono text-sm" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Fresh Input</Label>
          <Textarea value={freshInputOverride} onChange={(event) => onFreshInputOverrideChange(event.target.value)} rows={8} className="font-mono text-sm" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Compare Instructions</Label>
          <Textarea value={compareInstructionsOverride} onChange={(event) => onCompareInstructionsOverrideChange(event.target.value)} rows={8} className="font-mono text-sm" disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Compare Input</Label>
          <Textarea value={compareInputOverride} onChange={(event) => onCompareInputOverrideChange(event.target.value)} rows={8} className="font-mono text-sm" disabled={disabled} />
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-border/70 p-4">
        <Checkbox checked={compareToOrigin} onCheckedChange={(checked) => onCompareToOriginChange(checked === true)} />
        <div className="space-y-1">
          <p className="text-sm font-medium">Compare to origin thesis</p>
          <p className="text-xs text-muted-foreground">Include the original thesis context during the compare-and-reflect step.</p>
        </div>
      </label>
    </div>
  );
}
