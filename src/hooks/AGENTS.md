# FRONTEND HOOKS GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file only covers `src/hooks/`.

## OVERVIEW
`src/hooks/` wraps `src/lib/api.ts` with TanStack Query hooks for portfolios, balances, positions, trading operations, market data, and stock-analysis flows.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Portfolio list/detail mutations | `use-portfolios.ts` | list/detail hooks + portfolio invalidation |
| Balance flows | `use-balances.ts` | portfolio-scoped CRUD |
| Position + CSV flows | `use-positions.ts` | CRUD plus preview/commit imports |
| Trading operations | `use-trading-operations.ts` | list + create trading operations |
| Market data | `use-market-data.ts` | quotes/history with symbol guards |
| Global stock-analysis resources | `use-llm-configs.ts`, `use-prompt-templates.ts`, `use-snippets.ts` | list queries plus create/update/delete mutations with list/detail invalidation |
| Portfolio stock-analysis flows | `use-stock-analysis.ts` | settings, conversations, runs, versions, responses, preview |

## CONVENTIONS
- Portfolio-scoped query hooks accept `portfolioId | undefined`, derive a resolved id, and gate execution with `enabled`.
- Mutations invalidate either list/detail keys or `invalidatePortfolioScope()`; do not hand-roll cache clearing in components.
- Hooks wrap `src/lib/api.ts` only and keep server-state orchestration out of routed screens.
- `use-stock-analysis.ts` is the authority for prompt-preview, conversation, run, version, and response hook patterns.

## ANTI-PATTERNS
- Do not call `src/lib/api.ts` directly from routed screens when a hook already exists.
- Do not invent inline query keys in components.
- Do not mutate cache state ad hoc when invalidation helpers already model the scope.
- Do not hide API errors in hooks; let the caller decide how to surface them.

## NOTES
- Global stock-analysis resources use list/detail invalidation, while portfolio-scoped mutations fan out through `invalidatePortfolioScope()`.
- `usePromptPreview()` intentionally keys on the whole request object so preview output stays aligned with the composed payload.
