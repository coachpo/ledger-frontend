import * as React from "react"
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Controller, useForm } from "react-hook-form"
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useMatch, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CandlestickChart,
  CircleAlert,
  Coins,
  FileSpreadsheet,
  FolderOpenDot,
  Landmark,
  Loader2,
  PanelLeft,
  Plus,
  ReceiptText,
  SearchX,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wallet,
} from "lucide-react"

import {
  ApiRequestError,
  api,
  type BalanceRead,
  type CsvPreviewRead,
  type PortfolioRead,
  type PositionRead,
} from "@/lib/api"
import {
  decimalToNumber,
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDecimal,
  fromLocalDateTimeValue,
  getErrorDetails,
  getErrorMessage,
  pluralize,
  toLocalDateTimeValue,
} from "@/lib/format"
import { invalidatePortfolioScope, queryKeys } from "@/lib/query-keys"
import {
  buildWorkspaceMetrics,
  sortBalances,
  sortOperations,
  sortPortfolios,
  sortPositions,
} from "@/lib/workspace"
import { cn } from "@/lib/utils"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { TooltipProvider } from "@/components/ui/tooltip"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const portfolioCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Keep the name under 100 characters"),
  description: z.string().trim().max(400, "Keep the description concise").optional(),
  baseCurrency: z.string().trim().length(3, "Use a 3-letter currency code"),
})

const balanceSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60, "Keep the label under 60 characters"),
  amount: z.string().trim().min(1, "Amount is required").refine(isNonNegativeDecimal, "Amount must be greater than or equal to zero"),
})

const positionCreateSchema = z.object({
  symbol: z.string().trim().min(1, "Symbol is required").max(32, "Symbol is too long"),
  name: z.string().trim().max(120, "Keep the name under 120 characters").optional(),
  quantity: z.string().trim().min(1, "Quantity is required").refine(isPositiveDecimal, "Quantity must be greater than zero"),
  averageCost: z.string().trim().min(1, "Average cost is required").refine(isNonNegativeDecimal, "Average cost must be greater than or equal to zero"),
})

const tradingOperationSchema = z.object({
  balanceId: z.string().trim().min(1, "Choose a settlement balance"),
  symbol: z.string().trim().min(1, "Symbol is required").max(32, "Symbol is too long"),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.string().trim().min(1, "Quantity is required").refine(isPositiveDecimal, "Quantity must be greater than zero"),
  price: z.string().trim().min(1, "Price is required").refine(isNonNegativeDecimal, "Price must be greater than or equal to zero"),
  commission: z.string().trim().min(1, "Commission is required").refine(isNonNegativeDecimal, "Commission must be greater than or equal to zero"),
  executedAt: z.string().trim().min(1, "Execution time is required"),
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppFrame />}>
              <Route index element={<Navigate replace to="/portfolios" />} />
              <Route path="/portfolios" element={<PortfolioListPage />} />
              <Route path="/portfolios/:portfolioId" element={<PortfolioDetailPage />} />
              <Route path="*" element={<Navigate replace to="/portfolios" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster closeButton position="top-right" richColors />
    </QueryClientProvider>
  )
}

