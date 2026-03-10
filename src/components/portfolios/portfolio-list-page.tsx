import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowRight,
  BriefcaseBusiness,
  CandlestickChart,
  FolderOpenDot,
  Plus,
  Wallet,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { api, type PortfolioRead } from "@/lib/api"
import {
  formatDate,
  getErrorDetails,
  getErrorMessage,
  pluralize,
} from "@/lib/format"
import { queryKeys } from "@/lib/query-keys"
import { sortPortfolios } from "@/lib/workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ConfirmDeleteDialog,
  PortfolioFormDialog,
} from "@/components/portfolios/dialogs"
import {
  EmptyState,
  MetricCard,
  StatusCallout,
} from "@/components/portfolios/shared"

export function PortfolioListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const portfoliosQuery = useQuery({
    queryKey: queryKeys.portfolios(),
    queryFn: api.listPortfolios,
  })

  const portfolios = React.useMemo(
    () => sortPortfolios(portfoliosQuery.data ?? []),
    [portfoliosQuery.data],
  )

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingPortfolio, setEditingPortfolio] = React.useState<PortfolioRead | null>(null)
  const [deletingPortfolio, setDeletingPortfolio] = React.useState<PortfolioRead | null>(null)

  const totalPositions = portfolios.reduce(
    (total, portfolio) => total + portfolio.positionCount,
    0,
  )
  const totalBalances = portfolios.reduce(
    (total, portfolio) => total + portfolio.balanceCount,
    0,
  )

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          detail={`${portfolios.length} ${pluralize(portfolios.length, "portfolio")}`}
          icon={BriefcaseBusiness}
          label="Portfolios"
          value={String(portfolios.length)}
        />
        <MetricCard
          detail={`${totalPositions} ${pluralize(totalPositions, "position")}`}
          icon={CandlestickChart}
          label="Positions"
          value={String(totalPositions)}
        />
        <MetricCard
          detail={`${totalBalances} ${pluralize(totalBalances, "balance")}`}
          icon={Wallet}
          label="Balances"
          value={String(totalBalances)}
        />
      </div>

      {portfoliosQuery.error ? (
        <StatusCallout
          details={getErrorDetails(portfoliosQuery.error)}
          title="Portfolios unavailable"
          tone="error"
        >
          {getErrorMessage(portfoliosQuery.error)}
        </StatusCallout>
      ) : null}

      <Card className="border-border/70 bg-background/90 shadow-sm backdrop-blur" id="portfolio-register">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <CardTitle className="font-[var(--font-display)] text-3xl">Portfolios</CardTitle>
          <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New portfolio
          </Button>
        </CardHeader>
        <CardContent>
          {portfoliosQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton className="h-16 w-full rounded-2xl" key={index} />
              ))}
            </div>
          ) : portfolios.length === 0 ? (
            <EmptyState
              action={
                <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
                  <Plus className="size-4" />
                  Create the first portfolio
                </Button>
              }
              icon={FolderOpenDot}
              title="No portfolios yet"
            >
              Create a portfolio to start tracking balances, positions, and trades.
            </EmptyState>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Balances</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolios.map((portfolio) => (
                    <TableRow key={portfolio.id}>
                      <TableCell>
                        <div className={portfolio.description ? "space-y-1" : undefined}>
                          <p className="font-medium text-foreground">{portfolio.name}</p>
                          {portfolio.description ? (
                            <p className="max-w-md text-sm text-muted-foreground">
                              {portfolio.description}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-slate-950 px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em] text-white hover:bg-slate-950">
                          {portfolio.baseCurrency}
                        </Badge>
                      </TableCell>
                      <TableCell>{portfolio.balanceCount}</TableCell>
                      <TableCell>{portfolio.positionCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(portfolio.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button asChild className="rounded-full" size="sm" variant="outline">
                            <Link to={`/portfolios/${portfolio.id}`}>
                              Open
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                          <Button className="rounded-full" onClick={() => setEditingPortfolio(portfolio)} size="sm" variant="ghost">
                            Edit
                          </Button>
                          <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingPortfolio(portfolio)} size="sm" variant="ghost">
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PortfolioFormDialog
        onOpenChange={setCreateOpen}
        onSuccess={(portfolio) => {
          setCreateOpen(false)
          navigate(`/portfolios/${portfolio.id}`)
        }}
        open={createOpen}
      />

      <PortfolioFormDialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingPortfolio(null)
          }
        }}
        onSuccess={() => {
          setEditingPortfolio(null)
        }}
        open={Boolean(editingPortfolio)}
        portfolio={editingPortfolio}
      />

      <ConfirmDeleteDialog
        confirmLabel="Delete portfolio"
        description={
          deletingPortfolio
            ? `Delete ${deletingPortfolio.name} and all related balances, positions, and simulated trades.`
            : ""
        }
        onConfirm={async () => {
          if (!deletingPortfolio) {
            return
          }

          await api.deletePortfolio(deletingPortfolio.id)
          await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })
          toast.success("Portfolio deleted")
          setDeletingPortfolio(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPortfolio(null)
          }
        }}
        open={Boolean(deletingPortfolio)}
        title="Delete portfolio?"
      />
    </div>
  )
}
