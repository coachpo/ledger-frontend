import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Dashboard } from "./pages/dashboard";
import { LLMConfigs } from "./pages/llm-configs";
import { PortfolioDetailPage } from "./pages/portfolios/detail";
import { PortfolioListPage } from "./pages/portfolios/list";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "llm-configs", Component: LLMConfigs },
      { path: "portfolios", Component: PortfolioListPage },
      { path: "portfolios/:portfolioId", Component: PortfolioDetailPage },
    ],
  },
]);