function AppFrame() {
  const location = useLocation()
  const activeMatch = useMatch("/portfolios/:portfolioId")
  const portfoliosQuery = useQuery({
    queryKey: queryKeys.portfolios(),
    queryFn: api.listPortfolios,
  })

  const sortedPortfolios = React.useMemo(
    () => sortPortfolios(portfoliosQuery.data ?? []),
    [portfoliosQuery.data],
  )

  const activePortfolio = sortedPortfolios.find(
    (portfolio) => portfolio.id === activeMatch?.params.portfolioId,
  )

  const title = activePortfolio?.name
    ? activePortfolio.name
    : location.pathname === "/portfolios"
      ? "Portfolio register"
      : "Workspace"

  return (
    <SidebarProvider defaultOpen>
      <LedgerSidebar
        activePortfolioId={activePortfolio?.id ?? null}
        isLoading={portfoliosQuery.isPending}
        portfolios={sortedPortfolios}
      />
      <SidebarInset className="bg-[linear-gradient(180deg,rgba(252,248,239,0.98),rgba(248,244,237,0.96))]">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-4 md:px-8">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-1 hidden h-5 md:block" orientation="vertical" />
            <div className="min-w-0 flex-1">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.32em] text-muted-foreground">
                Trusted operator mode
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 truncate font-[var(--font-display)] text-2xl text-foreground md:text-3xl">
                  {title}
                </h1>
                {activePortfolio ? (
                  <Badge className="rounded-full border border-emerald-700/20 bg-emerald-600/10 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-emerald-900 hover:bg-emerald-600/10">
                    {activePortfolio.baseCurrency} base
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="hidden rounded-full border border-border/70 bg-background/80 px-4 py-2 text-right md:block">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Indicative feed
              </p>
              <p className="mt-1 text-sm text-foreground">Delayed public prices only</p>
            </div>
          </div>
        </header>
        <main className="relative flex-1 px-4 pb-10 pt-6 md:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.18),transparent_45%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_40%)]" />
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function LedgerSidebar({
  activePortfolioId,
  isLoading,
  portfolios,
}: {
  activePortfolioId: string | null
  isLoading: boolean
  portfolios: PortfolioRead[]
}) {
  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-auto items-start p-0 hover:bg-transparent" size="lg">
              <Link className="group block" to="/portfolios">
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-sm transition-colors group-hover:border-emerald-700/20 group-hover:bg-background">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f766e,#164e63)] text-white shadow-sm">
                    <BriefcaseBusiness className="size-5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                      Ledger atelier
                    </p>
                    <p className="mt-1 font-[var(--font-display)] text-xl text-foreground">
                      Manual market books
                    </p>
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace map</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={activePortfolioId === null}>
                  <Link to="/portfolios">
                    <PanelLeft className="size-4" />
                    <span>All portfolios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Isolated books</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading
                ? Array.from({ length: 4 }, (_, index) => (
                    <SidebarMenuItem key={index}>
                      <div className="flex items-center gap-2 rounded-xl px-2 py-2">
                        <Skeleton className="size-8 rounded-lg" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </SidebarMenuItem>
                  ))
                : null}
              {!isLoading && portfolios.length === 0 ? (
                <SidebarMenuItem>
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/80 p-3 text-sm text-muted-foreground">
                    Start with a portfolio to keep balances, positions, and simulated trades isolated.
                  </div>
                </SidebarMenuItem>
              ) : null}
              {portfolios.map((portfolio) => (
                <SidebarMenuItem key={portfolio.id}>
                  <SidebarMenuButton asChild isActive={portfolio.id === activePortfolioId}>
                    <Link to={`/portfolios/${portfolio.id}`}>
                      <FolderOpenDot className="size-4" />
                      <span className="truncate">{portfolio.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>
                    {portfolio.positionCount + portfolio.balanceCount}
                  </SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-sm shadow-sm">
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Guardrail
          </p>
          <p className="mt-2 text-foreground">Quotes stay best-effort and visually secondary to your own records.</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function PortfolioListPage() {
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
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr]">
        <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(18,52,86,0.92),rgba(17,94,89,0.88))] text-white shadow-xl">
          <CardHeader className="relative overflow-hidden pb-4">
            <div className="pointer-events-none absolute inset-y-0 right-0 w-56 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.2),transparent_65%)]" />
            <Badge className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white hover:bg-white/10">
              Portfolio workspace
            </Badge>
            <CardTitle className="mt-6 max-w-3xl font-[var(--font-display)] text-4xl tracking-tight md:text-5xl">
              Track balances, holdings, and simulated trades without spreadsheet drift.
            </CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-white/72">
              Build isolated books for each strategy, maintain positions manually or by CSV, and keep delayed market data visibly separate from your own source-of-truth records.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 pb-6">
            <Button className="rounded-full bg-white text-slate-950 hover:bg-white/90" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New portfolio
            </Button>
            <Button asChild className="rounded-full border border-white/15 bg-transparent text-white hover:bg-white/10" variant="outline">
              <a href="#portfolio-register">
                <ReceiptText className="size-4" />
                Review register
              </a>
            </Button>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <MetricCard eyebrow="Books" icon={BriefcaseBusiness} label="Isolated portfolios" value={String(portfolios.length)} detail={`${portfolios.length} ${pluralize(portfolios.length, "workspace")}`} />
          <MetricCard eyebrow="Coverage" icon={CandlestickChart} label="Tracked positions" value={String(totalPositions)} detail={`${totalPositions} active holdings`} />
          <MetricCard eyebrow="Liquidity" icon={Wallet} label="Settlement balances" value={String(totalBalances)} detail={`${totalBalances} cash buckets`} />
        </div>
      </section>

      {portfoliosQuery.error ? (
        <StatusCallout details={getErrorDetails(portfoliosQuery.error)} title="Portfolio list unavailable" tone="error">
          {getErrorMessage(portfoliosQuery.error)}
        </StatusCallout>
      ) : null}

      <Card className="border-border/70 bg-background/90 shadow-sm backdrop-blur" id="portfolio-register">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="font-[var(--font-display)] text-3xl">Portfolio register</CardTitle>
            <CardDescription>
              Each row is an isolated workspace with its own balances, positions, and simulated trade history.
            </CardDescription>
          </div>
          <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Create portfolio
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
              Start a book for each strategy or sandbox so balances, holdings, and simulations never bleed into each other.
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
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{portfolio.name}</p>
                          <p className="max-w-md text-sm text-muted-foreground">
                            {portfolio.description || "No description yet."}
                          </p>
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

function PortfolioDetailPage() {
  const navigate = useNavigate()
  const { portfolioId = "" } = useParams()
  const queryClient = useQueryClient()
  const [editingPortfolio, setEditingPortfolio] = React.useState(false)
  const [deletingPortfolio, setDeletingPortfolio] = React.useState(false)
  const [balanceDialog, setBalanceDialog] = React.useState<BalanceRead | null | "create">(null)
  const [deletingBalance, setDeletingBalance] = React.useState<BalanceRead | null>(null)
  const [positionDialog, setPositionDialog] = React.useState<PositionRead | null | "create">(null)
  const [deletingPosition, setDeletingPosition] = React.useState<PositionRead | null>(null)
  const [csvDialogOpen, setCsvDialogOpen] = React.useState(false)

  const portfolioQuery = useQuery({
    enabled: Boolean(portfolioId),
    queryKey: queryKeys.portfolio(portfolioId),
    queryFn: () => api.getPortfolio(portfolioId),
  })

  const balancesQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.balances(portfolioId),
    queryFn: () => api.listBalances(portfolioId),
  })

  const positionsQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.positions(portfolioId),
    queryFn: () => api.listPositions(portfolioId),
  })

  const operationsQuery = useQuery({
    enabled: portfolioQuery.isSuccess,
    queryKey: queryKeys.trades(portfolioId),
    queryFn: () => api.listTradingOperations(portfolioId),
  })

  const symbols = React.useMemo(
    () => sortPositions(positionsQuery.data ?? []).map((position) => position.symbol),
    [positionsQuery.data],
  )

  const marketQuery = useQuery({
    enabled: portfolioQuery.isSuccess && symbols.length > 0,
    queryKey: queryKeys.marketData(portfolioId, symbols),
    queryFn: () => api.getMarketQuotes(portfolioId, symbols),
  })

  const portfolio = portfolioQuery.data
  const balances = React.useMemo(
    () => sortBalances(balancesQuery.data ?? []),
    [balancesQuery.data],
  )
  const positions = React.useMemo(
    () => sortPositions(positionsQuery.data ?? []),
    [positionsQuery.data],
  )
  const operations = React.useMemo(
    () => sortOperations(operationsQuery.data ?? []),
    [operationsQuery.data],
  )
  const quotes = React.useMemo(
    () => marketQuery.data?.quotes ?? [],
    [marketQuery.data?.quotes],
  )
  const warnings = React.useMemo(
    () => marketQuery.data?.warnings ?? [],
    [marketQuery.data?.warnings],
  )
  const metrics = React.useMemo(
    () =>
      buildWorkspaceMetrics({
        balances,
        positions,
        quotes,
        warnings,
        operations,
      }),
    [balances, operations, positions, quotes, warnings],
  )

  if (portfolioQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-28 w-full rounded-3xl" key={index} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
          <Skeleton className="h-[28rem] w-full rounded-3xl" />
          <Skeleton className="h-[28rem] w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (portfolioQuery.error && isNotFoundError(portfolioQuery.error)) {
    return (
      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardContent className="py-16">
          <EmptyState
            action={
              <Button asChild className="rounded-full">
                <Link to="/portfolios">Return to portfolio register</Link>
              </Button>
            }
            icon={SearchX}
            title="That portfolio no longer exists"
          >
            The selected route is stale or the portfolio was deleted. Choose another workspace from the sidebar or start a fresh one.
          </EmptyState>
        </CardContent>
      </Card>
    )
  }

  if (!portfolio) {
    return (
      <StatusCallout title="Workspace unavailable" tone="error">
        {getErrorMessage(portfolioQuery.error)}
      </StatusCallout>
    )
  }

  const chartData = metrics.allocationRows.slice(0, 6).map((row) => ({
    symbol: row.symbol,
    indicativeValue: row.currentValue,
    costBasis: row.costBasis,
  }))

  const chartConfig = {
    indicativeValue: {
      label: "Indicative value",
      color: "var(--chart-1)",
    },
    costBasis: {
      label: "Cost basis",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border/70 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(252,244,229,0.96),rgba(240,253,250,0.92))] shadow-sm">
        <CardHeader className="gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <Badge className="w-fit rounded-full border border-emerald-700/15 bg-emerald-600/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-emerald-900 hover:bg-emerald-600/10">
              Active workspace
            </Badge>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="font-[var(--font-display)] text-4xl tracking-tight md:text-5xl">
                  {portfolio.name}
                </CardTitle>
                <Badge className="rounded-full border border-slate-900/10 bg-slate-950 px-3 py-1 text-[0.65rem] uppercase tracking-[0.28em] text-white hover:bg-slate-950">
                  {portfolio.baseCurrency}
                </Badge>
              </div>
              <CardDescription className="max-w-3xl text-base leading-7 text-slate-700">
                {portfolio.description || "This book is ready for balance setup, manual holdings, CSV snapshots, and simulated trades."}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Updated {formatDateTime(portfolio.updatedAt)}</span>
              <span aria-hidden="true">/</span>
              <span>{portfolio.positionCount} positions</span>
              <span aria-hidden="true">/</span>
              <span>{portfolio.balanceCount} balances</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-full" onClick={() => setEditingPortfolio(true)} variant="outline">
              Edit workspace
            </Button>
            <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingPortfolio(true)} variant="ghost">
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
      </Card>

      {(balancesQuery.error || positionsQuery.error || operationsQuery.error) ? (
        <StatusCallout title="Some workspace data failed to load" tone="error">
          {[balancesQuery.error, positionsQuery.error, operationsQuery.error]
            .filter(Boolean)
            .map((error) => getErrorMessage(error))
            .join(" ")}
        </StatusCallout>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard eyebrow="Liquidity" icon={Wallet} label="Available cash" value={formatCompactCurrency(metrics.cashTotal, portfolio.baseCurrency)} detail={`${metrics.balanceCount} settlement ${pluralize(metrics.balanceCount, "bucket")}`} />
        <MetricCard eyebrow="Book cost" icon={BadgeDollarSign} label="Aggregate basis" value={formatCompactCurrency(metrics.costBasisTotal, portfolio.baseCurrency)} detail={`${metrics.positionCount} ${pluralize(metrics.positionCount, "position")}`} />
        <MetricCard eyebrow="Indicative" icon={CandlestickChart} label="Quoted exposure" value={formatCompactCurrency(metrics.indicativeValueTotal, portfolio.baseCurrency)} detail={`${Math.round(metrics.quoteCoverage * 100)}% quote coverage`} />
        <MetricCard eyebrow="Simulation log" icon={Coins} label="Recorded trades" value={String(metrics.operationsCount)} detail={warnings.length > 0 ? `${warnings.length} market-data ${pluralize(warnings.length, "warning")}` : "No quote warnings"} />
      </div>

      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader>
          <CardTitle className="font-[var(--font-display)] text-3xl">Exposure board</CardTitle>
          <CardDescription>
            Derived from current positions and the latest supported quote reads. No historical quote series is invented here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs className="space-y-4" defaultValue="exposure">
            <TabsList className="grid w-full max-w-md grid-cols-2 rounded-full bg-secondary/70 p-1">
              <TabsTrigger className="rounded-full" value="exposure">Exposure mix</TabsTrigger>
              <TabsTrigger className="rounded-full" value="quote-board">Quote board</TabsTrigger>
            </TabsList>
            <TabsContent value="exposure">
              {chartData.length === 0 ? (
                <EmptyState icon={CandlestickChart} title="No holdings to visualize">
                  Add positions manually or import a CSV snapshot to turn this board into a current-state exposure view.
                </EmptyState>
              ) : (
                <ChartContainer className="h-80 w-full" config={chartConfig}>
                  <BarChart accessibilityLayer data={chartData} margin={{ left: 16, right: 16, top: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="symbol" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={false} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="indicativeValue" fill="var(--color-indicativeValue)" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="costBasis" fill="var(--color-costBasis)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </TabsContent>
            <TabsContent value="quote-board">
              {symbols.length === 0 ? (
                <EmptyState icon={ReceiptText} title="No symbols yet">
                  Quote lookups begin once the portfolio has at least one tracked symbol.
                </EmptyState>
              ) : marketQuery.isPending ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton className="h-24 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {warnings.length > 0 ? (
                    <StatusCallout title="Market data returned with warnings" tone="warning">
                      {warnings.join(" ")}
                    </StatusCallout>
                  ) : null}
                  {marketQuery.error ? (
                    <StatusCallout details={getErrorDetails(marketQuery.error)} title="Quote lookup failed" tone="error">
                      {getErrorMessage(marketQuery.error)}
                    </StatusCallout>
                  ) : null}
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {quotes.map((quote) => (
                      <Card className="border-border/70 bg-muted/20" key={quote.symbol}>
                        <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
                                {quote.provider.replaceAll("_", " ")}
                              </p>
                              <p className="mt-1 font-[var(--font-display)] text-3xl">{quote.symbol}</p>
                            </div>
                            <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", quote.isStale ? "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10" : "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10")}>{quote.isStale ? "Stale" : "Delayed"}</Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-2xl font-semibold text-foreground">
                              {formatCurrency(quote.price, quote.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              As of {formatDateTime(quote.asOf)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
        <div className="space-y-4">
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="font-[var(--font-display)] text-3xl">Positions</CardTitle>
                <CardDescription>
                  Manual edits and CSV snapshots remain the authoritative record for current holdings.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="rounded-full" onClick={() => setPositionDialog("create")} variant="outline">
                  <Plus className="size-4" />
                  Add position
                </Button>
                <Button className="rounded-full" onClick={() => setCsvDialogOpen(true)}>
                  <FileSpreadsheet className="size-4" />
                  Import CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {positionsQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton className="h-16 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : positions.length === 0 ? (
                <EmptyState
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button className="rounded-full" onClick={() => setPositionDialog("create")}>
                        <Plus className="size-4" />
                        Add manually
                      </Button>
                      <Button className="rounded-full" onClick={() => setCsvDialogOpen(true)} variant="outline">
                        <FileSpreadsheet className="size-4" />
                        Import CSV
                      </Button>
                    </div>
                  }
                  icon={Landmark}
                  title="No positions yet"
                >
                  Start with a manual holding or import a snapshot file with `symbol`, `quantity`, and `average_cost`.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Average cost</TableHead>
                        <TableHead>Book value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((position) => (
                        <TableRow key={position.id}>
                          <TableCell className="font-medium">{position.symbol}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{position.name || "-"}</TableCell>
                          <TableCell>{formatDecimal(position.quantity, 4)}</TableCell>
                          <TableCell>{formatCurrency(position.averageCost, position.currency)}</TableCell>
                          <TableCell>
                            {formatCurrency(
                              decimalToNumber(position.quantity) * decimalToNumber(position.averageCost),
                              position.currency,
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button className="rounded-full" onClick={() => setPositionDialog(position)} size="sm" variant="ghost">
                                Edit
                              </Button>
                              <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingPosition(position)} size="sm" variant="ghost">
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

          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-3xl">Simulated trading operations</CardTitle>
              <CardDescription>
                Buy and sell events update the selected balance and the aggregate position immediately, while the operation log stays append-only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <TradingOperationForm
                balances={balances}
                currency={portfolio.baseCurrency}
                portfolioId={portfolio.id}
                positions={positions}
              />
              <Separator />
              {operationsQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton className="h-14 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : operations.length === 0 ? (
                <EmptyState icon={Coins} title="No simulated trades recorded">
                  Once you run a buy or sell operation, the latest history lands here with balance and position effects applied in one step.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Executed</TableHead>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Side</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations.slice(0, 8).map((operation) => (
                        <TableRow key={operation.id}>
                          <TableCell className="text-sm text-muted-foreground">{formatDateTime(operation.executedAt)}</TableCell>
                          <TableCell className="font-medium">{operation.symbol}</TableCell>
                          <TableCell>
                            <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", operation.side === "BUY" ? "border border-emerald-700/20 bg-emerald-600/10 text-emerald-900 hover:bg-emerald-600/10" : "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10")}>
                              {operation.side}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDecimal(operation.quantity, 4)}</TableCell>
                          <TableCell>{formatCurrency(operation.price, operation.currency)}</TableCell>
                          <TableCell>{formatCurrency(operation.commission, operation.currency)}</TableCell>
                          <TableCell>{operation.balanceLabel}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle className="font-[var(--font-display)] text-3xl">Balances</CardTitle>
                <CardDescription>
                  Settlement balances power simulation cash checks and stay portfolio-scoped.
                </CardDescription>
              </div>
              <Button className="rounded-full" onClick={() => setBalanceDialog("create")}>
                <Plus className="size-4" />
                Add balance
              </Button>
            </CardHeader>
            <CardContent>
              {balancesQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton className="h-16 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : balances.length === 0 ? (
                <EmptyState
                  action={
                    <Button className="rounded-full" onClick={() => setBalanceDialog("create")}> 
                      <Plus className="size-4" />
                      Add balance
                    </Button>
                  }
                  icon={Wallet}
                  title="No settlement balances yet"
                >
                  Add at least one balance before running simulated buys or sells.
                </EmptyState>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-border/70">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances.map((balance) => (
                        <TableRow key={balance.id}>
                          <TableCell className="font-medium">{balance.label}</TableCell>
                          <TableCell>{formatCurrency(balance.amount, balance.currency)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button className="rounded-full" onClick={() => setBalanceDialog(balance)} size="sm" variant="ghost">
                                Edit
                              </Button>
                              <Button className="rounded-full text-destructive hover:text-destructive" onClick={() => setDeletingBalance(balance)} size="sm" variant="ghost">
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

          <Card className="border-border/70 bg-background/90 shadow-sm">
            <CardHeader>
              <CardTitle className="font-[var(--font-display)] text-3xl">Indicative market data</CardTitle>
              <CardDescription>
                Best-effort quotes stay secondary to the records you entered or imported.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {symbols.length === 0 ? (
                <EmptyState icon={CandlestickChart} title="No symbols to quote">
                  The quote panel activates once the portfolio has at least one tracked position.
                </EmptyState>
              ) : marketQuery.isPending ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }, (_, index) => (
                    <Skeleton className="h-16 w-full rounded-2xl" key={index} />
                  ))}
                </div>
              ) : (
                <>
                  {warnings.length > 0 ? (
                    <StatusCallout title="Warnings from the quote adapter" tone="warning">
                      {warnings.join(" ")}
                    </StatusCallout>
                  ) : null}
                  {marketQuery.error ? (
                    <StatusCallout details={getErrorDetails(marketQuery.error)} title="Market data unavailable" tone="error">
                      {getErrorMessage(marketQuery.error)}
                    </StatusCallout>
                  ) : null}
                  {quotes.length === 0 ? (
                    <EmptyState icon={SearchX} title="No quotes returned">
                      Quote responses can legally contain warnings without data. Your portfolio records remain fully usable.
                    </EmptyState>
                  ) : (
                    <div className="overflow-hidden rounded-3xl border border-border/70">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Symbol</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>As of</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotes.map((quote) => (
                            <TableRow key={quote.symbol}>
                              <TableCell className="font-medium">{quote.symbol}</TableCell>
                              <TableCell>{formatCurrency(quote.price, quote.currency)}</TableCell>
                              <TableCell>
                                <Badge className={cn("rounded-full px-3 py-1 text-[0.65rem] uppercase tracking-[0.24em]", quote.isStale ? "border border-amber-500/20 bg-amber-500/10 text-amber-900 hover:bg-amber-500/10" : "border border-slate-900/10 bg-slate-950/90 text-white hover:bg-slate-950/90")}>{quote.isStale ? "Stale" : "Delayed"}</Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{formatDateTime(quote.asOf)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PortfolioFormDialog
        onOpenChange={setEditingPortfolio}
        onSuccess={() => setEditingPortfolio(false)}
        open={editingPortfolio}
        portfolio={portfolio}
      />
      <BalanceFormDialog
        balance={balanceDialog === "create" ? null : balanceDialog}
        onOpenChange={(open) => {
          if (!open) {
            setBalanceDialog(null)
          }
        }}
        open={Boolean(balanceDialog)}
        portfolio={portfolio}
      />
      <PositionFormDialog
        onOpenChange={(open) => {
          if (!open) {
            setPositionDialog(null)
          }
        }}
        open={Boolean(positionDialog)}
        portfolio={portfolio}
        position={positionDialog === "create" ? null : positionDialog}
      />
      <CsvImportDialog
        onOpenChange={setCsvDialogOpen}
        open={csvDialogOpen}
        portfolioId={portfolio.id}
      />

      <ConfirmDeleteDialog
        confirmLabel="Delete workspace"
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
      <ConfirmDeleteDialog
        confirmLabel="Delete balance"
        description={deletingBalance ? `Delete ${deletingBalance.label} from ${portfolio.name}.` : ""}
        onConfirm={async () => {
          if (!deletingBalance) {
            return
          }
          await api.deleteBalance(portfolio.id, deletingBalance.id)
          await invalidatePortfolioScope(queryClient, portfolio.id)
          toast.success("Balance deleted")
          setDeletingBalance(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBalance(null)
          }
        }}
        open={Boolean(deletingBalance)}
        title="Delete this balance?"
      />
      <ConfirmDeleteDialog
        confirmLabel="Delete position"
        description={deletingPosition ? `Delete ${deletingPosition.symbol} from ${portfolio.name}.` : ""}
        onConfirm={async () => {
          if (!deletingPosition) {
            return
          }
          await api.deletePosition(portfolio.id, deletingPosition.id)
          await invalidatePortfolioScope(queryClient, portfolio.id)
          toast.success("Position deleted")
          setDeletingPosition(null)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPosition(null)
          }
        }}
        open={Boolean(deletingPosition)}
        title="Delete this position?"
      />
    </div>
  )
}

function PortfolioFormDialog({
  open,
  onOpenChange,
  portfolio,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio?: PortfolioRead | null
  onSuccess?: (portfolio: PortfolioRead) => void | Promise<void>
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof portfolioCreateSchema>>({
    resolver: zodResolver(portfolioCreateSchema),
    defaultValues: {
      name: portfolio?.name ?? "",
      description: portfolio?.description ?? "",
      baseCurrency: portfolio?.baseCurrency ?? "USD",
    },
  })

  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    form.reset({
      name: portfolio?.name ?? "",
      description: portfolio?.description ?? "",
      baseCurrency: portfolio?.baseCurrency ?? "USD",
    })
    setSubmitError(null)
  }, [form, open, portfolio])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const payload = {
        name: values.name.trim(),
        description: normalizeOptionalText(values.description),
        baseCurrency: values.baseCurrency.trim().toUpperCase(),
      }

      const result = portfolio
        ? await api.updatePortfolio(portfolio.id, {
            name: payload.name,
            description: payload.description,
          })
        : await api.createPortfolio(payload)

      await queryClient.invalidateQueries({ queryKey: queryKeys.portfolios() })
      if (portfolio) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.portfolio(portfolio.id),
        })
      }

      toast.success(portfolio ? "Portfolio updated" : "Portfolio created")
      onOpenChange(false)
      await onSuccess?.(result)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            {portfolio ? "Edit portfolio" : "Create portfolio"}
          </DialogTitle>
          <DialogDescription>
            {portfolio
              ? "Update the workspace name or description. Base currency stays fixed in MVP."
              : "Set the name, optional description, and base currency for a new isolated book."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portfolio-name">Name</Label>
              <Input id="portfolio-name" placeholder="Core portfolio" {...form.register("name")} />
              <FieldErrorText message={form.formState.errors.name?.message} />
            </div>
            {!portfolio ? (
              <div className="space-y-2">
                <Label htmlFor="portfolio-base-currency">Base currency</Label>
                <Controller
                  control={form.control}
                  name="baseCurrency"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="portfolio-base-currency">
                        <SelectValue placeholder="Choose a currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {BASE_CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldErrorText message={form.formState.errors.baseCurrency?.message} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Base currency</Label>
                <div className="flex h-10 items-center rounded-xl border border-border/70 bg-muted/30 px-3 text-sm font-medium text-foreground">
                  {portfolio.baseCurrency}
                </div>
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="portfolio-description">Description</Label>
              <Textarea id="portfolio-description" placeholder="Long-term holdings, sandbox trades, or sector experiments" rows={4} {...form.register("description")} />
              <FieldErrorText message={form.formState.errors.description?.message} />
            </div>
          </div>

          {submitError ? (
            <StatusCallout details={getErrorDetails(submitError)} title="Could not save the portfolio" tone="error">
              {getErrorMessage(submitError)}
            </StatusCallout>
          ) : null}

          <DialogFooter>
            <Button className="rounded-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {portfolio ? "Save changes" : "Create portfolio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BalanceFormDialog({
  open,
  onOpenChange,
  portfolio,
  balance,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: PortfolioRead
  balance?: BalanceRead | null
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof balanceSchema>>({
    resolver: zodResolver(balanceSchema),
    defaultValues: {
      label: balance?.label ?? "",
      amount: balance?.amount ?? "0.00",
    },
  })
  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    form.reset({
      label: balance?.label ?? "",
      amount: balance?.amount ?? "0.00",
    })
    setSubmitError(null)
  }, [balance, form, open])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (balance) {
        await api.updateBalance(portfolio.id, balance.id, {
          label: values.label.trim(),
          amount: values.amount.trim(),
        })
      } else {
        await api.createBalance(portfolio.id, {
          label: values.label.trim(),
          amount: values.amount.trim(),
        })
      }

      await invalidatePortfolioScope(queryClient, portfolio.id)
      toast.success(balance ? "Balance updated" : "Balance added")
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            {balance ? "Edit balance" : "Add balance"}
          </DialogTitle>
          <DialogDescription>
            Settlement balances stay in the portfolio base currency of {portfolio.baseCurrency}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="balance-label">Label</Label>
            <Input id="balance-label" placeholder="Cash" {...form.register("label")} />
            <FieldErrorText message={form.formState.errors.label?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance-amount">Amount</Label>
            <Input id="balance-amount" inputMode="decimal" placeholder="25000.00" {...form.register("amount")} />
            <FieldErrorText message={form.formState.errors.amount?.message} />
          </div>
          {submitError ? (
            <StatusCallout details={getErrorDetails(submitError)} title="Could not save the balance" tone="error">
              {getErrorMessage(submitError)}
            </StatusCallout>
          ) : null}
          <DialogFooter>
            <Button className="rounded-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {balance ? "Save balance" : "Create balance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PositionFormDialog({
  open,
  onOpenChange,
  portfolio,
  position,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolio: PortfolioRead
  position?: PositionRead | null
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof positionCreateSchema>>({
    resolver: zodResolver(positionCreateSchema),
    defaultValues: {
      symbol: position?.symbol ?? "",
      name: position?.name ?? "",
      quantity: position?.quantity ?? "",
      averageCost: position?.averageCost ?? "",
    },
  })
  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    form.reset({
      symbol: position?.symbol ?? "",
      name: position?.name ?? "",
      quantity: position?.quantity ?? "",
      averageCost: position?.averageCost ?? "",
    })
    setSubmitError(null)
  }, [form, open, position])

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      if (position) {
        await api.updatePosition(portfolio.id, position.id, {
          name: normalizeOptionalText(values.name),
          quantity: values.quantity.trim(),
          averageCost: values.averageCost.trim(),
        })
      } else {
        await api.createPosition(portfolio.id, {
          symbol: values.symbol.trim().toUpperCase(),
          name: normalizeOptionalText(values.name),
          quantity: values.quantity.trim(),
          averageCost: values.averageCost.trim(),
        })
      }

      await invalidatePortfolioScope(queryClient, portfolio.id)
      toast.success(position ? "Position updated" : "Position added")
      onOpenChange(false)
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">
            {position ? "Edit position" : "Add position"}
          </DialogTitle>
          <DialogDescription>
            Positions stay aggregated by symbol and use the portfolio base currency of {portfolio.baseCurrency}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!position ? (
            <div className="space-y-2">
              <Label htmlFor="position-symbol">Symbol</Label>
              <Input id="position-symbol" placeholder="AAPL" {...form.register("symbol")} />
              <FieldErrorText message={form.formState.errors.symbol?.message} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Symbol</Label>
              <div className="flex h-10 items-center rounded-xl border border-border/70 bg-muted/30 px-3 font-medium">
                {position.symbol}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="position-name">Name</Label>
            <Input id="position-name" placeholder="Apple Inc." {...form.register("name")} />
            <FieldErrorText message={form.formState.errors.name?.message} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="position-quantity">Quantity</Label>
              <Input id="position-quantity" inputMode="decimal" placeholder="10" {...form.register("quantity")} />
              <FieldErrorText message={form.formState.errors.quantity?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position-average-cost">Average cost</Label>
              <Input id="position-average-cost" inputMode="decimal" placeholder="185.50" {...form.register("averageCost")} />
              <FieldErrorText message={form.formState.errors.averageCost?.message} />
            </div>
          </div>
          {submitError ? (
            <StatusCallout details={getErrorDetails(submitError)} title="Could not save the position" tone="error">
              {getErrorMessage(submitError)}
            </StatusCallout>
          ) : null}
          <DialogFooter>
            <Button className="rounded-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
              {position ? "Save position" : "Create position"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CsvImportDialog({
  open,
  onOpenChange,
  portfolioId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  portfolioId: string
}) {
  const queryClient = useQueryClient()
  const [file, setFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<CsvPreviewRead | null>(null)
  const [previewError, setPreviewError] = React.useState<unknown>(null)
  const [previewPending, setPreviewPending] = React.useState(false)
  const [commitPending, setCommitPending] = React.useState(false)

  React.useEffect(() => {
    if (!open) {
      setFile(null)
      setPreview(null)
      setPreviewError(null)
      setPreviewPending(false)
      setCommitPending(false)
    }
  }, [open])

  async function handlePreview() {
    if (!file) {
      return
    }

    setPreviewPending(true)
    setPreviewError(null)
    try {
      const result = await api.previewPositionImport(portfolioId, file)
      setPreview(result)
    } catch (error) {
      setPreview(null)
      setPreviewError(error)
    } finally {
      setPreviewPending(false)
    }
  }

  async function handleCommit() {
    if (!file) {
      return
    }

    setCommitPending(true)
    setPreviewError(null)
    try {
      const result = await api.commitPositionImport(portfolioId, file)
      await invalidatePortfolioScope(queryClient, portfolioId)
      toast.success(`CSV applied: ${result.inserted} inserted, ${result.updated} updated, ${result.unchanged} unchanged.`)
      onOpenChange(false)
    } catch (error) {
      setPreviewError(error)
    } finally {
      setCommitPending(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-[var(--font-display)] text-3xl">Import positions from CSV</DialogTitle>
          <DialogDescription>
            Required headers: `symbol`, `quantity`, and `average_cost`. Optional header: `name`. Import mode is upsert by symbol.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 p-5">
            <div className="space-y-3">
              <Label htmlFor="position-csv">CSV file</Label>
              <Input
                accept=".csv,text/csv"
                id="position-csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null)
                  setPreview(null)
                  setPreviewError(null)
                }}
                type="file"
              />
              <p className="text-sm text-muted-foreground">
                Positions not present in the file remain unchanged. Duplicate symbols inside the file are rejected before commit.
              </p>
            </div>
          </div>

          {previewError ? (
            <StatusCallout details={getErrorDetails(previewError)} title="CSV preview failed" tone="error">
              {getErrorMessage(previewError)}
            </StatusCallout>
          ) : null}

          {preview ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle>Accepted rows</CardTitle>
                  <CardDescription>{preview.acceptedRows.length} ready to apply.</CardDescription>
                </CardHeader>
                <CardContent>
                  {preview.acceptedRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No rows were accepted from this preview.</p>
                  ) : (
                    <ScrollArea className="h-72">
                      <div className="overflow-hidden rounded-2xl border border-border/70">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Symbol</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Average cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {preview.acceptedRows.map((row) => (
                              <TableRow key={`${row.row}-${row.symbol}`}>
                                <TableCell>{row.row}</TableCell>
                                <TableCell className="font-medium">{row.symbol}</TableCell>
                                <TableCell>{row.quantity}</TableCell>
                                <TableCell>{row.averageCost}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-background/80">
                <CardHeader>
                  <CardTitle>Validation notes</CardTitle>
                  <CardDescription>
                    {preview.errors.length === 0
                      ? "The file is ready for commit."
                      : `${preview.errors.length} ${pluralize(preview.errors.length, "issue")} must be fixed.`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {preview.errors.length === 0 ? (
                    <StatusCallout title="Preview passed" tone="info">
                      The CSV meets the import contract and can be applied atomically.
                    </StatusCallout>
                  ) : (
                    <StatusCallout
                      details={preview.errors.map((error) => `Row ${error.row}: ${error.field} - ${error.issue}`)}
                      title="Fix these rows before commit"
                      tone="warning"
                    >
                      The backend will reject commit when preview validation still has row errors.
                    </StatusCallout>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button className="rounded-full" disabled={!file || previewPending} onClick={handlePreview} type="button" variant="outline">
              {previewPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Preview file
            </Button>
            <Button
              className="rounded-full"
              disabled={!file || !preview || preview.errors.length > 0 || preview.acceptedRows.length === 0 || commitPending}
              onClick={() => void handleCommit()}
              type="button"
            >
              {commitPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Commit import
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TradingOperationForm({
  portfolioId,
  currency,
  balances,
  positions,
}: {
  portfolioId: string
  currency: string
  balances: BalanceRead[]
  positions: PositionRead[]
}) {
  const queryClient = useQueryClient()
  const form = useForm<z.infer<typeof tradingOperationSchema>>({
    resolver: zodResolver(tradingOperationSchema),
    defaultValues: {
      balanceId: balances[0]?.id ?? "",
      symbol: positions[0]?.symbol ?? "",
      side: "BUY",
      quantity: "",
      price: "",
      commission: "0.00",
      executedAt: toLocalDateTimeValue(),
    },
  })
  const [submitError, setSubmitError] = React.useState<unknown>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    const selectedBalanceId = form.getValues("balanceId")

    if (balances.length === 0) {
      if (selectedBalanceId) {
        form.setValue("balanceId", "")
      }
      return
    }

    const hasSelectedBalance = balances.some(
      (balance) => balance.id === selectedBalanceId,
    )

    if (!hasSelectedBalance) {
      form.setValue("balanceId", balances[0].id, {
        shouldValidate: true,
      })
    }
  }, [balances, form])

  const watched = form.watch()
  const gross = decimalToNumber(watched.quantity) * decimalToNumber(watched.price)
  const commission = decimalToNumber(watched.commission)
  const cashImpact = watched.side === "SELL" ? gross - commission : gross + commission

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await api.createTradingOperation(portfolioId, {
        balanceId: values.balanceId,
        symbol: values.symbol.trim().toUpperCase(),
        side: values.side,
        quantity: values.quantity.trim(),
        price: values.price.trim(),
        commission: values.commission.trim(),
        executedAt: fromLocalDateTimeValue(values.executedAt),
      })
      await invalidatePortfolioScope(queryClient, portfolioId)
      toast.success(`${values.side} operation recorded`)
      form.reset({
        balanceId: values.balanceId,
        symbol: values.symbol.trim().toUpperCase(),
        side: values.side,
        quantity: "",
        price: "",
        commission: "0.00",
        executedAt: toLocalDateTimeValue(),
      })
    } catch (error) {
      setSubmitError(error)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {balances.length === 0 ? (
        <StatusCallout title="Balances required before trading" tone="warning">
          Add at least one balance so the simulator has a settlement source for cash impact checks.
        </StatusCallout>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="trade-balance">Settlement balance</Label>
          <Controller
            control={form.control}
            name="balanceId"
            render={({ field }) => (
              <Select disabled={balances.length === 0} onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="trade-balance">
                  <SelectValue placeholder="Choose a balance" />
                </SelectTrigger>
                <SelectContent>
                  {balances.map((balance) => (
                    <SelectItem key={balance.id} value={balance.id}>
                      {balance.label} / {formatCurrency(balance.amount, balance.currency)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorText message={form.formState.errors.balanceId?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-side">Side</Label>
          <Controller
            control={form.control}
            name="side"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="trade-side">
                  <SelectValue placeholder="Choose a side" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">BUY</SelectItem>
                  <SelectItem value="SELL">SELL</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <FieldErrorText message={form.formState.errors.side?.message} />
        </div>
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="trade-symbol">Symbol</Label>
          <Input id="trade-symbol" list="tracked-symbols" placeholder="AAPL" {...form.register("symbol")} />
          <datalist id="tracked-symbols">
            {positions.map((position) => (
              <option key={position.id} value={position.symbol} />
            ))}
          </datalist>
          <FieldErrorText message={form.formState.errors.symbol?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-quantity">Quantity</Label>
          <Input id="trade-quantity" inputMode="decimal" placeholder="5" {...form.register("quantity")} />
          <FieldErrorText message={form.formState.errors.quantity?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-price">Price</Label>
          <Input id="trade-price" inputMode="decimal" placeholder="190.00" {...form.register("price")} />
          <FieldErrorText message={form.formState.errors.price?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-commission">Commission</Label>
          <Input id="trade-commission" inputMode="decimal" placeholder="3.50" {...form.register("commission")} />
          <FieldErrorText message={form.formState.errors.commission?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trade-executed-at">Trade date and time</Label>
          <Input id="trade-executed-at" type="datetime-local" {...form.register("executedAt")} />
          <FieldErrorText message={form.formState.errors.executedAt?.message} />
        </div>
      </div>

      <Card className="border-border/70 bg-muted/20 shadow-none">
        <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-emerald-700" />
          <span>
            {watched.side === "SELL" ? "Expected balance lift" : "Expected cash draw"} / {formatCurrency(cashImpact, currency)}
          </span>
        </CardContent>
      </Card>

      {submitError ? (
        <StatusCallout details={getErrorDetails(submitError)} title="Trade rejected" tone="error">
          {getErrorMessage(submitError)}
        </StatusCallout>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Button className="rounded-full" disabled={balances.length === 0 || isSubmitting} type="submit">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Submit simulation
        </Button>
      </div>
    </form>
  )
}

function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<unknown>(null)

  React.useEffect(() => {
    if (!open) {
      setSubmitError(null)
      setIsSubmitting(false)
    }
  }, [open])

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-[var(--font-display)] text-3xl">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {submitError ? (
          <StatusCallout details={getErrorDetails(submitError)} title="Delete failed" tone="error">
            {getErrorMessage(submitError)}
          </StatusCallout>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isSubmitting}
            onClick={async (event) => {
              event.preventDefault()
              if (isSubmitting) {
                return
              }
              setSubmitError(null)
              setIsSubmitting(true)
              try {
                await onConfirm()
                onOpenChange(false)
              } catch (error) {
                setSubmitError(error)
              } finally {
                setIsSubmitting(false)
              }
            }}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function MetricCard({
  eyebrow,
  icon: Icon,
  label,
  value,
  detail,
}: {
  eyebrow: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  detail: string
}) {
  return (
    <Card className="border-border/70 bg-background/90 shadow-sm backdrop-blur">
      <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {eyebrow}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </div>
          <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-700/10 bg-emerald-600/10 text-emerald-900">
            <Icon className="size-5" />
          </div>
        </div>
        <div>
          <p className="font-[var(--font-display)] text-4xl tracking-tight text-foreground">{value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusCallout({
  title,
  children,
  details,
  tone = "info",
}: React.PropsWithChildren<{
  title: string
  details?: string[]
  tone?: "info" | "warning" | "error"
}>) {
  const Icon = tone === "error" ? ShieldAlert : tone === "warning" ? CircleAlert : Sparkles

  return (
    <Alert
      className={cn(
        "rounded-3xl border",
        tone === "error" && "border-destructive/30 bg-destructive/5",
        tone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100",
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

function EmptyState({
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
        <h3 className="font-[var(--font-display)] text-3xl text-foreground">{title}</h3>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{children}</p>
      </div>
      {action}
    </div>
  )
}

function FieldErrorText({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-destructive">{message}</p>
}

function normalizeOptionalText(value: string | undefined): string | null {
  const normalized = value?.trim() ?? ""
  return normalized.length > 0 ? normalized : null
}

function isPositiveDecimal(value: string): boolean {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0
}

function isNonNegativeDecimal(value: string): boolean {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0
}

function isNotFoundError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError && error.code === "not_found"
}

const BASE_CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD"]

export default App
