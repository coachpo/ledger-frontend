import { z } from "zod"

import type { PositionRead } from "@/lib/api"

function isPositiveDecimal(value: string): boolean {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
}

function isNonNegativeDecimal(value: string): boolean {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
}

export const portfolioCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Keep the name under 100 characters"),
  description: z.string().trim().max(400, "Keep the description concise").optional(),
  baseCurrency: z.string().trim().length(3, "Use a 3-letter currency code"),
})

export const balanceSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60, "Keep the label under 60 characters"),
  amount: z.string().trim().min(1, "Amount is required").refine(isNonNegativeDecimal, "Amount must be greater than or equal to zero"),
})

export const positionCreateSchema = z.object({
  symbol: z.string().trim().min(1, "Symbol is required").max(32, "Symbol is too long"),
  name: z.string().trim().max(120, "Keep the name under 120 characters").optional(),
  quantity: z.string().trim().min(1, "Quantity is required").refine(isPositiveDecimal, "Quantity must be greater than zero"),
  averageCost: z.string().trim().min(1, "Average cost is required").refine(isNonNegativeDecimal, "Average cost must be greater than or equal to zero"),
})

// Base schema for all trading operations
const tradingOperationBaseSchema = z.object({
  balanceId: z.string().trim().min(1, "Choose a settlement balance"),
  symbol: z.string().trim().min(1, "Symbol is required").max(32, "Symbol is too long"),
  executedAt: z.string().trim().min(1, "Execution time is required"),
})
// BUY operation schema
const buyOperationSchema = tradingOperationBaseSchema.extend({
  side: z.literal("BUY"),
  quantity: z.string().trim().min(1, "Quantity is required").refine(isPositiveDecimal, "Quantity must be greater than zero"),
  price: z.string().trim().min(1, "Price is required").refine(isNonNegativeDecimal, "Price must be greater than or equal to zero"),
  commission: z.string().trim().min(1, "Commission is required").refine(isNonNegativeDecimal, "Commission must be greater than or equal to zero"),
})
// SELL operation schema
const sellOperationSchema = tradingOperationBaseSchema.extend({
  side: z.literal("SELL"),
  quantity: z.string().trim().min(1, "Quantity is required").refine(isPositiveDecimal, "Quantity must be greater than zero"),
  price: z.string().trim().min(1, "Price is required").refine(isNonNegativeDecimal, "Price must be greater than or equal to zero"),
  commission: z.string().trim().min(1, "Commission is required").refine(isNonNegativeDecimal, "Commission must be greater than or equal to zero"),
})
// DIVIDEND operation schema
const dividendOperationSchema = tradingOperationBaseSchema.extend({
  side: z.literal("DIVIDEND"),
  dividendAmount: z.string().trim().min(1, "Dividend amount is required").refine(isPositiveDecimal, "Dividend amount must be greater than zero"),
  commission: z.string().trim().optional().refine((val) => !val || isNonNegativeDecimal(val), "Commission must be greater than or equal to zero"),
})
// SPLIT operation schema
const splitOperationSchema = tradingOperationBaseSchema.extend({
  side: z.literal("SPLIT"),
  splitRatio: z.string().trim().min(1, "Split ratio is required").refine(isPositiveDecimal, "Split ratio must be greater than zero"),
})
// Discriminated union for all operation types
export const tradingOperationSchema = z.discriminatedUnion("side", [
  buyOperationSchema,
  sellOperationSchema,
  dividendOperationSchema,
  splitOperationSchema,
])

export type WorkspaceTab = "overview" | "positions" | "balances" | "simulation-log" | "quotes"
export type PositionFilter = "all" | "quoted" | "unquoted"
export type PositionSort = "largest" | "symbol" | "updated"
export type FeedStatus = "delayed" | "stale" | "unavailable"

export interface PositionTableRow extends PositionRead {
  bookValue: number
  indicativePrice: number | null
  indicativeValue: number | null
  quoteStatus: FeedStatus
}

export const BASE_CURRENCY_OPTIONS = ["USD", "CNY", "HKD", "EUR", "GBP", "CAD"]
