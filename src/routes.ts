import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { Dashboard } from "./pages/dashboard";
import { PortfolioDetailPage } from "./pages/portfolios/detail";
import { PortfolioListPage } from "./pages/portfolios/list";
import { RunBuilderPage } from "./pages/stock-analysis/run-builder";
import { LLMConfigs } from "./pages/llm-configs";
import { PromptTemplateCreatePage } from "./pages/create/prompt-template";
import { PromptTemplates } from "./pages/prompt-templates";
import { SnippetCreatePage } from "./pages/create/snippet";
import { Snippets } from "./pages/snippets";
import { ResponsesPage } from "./pages/responses";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "portfolios", Component: PortfolioListPage },
      { path: "portfolios/:portfolioId", Component: PortfolioDetailPage },
      { path: "llm-configs", Component: LLMConfigs },
      { path: "templates/new", Component: PromptTemplateCreatePage },
      { path: "templates", Component: PromptTemplates },
      { path: "snippets/new", Component: SnippetCreatePage },
      { path: "snippets", Component: Snippets },
      { path: "requests", Component: RunBuilderPage },
      { path: "responses", Component: ResponsesPage },
    ],
  },
]);
