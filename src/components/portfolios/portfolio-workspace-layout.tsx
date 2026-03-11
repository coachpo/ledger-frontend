import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeftRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  LineChart,
  Plus,
  ReceiptText,
  Trash2,
} from "lucide-react"
import {
  NavLink,
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom"
import { toast } from "sonner"

import { api } from "@/lib/api"
import {
  formatCompactCurrency,
  formatDateTime,
  getErrorMessage,
} from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { cn } from "@/lib/utils"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ConfirmDeleteDialog,
  PortfolioFormDialog,
} from "@/components/portfolios/dialogs"
import {
  EmptyState,
  FeedStatusBadge,
  StatusCallout,
  formatSignedCurrency,
  isNotFoundError,
} from "@/components/portfolios/shared"
import { usePortfolioWorkspaceData } from "@/components/portfolios/use-portfolio-workspace-data"

const navigationItems = [
  { icon: LayoutDashboard, label: "Overview", slug: "overview" },
  { icon: ArrowLeftRight, label: "Add Trade", slug: "trades/new" },
  { icon: ReceiptText, label: "History", slug: "transactions" },
  { icon: LineChart, label: "Analysis", slug: "analysis" },
]

export interface PortfolioWorkspaceContextValue
  extends ReturnType<typeof usePortfolioWorkspaceData> {
  isAmountsVisible: boolean
  toggleAmountsVisible: () => void
}

export function usePortfolioWorkspace() {
  return useOutletContext<PortfolioWorkspaceContextValue>()
}

export function PortfolioWorkspaceLayout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { portfolioId = "" } = useParams()
  const workspace = usePortfolioWorkspaceData(portfolioId)
  const [isAmountsVisible, setIsAmountsVisible] = React.useState(true)
  const [editingPortfolio, setEditingPortfolio] = React.useState(false)
  const [deletingPortfolio, setDeletingPortfolio] = React.useState(false)
  useKeyboardShortcuts(portfolioId)

  if (workspace.portfolioQuery.isPending && !workspace.portfolio) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <Skeleton className="h-14 w-full rounded-[1.5rem]" />
        <Skeleton className="h-[30rem] w-full rounded-[2rem]" />
      </div>
    )
  }

  if (
    workspace.portfolioQuery.error &&
    isNotFoundError(workspace.portfolioQuery.error)
  ) {
    return (
      <Card className="border-border/70 bg-background/92 shadow-sm">
        <CardContent className="py-16">
          <EmptyState icon={Trash2} title="That portfolio no longer exists">
            Return to the register to choose another portfolio.
          </EmptyState>
        </CardContent>
      </Card>
    )
  }

  if (!workspace.portfolio) {
    return (
      <StatusCallout title="Portfolio unavailable" tone="error">
        {getErrorMessage(workspace.portfolioQuery.error)}
      </StatusCallout>
    )
  }

  const portfolio = workspace.portfolio
  const toggleAmountsVisible = () => setIsAmountsVisible((current) => !current)
  const masked = (value: string) => (isAmountsVisible ? value : "••••••")

  return (
    <>
      <div className="space-y-6">
        <Card className="overflow-hidden border-border/80 bg-background/92 shadow-sm">
          <CardContent className="space-y-6 px-5 py-5 md:px-6 md:py-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="font-[var(--font-display)] text-4xl tracking-tight text-foreground md:text-5xl">
                    {portfolio.name}
                  </CardTitle>
                  <Badge className="rounded-full border border-slate-950/10 bg-slate-950 px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white hover:bg-slate-950">
                    {portfolio.baseCurrency}
                  </Badge>
                  <FeedStatusBadge status={workspace.quoteFeedStatus} />
                </div>
                {portfolio.description ? (
                  <CardDescription className="max-w-3xl text-sm leading-7 text-slate-700">
                    {portfolio.description}
                  </CardDescription>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span>Updated {formatDateTime(portfolio.updatedAt)}</span>
                  {workspace.latestQuoteAsOf ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>Quotes {formatDateTime(workspace.latestQuoteAsOf)}</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 md:justify-end">
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Button
                    className="rounded-full"
                    onClick={toggleAmountsVisible}
                    size="sm"
                    variant="outline"
                  >
                    {isAmountsVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                    {isAmountsVisible ? "Hide amounts" : "Show amounts"}
                  </Button>
                  <Button
                    className="rounded-full"
                    onClick={() => setEditingPortfolio(true)}
                    size="sm"
                    variant="outline"
                  >
                    Edit portfolio
                  </Button>
                  <Button
                    className="rounded-full text-destructive hover:text-destructive"
                    onClick={() => setDeletingPortfolio(true)}
                    size="sm"
                    variant="ghost"
                  >
                    Delete portfolio
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MetricPanel
                label="Total market value"
                value={masked(
                  formatCompactCurrency(
                    workspace.dashboard.totalMarketValue,
                    portfolio.baseCurrency,
                  ),
                )}
              />
              <MetricPanel
                label="Today's P&L"
                value={masked(
                  formatSignedCurrency(
                    workspace.dashboard.todayPnl,
                    portfolio.baseCurrency,
                  ),
                )}
              />
              <MetricPanel
                label="Floating P&L"
                value={masked(
                  formatSignedCurrency(
                    workspace.dashboard.floatingPnl,
                    portfolio.baseCurrency,
                  ),
                )}
              />
              <MetricPanel
                label="Cumulative P&L"
                value={masked(
                  formatSignedCurrency(
                    workspace.dashboard.cumulativePnl,
                    portfolio.baseCurrency,
                  ),
                )}
              />
            </div>
          </CardContent>
        </Card>

        {workspace.dataErrors.length > 0 ? (
          <StatusCallout title="Some portfolio data failed to load" tone="error">
            {workspace.dataErrors.join(" ")}
          </StatusCallout>
        ) : null}
        {workspace.warnings.length > 0 ? (
          <StatusCallout title="Quote reference warning" tone="warning">
            {workspace.warnings.join(" ")}
          </StatusCallout>
        ) : null}

        <div className="rounded-[1.5rem] border border-border/80 bg-background/85 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )
                }
                key={item.slug}
                to={`/portfolios/${portfolio.id}/${item.slug}`}
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
            <NavLink
              className={({ isActive }) =>
                cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                )
              }
              to="/portfolios"
            >
              <Plus className="size-4" />
              All portfolios
            </NavLink>
          </div>
        </div>

        <Outlet
          context={{
            ...workspace,
            isAmountsVisible,
            toggleAmountsVisible,
          }}
        />
      </div>

      <PortfolioFormDialog
        onOpenChange={setEditingPortfolio}
        onSuccess={() => setEditingPortfolio(false)}
        open={editingPortfolio}
        portfolio={portfolio}
      />
      <ConfirmDeleteDialog
        confirmLabel="Delete portfolio"
        description="This removes the portfolio and its related balances, positions, and simulated trade history."
        onConfirm={async () => {
          await api.deletePortfolio(portfolio.id)
          await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })
          toast.success("Portfolio deleted")
          navigate("/portfolios")
        }}
        onOpenChange={setDeletingPortfolio}
        open={deletingPortfolio}
        title="Delete this portfolio?"
      />
    </>
  )
}

function MetricPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/75 p-4">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-[var(--font-display)] text-3xl tracking-tight text-foreground">
        {value}
      </p>
    </div>
  )
}
