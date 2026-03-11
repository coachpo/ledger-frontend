import * as React from "react"
import {
  BriefcaseBusiness,
  FolderOpenDot,
  PanelLeft,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  Link,
  Outlet,
  useMatch,
} from "react-router-dom"

import { api, type PortfolioRead } from "@/lib/api"
import { queryKeys } from "@/lib/query-keys"
import { sortPortfolios } from "@/lib/workspace"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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

export function AppFrame() {
  const nestedMatch = useMatch("/portfolios/:portfolioId/*")
  const exactMatch = useMatch("/portfolios/:portfolioId")
  const activeMatch = nestedMatch ?? exactMatch
  const portfoliosQuery = useQuery({
    queryKey: queryKeys.portfolios(),
    queryFn: api.listPortfolios,
  })

  const sortedPortfolios = React.useMemo(
    () => sortPortfolios(portfoliosQuery.data ?? []),
    [portfoliosQuery.data],
  )

  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          "--sidebar-width": "240px",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <LedgerSidebar
        activePortfolioId={activeMatch?.params.portfolioId ?? null}
        isLoading={portfoliosQuery.isPending}
        portfolios={sortedPortfolios}
      />
      <SidebarInset className="bg-[linear-gradient(180deg,rgba(252,248,239,0.98),rgba(247,243,235,0.98))]">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
          <div className="flex items-center px-4 py-3 md:px-6">
            <SidebarTrigger className="-ml-1" />
          </div>
        </header>

        <main className="relative flex-1 px-4 pb-10 pt-6 md:px-6">
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
            <SidebarMenuButton asChild className="h-auto p-0 hover:bg-transparent" size="lg">
              <Link
                aria-label="Ledger"
                className="flex items-center gap-3 px-2 py-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                to="/portfolios"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#0f766e,#164e63)] text-white">
                  <BriefcaseBusiness className="size-4.5" />
                </div>
                <p className="font-[var(--font-display)] text-lg text-foreground group-data-[collapsible=icon]:hidden">
                  Ledger
                </p>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
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
                    No portfolios
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
    </Sidebar>
  )
}
