# FRONTEND PAGES GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers routed page components in `src/pages/`.

## OVERVIEW
`src/pages/` contains the top-level routed screen components that map directly to routes defined in `src/routes.ts`. Each page composes hooks, shared components, and feature-specific UI to deliver a complete user-facing workflow.

## STRUCTURE
```text
src/pages/
├── dashboard.tsx              # home route summary
├── llm-configs.tsx            # global LLM config CRUD
├── prompt-templates.tsx       # global prompt template CRUD
├── snippets.tsx               # global snippet CRUD
├── responses.tsx              # portfolio/conversation response filtering
├── portfolio-list.tsx         # portfolio workspace landing
├── portfolio-detail.tsx       # portfolio detail with balances/positions/trades
├── portfolio-create.tsx       # portfolio creation form
├── stock-analysis-run.tsx     # stock-analysis run builder and executor
└── stock-analysis-responses.tsx # stock-analysis response history
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Dashboard landing | `dashboard.tsx` | home route summary |
| Global LLM resources | `llm-configs.tsx`, `prompt-templates.tsx`, `snippets.tsx` | top-level CRUD pages for global resources |
| Response browser | `responses.tsx` | top-level portfolio/conversation response filtering |
| Portfolio workspace | `portfolio-list.tsx`, `portfolio-detail.tsx`, `portfolio-create.tsx` | portfolio CRUD and detail workspace |
| Stock-analysis workflows | `stock-analysis-run.tsx`, `stock-analysis-responses.tsx` | run builder, executor, and response history |

## CONVENTIONS
- Each page component maps to exactly one route in `src/routes.ts`.
- Pages compose hooks from `src/hooks/`, shared components from `src/components/shared/`, feature components from `src/components/portfolios/` or `src/components/stock-analysis/`, and UI primitives from `src/components/ui/`.
- Pages handle top-level data fetching, mutation feedback (toasts), and route-level error states.
- Pages should not contain business logic; delegate to hooks, services, or feature-specific components.
- Feature-heavy workflows (portfolio detail sections, stock-analysis run builder) live in feature folders, not here.

## ANTI-PATTERNS
- Do not put business rules or complex state management directly in page components.
- Do not duplicate feature-specific logic here when a feature folder already owns it.
- Do not call `fetch` directly; use hooks from `src/hooks/` instead.
- Do not create ad-hoc query keys in pages; use canonical keys from `src/lib/query-keys.ts`.
- Do not bypass the layout shell or error boundary when adding a new page.

## NOTES
- Pages are thin orchestration layers; the real complexity lives in hooks, shared components, and feature folders.
- Portfolio detail and create pages are routable but not exposed in the sidebar; they are reachable from the portfolio workspace.
- Stock-analysis pages handle both global resource management and portfolio-scoped workflows through route parameters.
