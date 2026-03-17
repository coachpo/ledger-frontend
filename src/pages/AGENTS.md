# FRONTEND PAGES GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers routed page components in `src/pages/`.

## OVERVIEW
`src/pages/` contains the top-level routed screen components that map directly to routes defined in `src/routes.ts`. Each page composes hooks, shared components, portfolio UI, or template UI to deliver a complete user-facing workflow.

## STRUCTURE
```text
src/pages/
├── dashboard.tsx           # home route summary
├── portfolios/
│   ├── list.tsx            # portfolio workspace landing
│   └── detail.tsx          # portfolio detail with balances/positions/trades
└── templates/
    ├── list.tsx            # stored-template list and delete flow
    └── editor.tsx          # full-height editor, inline compile preview, placeholder browser
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Dashboard landing | `dashboard.tsx` | home route summary and retry state |
| Portfolio workspace | `portfolios/list.tsx`, `portfolios/detail.tsx` | portfolio list and detail workspace |
| Template list | `templates/list.tsx` | stored-template CRUD entrypoint |
| Template editor | `templates/editor.tsx` | inline compile preview, placeholder insertion, full-height route |

## CONVENTIONS
- Each page component maps to exactly one route in `src/routes.ts`.
- Pages compose hooks from `src/hooks/`, shared components from `src/components/shared/`, feature components from `src/components/portfolios/`, and UI primitives from `src/components/ui/`.
- Pages handle top-level data fetching, mutation feedback (toasts), and route-level error states.
- Pages should not contain business logic; delegate to hooks or feature-specific components.
- The template editor page uses `useDebounce()`, `useCompileInline()`, and `usePlaceholders()` to keep preview and placeholder browsing responsive without moving that orchestration into the component library.

## ANTI-PATTERNS
- Do not put business rules or complex state management directly in page components.
- Do not duplicate feature-specific logic here when a feature folder or hook already owns it.
- Do not call `fetch` directly; use hooks from `src/hooks/` instead.
- Do not create ad-hoc query keys in pages; use canonical keys from `src/lib/query-keys.ts`.
- Do not bypass the layout shell, error boundary, or template-editor full-height layout rules when adding a new page.

## VALIDATION
```bash
cd frontend
pnpm lint
pnpm typecheck
pnpm build
pnpm test:run
pnpm test:e2e
```

## NOTES
- Pages are thin orchestration layers; the real complexity lives in hooks, shared components, and feature folders.
- Portfolio detail pages are routable but not exposed separately in the sidebar; template list/editor routes are first-class entries in the main navigation.
