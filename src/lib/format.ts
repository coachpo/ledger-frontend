import { ApiRequestError } from "@/lib/api"

const currencyFormatterCache = new Map<string, Intl.NumberFormat>()
const compactCurrencyFormatterCache = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(
  currency: string,
  compact = false,
): Intl.NumberFormat {
  const cache = compact
    ? compactCurrencyFormatterCache
    : currencyFormatterCache
  const cacheKey = `${currency}:${compact}`

  const existing = cache.get(cacheKey)
  if (existing) {
    return existing
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  })

  cache.set(cacheKey, formatter)
  return formatter
}

export function decimalToNumber(
  value: string | number | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 0
  }

  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatCurrency(
  value: string | number | null | undefined,
  currency = "USD",
): string {
  return getCurrencyFormatter(currency).format(decimalToNumber(value))
}

export function formatCompactCurrency(
  value: string | number | null | undefined,
  currency = "USD",
): string {
  return getCurrencyFormatter(currency, true).format(decimalToNumber(value))
}

export function formatDecimal(
  value: string | number | null | undefined,
  maximumFractionDigits = 4,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(decimalToNumber(value))
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value))
}

export function toLocalDateTimeValue(value?: string | null): string {
  const date = value ? new Date(value) : new Date()
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export function fromLocalDateTimeValue(value: string): string {
  return new Date(value).toISOString()
}

export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return count === 1 ? singular : plural
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Something went wrong. Please try again."
}

export function getErrorDetails(error: unknown): string[] {
  if (error instanceof ApiRequestError) {
    return error.details.map((detail) => {
      const prefix = detail.row ? `Row ${detail.row}: ` : ""
      const field = detail.field ? `${detail.field} - ` : ""
      return `${prefix}${field}${detail.issue}`
    })
  }

  return []
}
