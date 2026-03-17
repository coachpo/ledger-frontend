# FRONTEND GUIDE

> Inherits root rules from `/AGENTS.md`. Local frontend docs live under `src/*/AGENTS.md`.

## OVERVIEW
React 19 + Vite frontend with a flat route shell, TanStack Query for server state, a template editor with inline compile preview, shadcn/ui primitives, and Playwright-backed end-to-end coverage.

## CHILD DOCS
- `src/lib/AGENTS.md` — API client, query keys, analytics, formatting, template contracts
- `src/hooks/AGENTS.md` — TanStack Query wrappers and invalidation patterns
- `src/pages/AGENTS.md` — routed page components and orchestration patterns
- `src/components/AGENTS.md` — layout shell, theme system, shared components, forms, feature UI, primitives
- `src/components/portfolios/AGENTS.md` — portfolio feature sections, dialogs, tables, and trading forms

## STRUCTURE
```text
frontend/
├── src/lib/            # API contract, query keys, formatting, analytics, types
├── src/hooks/          # TanStack Query hooks wrapping lib/api modules
├── src/pages/          # dashboard, portfolio routes, template routes
├── src/components/     # layout shell, theme, shared UI, forms, portfolio feature UI, shadcn primitives
├── src/styles/         # fonts, theme tokens, global styles
├── src/test/           # Vitest jsdom setup
├── e2e/                # Playwright smoke + functional specs
└── scripts/            # Playwright backend/frontend startup helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App bootstrap | `src/App.tsx`, `src/routes.ts`, `src/components/layout.tsx` | query client, router provider, layout shell, theme toggle |
| Shared API/state logic | `src/lib/AGENTS.md`, `src/hooks/AGENTS.md` | typed fetch, query keys, analytics, TanStack Query wrappers |
| Portfolio routes | `src/pages/portfolios/*.tsx`, `src/components/portfolios/AGENTS.md` | list/detail workspace, balances, positions, trades |
| Template routes | `src/pages/templates/*.tsx`, `src/hooks/use-templates.ts`, `src/lib/api/templates.ts` | CRUD, placeholder tree, inline preview compile |
| Shared components | `src/components/AGENTS.md` | layout shell, theme, shared UI, forms, portfolio feature folders |
| Unit test setup | `vite.config.ts`, `src/test/setup.ts` | jsdom config + browser API mocks |
| E2E flow setup | `playwright.config.ts`, `scripts/start-playwright-*.mjs` | backend `8001`, frontend `4173` |

## CONVENTIONS
- Routing stays flat under `Layout`; feature depth lives inside components and hooks, not in nested route trees.
- Server data flows through `src/lib/api*.ts` and `src/hooks/*`; routed screens should not call `fetch` directly.
- Use the `@` alias for `src/` imports instead of long relative paths.
- Mutation-heavy screens use Sonner toasts for success/error feedback and shadcn/ui primitives for dialogs/forms.
- The template editor route is still inside the main shell, but `Layout` gives it a full-height content region instead of the usual scroll container.
- Theme state lives in `src/components/theme-provider.tsx`; components should consume the existing context instead of inventing new color-mode state.

## ANTI-PATTERNS
- Do not hard-code API URLs or call `fetch` directly from routed screens.
- Do not invent ad-hoc query keys or parse decimal strings in pages when shared helpers already exist.
- Do not put feature-heavy routed screens in `src/components/ui/`.
- Do not change template route, placeholder, or query-key shapes without updating hooks, types, and tests together.
- Do not add dead routes or unused API modules without wiring them into the actual router and tests.

## COMMANDS
```bash
pnpm install
pnpm dev
pnpm preview
```

## VALIDATION
```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test:run
pnpm test:e2e
```

## NOTES
- `vite.config.ts` sets up the `@` alias, Vitest jsdom mode, and manual chunking for framework/data/ui/forms/date/vendor bundles.
- Playwright only runs Chromium here and starts both backend/frontend web servers automatically.
- The live router exposes dashboard, portfolio list/detail, template list, and template editor routes.
