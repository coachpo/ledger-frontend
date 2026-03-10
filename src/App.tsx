import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppFrame } from "@/components/portfolios/app-frame"
import { PortfolioDetailPage } from "@/components/portfolios/portfolio-detail-page"
import { PortfolioListPage } from "@/components/portfolios/portfolio-list-page"

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
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppFrame />}>
              <Route index element={<Navigate replace to="/portfolios" />} />
              <Route path="/portfolios" element={<PortfolioListPage />} />
              <Route
                path="/portfolios/:portfolioId"
                element={<PortfolioDetailPage />}
              />
              <Route path="*" element={<Navigate replace to="/portfolios" />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      <Toaster closeButton position="top-right" richColors />
    </QueryClientProvider>
  )
}

export default App
