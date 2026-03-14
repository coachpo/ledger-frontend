# FRONTEND COMPONENTS GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file covers routed screens and shared component boundaries in `src/components/`.

## OVERVIEW
`src/components/` contains the routed screen layer, the layout shell, feature folders, and the shared shadcn/ui primitives used throughout the app.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App shell / navigation | `layout.tsx`, `error-boundary.tsx` | sidebar shell, route framing, top-level error boundary |
| Dashboard landing page | `dashboard.tsx` | home route summary |
| Global stock-analysis resource pages | `llm-configs.tsx`, `prompt-templates.tsx`, `snippets.tsx` | top-level CRUD pages for global resources |
| Response browser | `responses-page.tsx` | top-level portfolio/conversation response filtering |
| Portfolio feature folder | `portfolios/AGENTS.md` | detail page, sections, dialogs, trading form |
| Stock-analysis feature folder | `stock-analysis/AGENTS.md` | run builder, mode fields, preview, run status |
| Pure UI primitives | `ui/` | shadcn/ui-style presentational components only |

## CONVENTIONS
- Top-level routed screens live here when they are not part of a deeper feature folder.
- Feature-heavy portfolio and stock-analysis rules belong in their child docs; this file only covers parent ownership and shared shell patterns.
- Routed screens compose hooks, lib helpers, and shadcn/ui primitives, then surface mutation feedback with toasts.
- `ui/` stays presentational; application state and request logic should stay in routed screens or feature folders.

## ANTI-PATTERNS
- Do not put business rules or raw request code in `ui/` components.
- Do not duplicate portfolio or stock-analysis feature rules here when a child doc already owns them.
- Do not bypass shared layout/error-boundary patterns when adding a new top-level route.
- Do not move feature-rich routed screens into `ui/` just because they render cards/forms.

## NOTES
- `responses-page.tsx` stays in this parent folder even though it is stock-analysis-adjacent, because the route is top-level alongside the other routed screens.
