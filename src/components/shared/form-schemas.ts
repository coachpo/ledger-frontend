import { z } from "zod";

import type { PromptTemplateMode } from "@/lib/types/prompt";
import type { StockAnalysisRunMode, StockAnalysisRunType } from "@/lib/types/stock-analysis";
import type { TradingSide } from "@/lib/types/trading";

const promptTemplateModes = ["single", "two_step"] as const satisfies readonly PromptTemplateMode[];
const tradingSides = ["BUY", "SELL", "DIVIDEND", "SPLIT"] as const satisfies readonly TradingSide[];
const stockAnalysisRunModes = ["single_prompt", "two_step_workflow"] as const satisfies readonly StockAnalysisRunMode[];
const stockAnalysisRunTypes = [
  "initial_review",
  "periodic_review",
  "event_review",
  "manual_follow_up",
] as const satisfies readonly StockAnalysisRunType[];

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required`);

const numericText = (label: string) =>
  requiredText(label).refine((value) => Number.isFinite(Number(value)), {
    message: `${label} must be a valid number`,
  });

const optionalText = z.string();
const symbolText = requiredText("Symbol").transform((value) => value.toUpperCase());
const validDateTimeText = requiredText("Executed at").refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  "Executed at must be a valid date",
);

export const balanceFormSchema = z.object({
  amount: numericText("Amount"),
  label: requiredText("Label"),
});

export const portfolioCreateFormSchema = z.object({
  baseCurrency: z.string().trim().length(3, "Base currency must be a 3-letter code"),
  description: optionalText,
  name: requiredText("Name"),
});

export const portfolioUpdateFormSchema = z.object({
  description: optionalText,
  name: requiredText("Name"),
});

export const positionCreateFormSchema = z.object({
  averageCost: numericText("Average cost"),
  name: optionalText,
  quantity: numericText("Quantity"),
  symbol: symbolText,
});

export const positionUpdateFormSchema = z.object({
  averageCost: numericText("Average cost"),
  name: optionalText,
  quantity: numericText("Quantity"),
});

export const snippetFormSchema = z.object({
  content: requiredText("Content"),
  description: optionalText,
  snippetId: requiredText("Snippet ID").refine(
    (value) => /^[A-Za-z0-9_]+$/.test(value),
    "Snippet ID may only contain letters, numbers, and underscores",
  ),
});

export const promptTemplateFormSchema = z
  .object({
    compareInputTemplate: optionalText,
    compareInstructionsTemplate: optionalText,
    description: optionalText,
    freshInputTemplate: optionalText,
    freshInstructionsTemplate: optionalText,
    inputTemplate: optionalText,
    instructionsTemplate: optionalText,
    name: requiredText("Name"),
    templateMode: z.enum(promptTemplateModes),
  })
  .superRefine((value, ctx) => {
    if (value.templateMode === "single") {
      if (!value.instructionsTemplate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Instructions template is required",
          path: ["instructionsTemplate"],
        });
      }

      if (!value.inputTemplate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Input template is required",
          path: ["inputTemplate"],
        });
      }

      return;
    }

    if (!value.freshInstructionsTemplate.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fresh instructions template is required",
        path: ["freshInstructionsTemplate"],
      });
    }

    if (!value.freshInputTemplate.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fresh input template is required",
        path: ["freshInputTemplate"],
      });
    }

    if (!value.compareInstructionsTemplate.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compare instructions template is required",
        path: ["compareInstructionsTemplate"],
      });
    }

    if (!value.compareInputTemplate.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compare input template is required",
        path: ["compareInputTemplate"],
      });
    }
  });

export const tradingOperationFormSchema = z
  .object({
    balanceId: requiredText("Balance"),
    commission: optionalText,
    dividendAmount: optionalText,
    executedAt: validDateTimeText,
    price: optionalText,
    quantity: optionalText,
    side: z.enum(tradingSides),
    splitRatio: optionalText,
    symbol: symbolText,
  })
  .superRefine((value, ctx) => {
    if (value.side === "BUY" || value.side === "SELL") {
      if (!value.quantity.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantity is required",
          path: ["quantity"],
        });
      } else if (!Number.isFinite(Number(value.quantity))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Quantity must be a valid number",
          path: ["quantity"],
        });
      }

      if (!value.price.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price is required",
          path: ["price"],
        });
      } else if (!Number.isFinite(Number(value.price))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be a valid number",
          path: ["price"],
        });
      }

      return;
    }

    if (value.side === "DIVIDEND") {
      if (!value.dividendAmount.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dividend amount is required",
          path: ["dividendAmount"],
        });
      } else if (!Number.isFinite(Number(value.dividendAmount))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dividend amount must be a valid number",
          path: ["dividendAmount"],
        });
      }

      return;
    }

    if (!value.splitRatio.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Split ratio is required",
        path: ["splitRatio"],
      });
    }
  });

export const llmConfigCreateFormSchema = z.object({
  apiKeySecret: requiredText("API key"),
  baseUrl: optionalText,
  displayName: requiredText("Display name"),
  enabled: z.boolean(),
});

export const llmConfigUpdateFormSchema = z.object({
  apiKeySecret: optionalText,
  baseUrl: optionalText,
  displayName: requiredText("Display name"),
  enabled: z.boolean(),
});

export const conversationFormSchema = z.object({
  nextReviewAt: optionalText.refine(
    (value) => value.length === 0 || !Number.isNaN(new Date(value).getTime()),
    "Next review must be a valid date",
  ),
  reviewCadence: optionalText,
  symbol: symbolText,
  title: optionalText,
});

export const runBuilderFormSchema = z
  .object({
    compareInputOverride: optionalText,
    compareInstructionsOverride: optionalText,
    compareToOrigin: z.boolean(),
    freshInputOverride: optionalText,
    freshInstructionsOverride: optionalText,
    inputText: optionalText,
    instructionsText: optionalText,
    llmConfigId: requiredText("LLM configuration"),
    mode: z.enum(stockAnalysisRunModes),
    promptTemplateId: optionalText,
    reviewTrigger: optionalText,
    runType: z.enum(stockAnalysisRunTypes),
    userNote: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.promptTemplateId.trim()) {
      return;
    }

    if (value.mode === "single_prompt") {
      if (!value.instructionsText.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Instructions are required unless you choose a saved template",
          path: ["instructionsText"],
        });
      }

      if (!value.inputText.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Input is required unless you choose a saved template",
          path: ["inputText"],
        });
      }

      return;
    }

    if (!value.freshInstructionsOverride.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fresh instructions are required unless you choose a saved template",
        path: ["freshInstructionsOverride"],
      });
    }

    if (!value.freshInputOverride.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fresh input is required unless you choose a saved template",
        path: ["freshInputOverride"],
      });
    }

    if (!value.compareInstructionsOverride.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compare instructions are required unless you choose a saved template",
        path: ["compareInstructionsOverride"],
      });
    }

    if (!value.compareInputOverride.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Compare input is required unless you choose a saved template",
        path: ["compareInputOverride"],
      });
    }
  });

export type BalanceFormValues = z.infer<typeof balanceFormSchema>;
export type PortfolioCreateFormValues = z.infer<typeof portfolioCreateFormSchema>;
export type PortfolioUpdateFormValues = z.infer<typeof portfolioUpdateFormSchema>;
export type PositionCreateFormValues = z.infer<typeof positionCreateFormSchema>;
export type PositionUpdateFormValues = z.infer<typeof positionUpdateFormSchema>;
export type SnippetFormValues = z.infer<typeof snippetFormSchema>;
export type PromptTemplateFormValues = z.infer<typeof promptTemplateFormSchema>;
export type TradingOperationFormValues = z.infer<typeof tradingOperationFormSchema>;
export type LlmConfigCreateFormValues = z.infer<typeof llmConfigCreateFormSchema>;
export type LlmConfigUpdateFormValues = z.infer<typeof llmConfigUpdateFormSchema>;
export type ConversationFormValues = z.infer<typeof conversationFormSchema>;
export type RunBuilderFormValues = z.infer<typeof runBuilderFormSchema>;
