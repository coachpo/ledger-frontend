# FRONTEND GUIDE

> Inherits root rules from `/AGENTS.md`. Portfolio feature specifics live in `src/components/portfolios/AGENTS.md`.

## OVERVIEW
React 19 + Vite frontend with TanStack Query, shadcn/Radix primitives, Zod-backed forms, Vitest unit tests, and Playwright end-to-end tests.

## STRUCTURE
```text
frontend/
├── src/App.tsx                  # router shell + QueryClient + ThemeProvider
├── src/components/ui/           # generic primitives with data-slot markers
├── src/components/portfolios/   # app-specific portfolio workspace
├── src/components/theme/        # theme provider/toggle
├── src/hooks/                   # small reusable hooks
├── src/lib/                     # API client, analytics, query keys, formatting
├── src/test/                    # Vitest setup
├── e2e/                         # Playwright scenarios
├── vite.config.ts               # Vite + Tailwind + Vitest config
└── playwright.config.ts         # dual-server E2E orchestration
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Add/change route | `src/App.tsx` | portfolio pages are nested routes |
| Change fetch contract/types | `src/lib/api.ts` | base URL, request wrapper, error typing |
| Change query invalidation | `src/lib/query-keys.ts` | reuse existing factory + invalidator |
| Add calculations/formatting | `src/lib/portfolio-analytics.ts`, `workspace.ts`, `format.ts` | shared helpers live here |
| Add generic primitive | `src/components/ui/` | keep app logic out |
| Portfolio feature work | `src/components/portfolios/AGENTS.md` | leaf doc for local rules |
| Theme / preferences | `src/components/theme/` + `src/hooks/use-user-preferences.ts` | persistent UI settings |
| Unit tests | `src/lib/*.test.ts` + `src/test/setup.ts` | current unit coverage lives here |
| E2E flows | `e2e/app.spec.ts` + `playwright.config.ts` | cross-app startup assumptions |

## CONVENTIONS
- Use the `@/` alias, not long relative imports.
- Keep backend contract types in `src/lib/api.ts`; update request handling and exported interfaces together.
- TanStack Query keys come from `queryKeys`; invalidation uses `invalidatePortfolioScope`.
- API decimal values stay as strings until shared helpers convert them for display/analytics.
- `components/ui` wraps generic primitives with `cn(...)`, variants, and `data-slot` markers; do not leak portfolio-specific logic into it.
- Form schemas and discriminated trading-operation types live in `src/components/portfolios/model.ts`.
- `vite.config.ts` manually chunks `recharts` into `charts` and form libraries into `forms`; preserve that intent when changing bundling.

## ANTI-PATTERNS
- Do not hardcode fetch URLs outside `src/lib/api.ts`.
- Do not invent ad-hoc query keys or inline invalidation paths.
- Do not move app-specific portfolio flows into `components/ui`.
- Do not assume market data is always present; the UI already supports delayed/stale/unavailable states.
- Do not assume Playwright ports match normal dev ports.

## COMMANDS
```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
pnpm test
pnpm test:e2e
```

## NOTES
- Playwright boots backend `8001` + frontend `4173`; normal local dev uses backend `8000` + frontend `5173`.
- Current unit tests live in `src/lib`; component/hook coverage is still thin.
