# FRONTEND LIB GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file only covers `src/lib/`.

## OVERVIEW
`src/lib/` owns the frontend's API contract, query-key naming, derived portfolio analytics, and formatting helpers.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| HTTP wrapper / error mapping | `api.ts` | `request()`, `ApiRequestError`, endpoint functions |
| Shared wire types | `api-types.ts` | TypeScript mirror of backend contracts |
| Query key factory | `query-keys.ts` | hierarchical keys, param normalization, `invalidatePortfolioScope()` |
| Portfolio analytics | `portfolio-analytics.ts` | quote enrichment, market value, PnL, allocation |
| Display formatting | `format.ts` | currency, decimal, percent, date/datetime, compact numbers |
| Unit coverage | `api.test.ts`, `portfolio-analytics.test.ts`, `format.test.ts` | contract and helper regressions |

## CONVENTIONS
- `api.ts` is the only place that should know the base URL, query-string encoding, and error-envelope parsing.
- Wire decimals remain strings until shared format/analytics helpers convert them for display math.
- `query-keys.ts` normalizes symbols and filter params so cache keys stay stable across callers.
- `invalidatePortfolioScope()` is the default invalidation path for portfolio-scoped mutations.

## ANTI-PATTERNS
- Do not hard-code endpoint paths or duplicate `request()` behavior in hooks/components.
- Do not invent new query-key shapes outside `query-keys.ts`.
- Do not duplicate backend contract types when `api-types.ts` already exposes them.
- Do not mix presentation-only formatting into API wrapper code.

## NOTES
- `api.ts` separates global stock-analysis resources from portfolio-scoped endpoints.
- `portfolio-analytics.ts` is where quote-enriched position math belongs, not in routed screens.
