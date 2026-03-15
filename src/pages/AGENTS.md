# FRONTEND PAGES GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers routed page components in `src/pages/`.

## OVERVIEW
`src/pages/` contains the top-level routed screen components that map directly to routes defined in `src/routes.ts`. Each page composes hooks, shared components, and portfolio UI to deliver a complete user-facing workflow.

## STRUCTURE
```text
src/pages/
├── dashboard.tsx          # home route summary
└── portfolios/
    ├── list.tsx          # portfolio workspace landing
    └── detail.tsx        # portfolio detail with balances/positions/trades
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Dashboard landing | `dashboard.tsx` | home route summary |
| Portfolio workspace | `portfolios/list.tsx`, `portfolios/detail.tsx` | portfolio list and detail workspace |

## CONVENTIONS
- Each page component maps to exactly one route in `src/routes.ts`.
- Pages compose hooks from `src/hooks/`, shared components from `src/components/shared/`, feature components from `src/components/portfolios/`, and UI primitives from `src/components/ui/`.
- Pages handle top-level data fetching, mutation feedback (toasts), and route-level error states.
- Pages should not contain business logic; delegate to hooks or feature-specific components.
- Feature-heavy workflows such as portfolio detail sections live in feature folders, not here.

## ANTI-PATTERNS
- Do not put business rules or complex state management directly in page components.
- Do not duplicate feature-specific logic here when a feature folder already owns it.
- Do not call `fetch` directly; use hooks from `src/hooks/` instead.
- Do not create ad-hoc query keys in pages; use canonical keys from `src/lib/query-keys.ts`.
- Do not bypass the layout shell or error boundary when adding a new page.

## NOTES
- Pages are thin orchestration layers; the real complexity lives in hooks, shared components, and portfolio feature folders.
- Portfolio detail pages are routable but not exposed separately in the sidebar; they are reachable from the portfolio workspace.
