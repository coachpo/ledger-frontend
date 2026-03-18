# FRONTEND LIB GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file only covers `src/lib/`.

## OVERVIEW
`src/lib/` owns the frontend API contract, query-key naming, derived portfolio analytics, formatting helpers, markdown formatting, and shared type definitions for portfolio, market-data, CSV, template, and report flows.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| HTTP wrapper / error mapping | `api-client.ts` | `request()`, `ApiRequestError`, `buildUrl()`, CSV form-data helpers |
| API endpoint functions | `api/*.ts` | domain-specific modules for portfolios, balances, positions, trading operations, market data, templates, and reports |
| Backward compatibility | `api.ts`, `api-types.ts` | barrel re-exports for live modules and wire types |
| Shared wire types | `types/*.ts` | domain-specific type definitions, including text-template and report types |
| Query key factory | `query-keys.ts` | hierarchical keys, param normalization, template/report keys, `invalidatePortfolioScope()` |
| Portfolio analytics | `portfolio-analytics.ts` | quote enrichment, market value, PnL, allocation |
| Display formatting | `format.ts` | currency, decimal, percent, date/datetime, compact numbers |
| Markdown formatting | `markdown-format.ts` | Prettier-backed markdown normalization for the template editor |
| Unit coverage | `api.test.ts`, `query-keys.test.ts`, `portfolio-analytics.test.ts`, `format.test.ts` | contract and helper regressions |

## CONVENTIONS
- `api-client.ts` is the only place that should know the base URL, query-string encoding, and error-envelope parsing.
- `api-client.ts` falls back to `http://127.0.0.1:8000/api/v1` only when `VITE_API_BASE_URL` is absent; `start.sh` and Playwright override that value for real runs.
- Domain-specific API functions live in `api/*.ts` modules, organized by resource type.
- `api.ts` and `api-types.ts` are barrel files that re-export the live modules for backward compatibility.
- Wire decimals remain strings until shared format/analytics helpers convert them for display math.
- `query-keys.ts` normalizes symbols and filter params so cache keys stay stable across callers.
- `invalidatePortfolioScope()` is the default invalidation path for portfolio-scoped mutations; templates use their own `queryKeys.templates.*` namespace.
- Report flows use `queryKeys.reports.*`; `downloadReportUrl()` stays in the API layer because it builds the absolute file URL from the configured API base.

## ANTI-PATTERNS
- Do not hard-code endpoint paths or duplicate `request()` behavior in hooks/components.
- Do not bypass `api-client.ts` and call `fetch` directly.
- Do not create API functions outside the `api/*.ts` domain modules.
- Do not invent new query-key shapes outside `query-keys.ts`.
- Do not duplicate backend contract types when `types/*.ts` already exposes them.
- Do not change template, CSV, or error-envelope shapes here without updating the backend contract and the calling hooks/pages.
- Do not change report, upload-metadata, or placeholder-tree shapes here without updating the backend contract and the calling hooks/pages.
- Do not mix presentation-only formatting into API wrapper code.

## VALIDATION
```bash
cd frontend
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

## NOTES
- `api.ts` is a convenience barrel for the live portfolio, balance, position, trading-operation, market-data, template, and report modules.
- `markdown-format.ts` centralizes Prettier-based markdown cleanup so the template editor does not embed formatter setup inline.
- `portfolio-analytics.ts` is where quote-enriched position math belongs, not in routed screens.
