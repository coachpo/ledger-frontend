import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { AssetDetailPage } from "@/components/portfolios/asset-detail-page"
import { PortfolioAnalysisPage } from "@/components/portfolios/portfolio-analysis-page"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppFrame } from "@/components/portfolios/app-frame"
import { PortfolioHistoryPage } from "@/components/portfolios/portfolio-history-page"
import { PortfolioListPage } from "@/components/portfolios/portfolio-list-page"
import { PortfolioOverviewPage } from "@/components/portfolios/portfolio-overview-page"
import { PortfolioTradePage } from "@/components/portfolios/portfolio-trade-page"
import { PortfolioWorkspaceLayout } from "@/components/portfolios/portfolio-workspace-layout"
import { ThemeProvider } from "@/components/theme/theme-provider"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
        storageKey="ledger-ui-theme"
      >
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppFrame />}>
                <Route index element={<Navigate replace to="/portfolios" />} />
                <Route path="/portfolios" element={<PortfolioListPage />} />
                <Route path="/portfolios/:portfolioId" element={<PortfolioWorkspaceLayout />}>
                  <Route index element={<Navigate replace to="overview" />} />
                  <Route path="overview" element={<PortfolioOverviewPage />} />
                  <Route path="trades/new" element={<PortfolioTradePage />} />
                  <Route path="transactions" element={<PortfolioHistoryPage />} />
                  <Route path="analysis" element={<PortfolioAnalysisPage />} />
                  <Route path="assets/:symbol" element={<AssetDetailPage />} />
                </Route>
                <Route path="*" element={<Navigate replace to="/portfolios" />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        <Toaster closeButton position="top-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
