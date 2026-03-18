# FRONTEND COMPONENTS GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers shared components, feature-specific components, and UI primitives in `src/components/`.

## OVERVIEW
`src/components/` contains the layout shell, theme system, shared component library, portfolio-specific UI folders, and shadcn/ui primitives. Routed page components live in `src/pages/` and map to routes in `src/routes.ts`, including the report flows that reuse the shared shell and dialogs.

## STRUCTURE
```text
src/components/
├── layout.tsx              # sidebar shell, breadcrumbs, route framing
├── theme-provider.tsx      # localStorage + system theme sync
├── theme-toggle.tsx        # header control for light/dark/system
├── theme.ts                # theme context types
├── shared/                 # reusable components across features
├── forms/                  # cross-feature dialog forms
├── portfolios/             # portfolio feature-specific components
│   └── AGENTS.md
└── ui/                     # shadcn/ui primitives and helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App shell / navigation | `layout.tsx`, `shared/error-boundary.tsx` | sidebar shell, portfolio/template/report nav, top-level error boundary |
| Theme behavior | `theme-provider.tsx`, `theme-toggle.tsx`, `theme.ts` | persisted theme state and system-sync logic |
| Shared components | `shared/` | reusable UI components across features |
| Form components | `forms/` | shared dialog forms that do not belong in a feature folder |
| Portfolio feature UI | `portfolios/AGENTS.md` | sections, dialogs, trading form, feature-specific logic |
| Pure UI primitives | `ui/` | shadcn/ui-style presentational components only |

## CONVENTIONS
- Routed page components live in `src/pages/` and are thin orchestration layers.
- Shared components in `shared/` are reusable across multiple features and should not contain portfolio-specific request logic.
- `forms/` is reserved for small cross-feature form surfaces such as portfolio creation and editing dialogs.
- Feature-specific components in `portfolios/` own their domain logic and should not be reused outside that feature without a clear abstraction.
- Report routes currently stay page-centric and reuse shared components such as `ConfirmDeleteDialog` instead of maintaining a dedicated `components/reports/` feature folder.
- Theme state lives in `theme-provider.tsx`; leaf components should consume the existing context instead of creating new theme state.
- `ui/` stays presentational; application state and request logic should stay in pages, shared, forms, or feature folders.

## ANTI-PATTERNS
- Do not put business rules or raw request code in `ui/` components.
- Do not put feature-specific logic in `shared/` components.
- Do not duplicate portfolio feature rules in shared components when the portfolio folder already owns them.
- Do not move feature-rich components into `ui/` just because they render cards or forms.
- Do not create one-off forms in feature folders when they should live in `forms/` or a shared dialog component.
- Do not create a `components/reports/` folder just to wrap page-local report markup unless report UI genuinely becomes reusable across routes.

## VALIDATION
```bash
cd frontend
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

## NOTES
- `Layout` switches between the usual scroll container and a full-height outlet for template editor routes.
- `Layout` owns the Reports sidebar entry and breadcrumb labels for both `/reports` and `/reports/:slug`.
- Page components stay thin; the real complexity lives in hooks, shared components, forms, and portfolio feature folders.
