# FRONTEND COMPONENTS GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers shared components, feature-specific components, and UI primitives in `src/components/`.

## OVERVIEW
`src/components/` contains the layout shell, shared component library, feature-specific UI folders, and shadcn/ui primitives. Routed page components live in `src/pages/` and map to routes in `src/routes.ts`.

## STRUCTURE
```text
src/components/
├── layout.tsx              # sidebar shell, route framing
├── error-boundary.tsx      # top-level error boundary
├── shared/                 # reusable components across features
│   ├── header.tsx
│   ├── footer.tsx
│   ├── loading-spinner.tsx
│   ├── empty-state.tsx
│   ├── data-table.tsx
│   └── pagination.tsx
├── forms/                  # form components and form-related utilities
│   ├── portfolio-form.tsx
│   ├── trade-form.tsx
│   ├── llm-config-form.tsx
│   └── prompt-template-form.tsx
├── portfolios/             # portfolio feature-specific components
│   ├── AGENTS.md
│   ├── portfolio-sections/
│   ├── portfolio-dialogs/
│   └── trading-form/
├── stock-analysis/         # stock-analysis feature-specific components
│   ├── AGENTS.md
│   ├── run-builder/
│   ├── preview/
│   └── conversation/
└── ui/                     # shadcn/ui primitives (auto-generated)
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App shell / navigation | `layout.tsx`, `error-boundary.tsx` | sidebar shell, route framing, top-level error boundary |
| Shared components | `shared/` | reusable UI components across features |
| Form components | `forms/` | portfolio, trade, and LLM resource forms |
| Portfolio feature UI | `portfolios/AGENTS.md` | sections, dialogs, trading form, feature-specific logic |
| Stock-analysis feature UI | `stock-analysis/AGENTS.md` | run builder, preview, conversation, feature-specific logic |
| Pure UI primitives | `ui/` | shadcn/ui-style presentational components only |

## CONVENTIONS
- Routed page components live in `src/pages/` and are thin orchestration layers.
- Shared components in `shared/` are reusable across multiple features and should not contain feature-specific logic.
- Form components in `forms/` handle form state and validation for portfolio, trade, and LLM resource creation/editing.
- Feature-specific components in `portfolios/` and `stock-analysis/` own their domain logic and should not be reused outside their feature.
- `ui/` stays presentational; application state and request logic should stay in pages, shared, forms, or feature folders.

## ANTI-PATTERNS
- Do not put business rules or raw request code in `ui/` components.
- Do not put feature-specific logic in `shared/` components.
- Do not duplicate portfolio or stock-analysis feature rules in shared components when a feature folder already owns them.
- Do not move feature-rich components into `ui/` just because they render cards/forms.
- Do not create form components in feature folders when they should live in `forms/`.

## NOTES
- Page components are the thin orchestration layer; the real complexity lives in shared components, forms, feature folders, and hooks.
- Feature folders (`portfolios/`, `stock-analysis/`) have their own AGENTS.md files documenting domain-specific patterns.
