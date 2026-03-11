import * as React from "react"
import {
  ArrowRight,
  CircleAlert,
  MoreHorizontal,
  ShieldAlert,
  Sparkles,
} from "lucide-react"

import { ApiRequestError, type MarketQuoteRead } from "@/lib/api"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FeedStatus } from "@/components/portfolios/model"

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="border-border/70 bg-background/90 shadow-sm backdrop-blur">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex size-8 items-center justify-center rounded-xl border border-emerald-700/10 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100">
            <Icon className="size-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-[var(--font-display)] text-3xl tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkspaceMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
  actionLabel,
  onAction,
}: {
  label: string
  value: string
  detail: string
  icon: React.ComponentType<{ className?: string }>
  tone: "authoritative" | "neutral" | "indicative"
  actionLabel: string
  onAction: () => void
}) {
  return (
    <Card
      className={cn(
                "border-border/80 shadow-sm",
                tone === "authoritative" && "bg-background/92",
                tone === "neutral" && "bg-background/88",
                tone === "indicative" && "bg-background/88",
      )}
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-xl border",
                tone === "authoritative" &&
                  "border-emerald-700/10 bg-emerald-600/10 text-emerald-900 dark:text-emerald-100",
                tone === "neutral" &&
                  "border-slate-950/8 bg-slate-950/5 text-slate-700 dark:text-slate-200",
                tone === "indicative" &&
                  "border-sky-900/10 bg-sky-900/8 text-sky-900 dark:text-sky-100",
              )}
            >
              <Icon className="size-4" />
            </div>
            <p className="truncate text-sm text-muted-foreground">{label}</p>
          </div>
          <Button className="rounded-full" onClick={onAction} size="xs" variant="ghost">
            {actionLabel}
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        <div className="space-y-1">
          <p className="font-[var(--font-display)] text-3xl tracking-tight text-foreground">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeedStatusBadge({
  status,
  className,
}: {
  status: FeedStatus
  className?: string
}) {
  const label =
    status === "unavailable"
      ? "Unavailable"
      : status === "stale"
        ? "Stale"
        : "Delayed"

  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]",
        status === "delayed" &&
          "border border-slate-950/10 bg-slate-950/90 text-white hover:bg-slate-950/90",
        status === "stale" &&
          "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10 dark:text-amber-100",
        status === "unavailable" &&
          "border border-slate-950/10 bg-background text-muted-foreground hover:bg-background",
        className,
      )}
    >
      {label}
    </Badge>
  )
}

export function RowActionMenu({
  editLabel,
  onEdit,
  onDelete,
}: {
  editLabel: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full" size="icon-sm" variant="ghost">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open row actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={onEdit}>{editLabel}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} variant="destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function StatusCallout({
  title,
  children,
  details,
  tone = "info",
}: React.PropsWithChildren<{
  title: string
  details?: string[]
  tone?: "info" | "warning" | "error"
}>) {
  const Icon =
    tone === "error" ? ShieldAlert : tone === "warning" ? CircleAlert : Sparkles

  return (
    <Alert
      className={cn(
        "rounded-3xl border",
        tone === "error" && "border-destructive/30 bg-destructive/5",
        tone === "warning" &&
          "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100",
        tone === "info" && "border-emerald-700/15 bg-emerald-600/10",
      )}
      variant={tone === "error" ? "destructive" : "default"}
    >
      <Icon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{children}</p>
        {details && details.length > 0 ? (
          <ul className="list-disc space-y-1 pl-4 text-sm">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: React.PropsWithChildren<{
  icon: React.ComponentType<{ className?: string }>
  title: string
  action?: React.ReactNode
}>) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-8">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-sm">
        <Icon className="size-6 text-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-[var(--font-display)] text-3xl text-foreground">
          {title}
        </h3>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          {children}
        </p>
      </div>
      {action}
    </div>
  )
}

export function FieldErrorText({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-destructive">{message}</p>
}

export function normalizeOptionalText(value: string | undefined): string | null {
  const normalized = value?.trim() ?? ""
  return normalized.length > 0 ? normalized : null
}

export function getQuoteStatus(quote?: MarketQuoteRead | null): FeedStatus {
  if (!quote) {
    return "unavailable"
  }

  return quote.isStale ? "stale" : "delayed"
}

export function formatSignedCurrency(value: number, currency: string): string {
  if (value > 0) {
    return `+${formatCurrency(value, currency)}`
  }

  return formatCurrency(value, currency)
}

export function isNotFoundError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && error.code === "not_found"
}
