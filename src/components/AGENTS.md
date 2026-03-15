# FRONTEND COMPONENTS GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers shared components, feature-specific components, and UI primitives in `src/components/`.

## OVERVIEW
`src/components/` contains the layout shell, shared component library, portfolio-specific UI folders, and shadcn/ui primitives. Routed page components live in `src/pages/` and map to routes in `src/routes.ts`.

## STRUCTURE
```text
src/components/
├── layout.tsx              # sidebar shell, route framing
├── shared/                 # reusable components across features
│   ├── data-table.tsx
│   ├── data-table-column-header.tsx
│   ├── error-boundary.tsx
│   ├── form-schemas.ts
│   ├── metric-card.tsx
│   └── searchable-select.tsx
├── forms/
│   └── portfolio-form-dialog.tsx
├── portfolios/             # portfolio feature-specific components
│   ├── AGENTS.md
│   ├── balance-form-dialog.tsx
│   ├── confirm-delete-dialog.tsx
│   ├── portfolio-balances-section.tsx
│   ├── portfolio-positions-section.tsx
│   ├── portfolio-trades-section.tsx
│   ├── position-form-dialog.tsx
│   └── trading-operation-form.tsx
└── ui/                     # shadcn/ui primitives (auto-generated)
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App shell / navigation | `layout.tsx`, `shared/error-boundary.tsx` | sidebar shell, route framing, top-level error boundary |
| Shared components | `shared/` | reusable UI components across features |
| Form components | `forms/` | shared dialog forms that do not belong in a feature folder |
| Portfolio feature UI | `portfolios/AGENTS.md` | sections, dialogs, trading form, feature-specific logic |
| Pure UI primitives | `ui/` | shadcn/ui-style presentational components only |

## CONVENTIONS
- Routed page components live in `src/pages/` and are thin orchestration layers.
- Shared components in `shared/` are reusable across multiple features and should not contain portfolio-specific request logic.
- `forms/` is reserved for small shared form surfaces such as portfolio creation and editing dialogs.
- Feature-specific components in `portfolios/` own their domain logic and should not be reused outside that feature without a clear abstraction.
- `ui/` stays presentational; application state and request logic should stay in pages, shared, forms, or feature folders.

## ANTI-PATTERNS
- Do not put business rules or raw request code in `ui/` components.
- Do not put feature-specific logic in `shared/` components.
- Do not duplicate portfolio feature rules in shared components when the portfolio folder already owns them.
- Do not move feature-rich components into `ui/` just because they render cards or forms.
- Do not create one-off forms in feature folders when they should live in `forms/`.

## NOTES
- Page components are the thin orchestration layer; the real complexity lives in shared components, forms, portfolio feature folders, and hooks.
