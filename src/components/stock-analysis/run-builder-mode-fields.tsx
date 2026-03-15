import type { Control } from "react-hook-form";

import type { RunBuilderFormValues } from "@/components/shared/form-schemas";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  control: Control<RunBuilderFormValues>;
  disabled: boolean;
  isSinglePrompt: boolean;
};

export function RunBuilderModeFields({ control, disabled, isSinglePrompt }: Props) {
  if (isSinglePrompt) {
    return (
      <div className="grid gap-4 rounded-xl border border-border/70 p-4 lg:grid-cols-2">
        <FormField
          control={control}
          name="instructionsText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={disabled} rows={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="inputText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Input</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={disabled} rows={10} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/70 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <FormField
          control={control}
          name="freshInstructionsOverride"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fresh Instructions</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={disabled} rows={8} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="freshInputOverride"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fresh Input</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={disabled} rows={8} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="compareInstructionsOverride"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compare Instructions</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={disabled} rows={8} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="compareInputOverride"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compare Input</FormLabel>
              <FormControl>
                <Textarea {...field} className="font-mono text-sm" disabled={disabled} rows={8} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={control}
        name="compareToOrigin"
        render={({ field }) => (
          <FormItem className="rounded-xl border border-border/70 p-4">
            <label className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  disabled={disabled}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium">Compare to origin thesis</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Include the original thesis context during the compare-and-reflect step.
                </p>
              </div>
            </label>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
