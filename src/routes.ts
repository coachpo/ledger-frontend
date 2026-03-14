import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Dashboard } from "./components/dashboard";
import { PortfolioDetailPage } from "./components/portfolios/portfolio-detail-page";
import { PortfolioListPage } from "./components/portfolios/portfolio-list-page";
import { LLMConfigs } from "./components/llm-configs";
import { PromptTemplates } from "./components/prompt-templates";
import { Snippets } from "./components/snippets";
import { RunBuilderPage } from "./components/stock-analysis/run-builder-page";
import { ResponsesPage } from "./components/responses-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "portfolios", Component: PortfolioListPage },
      { path: "portfolios/:portfolioId", Component: PortfolioDetailPage },
      { path: "llm-configs", Component: LLMConfigs },
      { path: "templates", Component: PromptTemplates },
      { path: "snippets", Component: Snippets },
      { path: "requests", Component: RunBuilderPage },
      { path: "responses", Component: ResponsesPage },
    ],
  },
]);
