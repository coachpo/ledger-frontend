# FRONTEND COMPONENTS GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers shared components, feature-specific components, and UI primitives in `src/components/`.

## OVERVIEW
`src/components/` contains the layout shell, shared component library, feature-specific UI folders, and shadcn/ui primitives. Routed page components live in `src/pages/` and map to routes in `src/routes.ts`.

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
├── forms/                  # form components and form-related utilities
│   ├── llm-config-form.tsx
│   ├── portfolio-form-dialog.tsx
│   ├── prompt-template-form.tsx
│   └── snippet-form.tsx
├── portfolios/             # portfolio feature-specific components (flat structure)
│   ├── AGENTS.md
│   ├── balance-form-dialog.tsx
│   ├── confirm-delete-dialog.tsx
│   ├── portfolio-balances-section.tsx
│   ├── portfolio-positions-section.tsx
│   ├── portfolio-trades-section.tsx
│   ├── position-form-dialog.tsx
│   └── trading-operation-form.tsx
├── stock-analysis/         # stock-analysis feature-specific components (flat structure)
│   ├── AGENTS.md
│   ├── conversation-picker.tsx
│   ├── prompt-preview-panel.tsx
│   ├── run-builder-form.tsx
│   ├── run-builder-mode-fields.tsx
│   └── run-status-display.tsx
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
