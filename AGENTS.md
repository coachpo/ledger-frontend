# FRONTEND GUIDE

> Inherits root rules from `/AGENTS.md`. Local frontend docs live under `src/*/AGENTS.md`.

## OVERVIEW
React 19 + Vite frontend with a flat route shell, TanStack Query for server state, shadcn/ui primitives, and Playwright-backed end-to-end coverage.

## CHILD DOCS
- `src/lib/AGENTS.md` — API client, query keys, analytics, formatting
- `src/hooks/AGENTS.md` — TanStack Query wrappers and invalidation patterns
- `src/pages/AGENTS.md` — routed page components and orchestration patterns
- `src/components/AGENTS.md` — shared components, forms, feature folders, and UI primitives
- `src/components/portfolios/AGENTS.md` — portfolio feature-specific components, sections, dialogs, trading forms
- `src/components/stock-analysis/AGENTS.md` — stock-analysis feature-specific components, run builder, preview, conversation

## STRUCTURE
```text
frontend/
├── src/lib/            # API contract, query keys, formatting, analytics
├── src/hooks/          # TanStack Query hooks wrapping lib/api.ts
├── src/pages/          # routed page components mapping to routes
├── src/components/     # shared components, forms, feature folders, shadcn/ui primitives
├── src/test/           # Vitest jsdom setup
├── e2e/                # Playwright smoke + functional specs
└── scripts/            # Playwright backend/frontend startup helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App bootstrap | `src/App.tsx`, `src/routes.ts`, `src/components/layout.tsx` | query client, router provider, ten child routes, seven sidebar destinations |
| Shared API/state logic | `src/lib/AGENTS.md`, `src/hooks/AGENTS.md` | typed fetch, query keys, analytics, TanStack Query wrappers |
| Routed page components | `src/pages/AGENTS.md` | dashboard, LLM resources, responses, portfolio, stock-analysis pages |
| Shared components | `src/components/AGENTS.md` | layout shell, shared UI, forms, feature folders |
| Portfolio feature UI | `src/components/portfolios/AGENTS.md` | detail sections, dialogs, trading form |
| Stock-analysis feature UI | `src/components/stock-analysis/AGENTS.md` | run builder, preview, conversation, feature-specific logic |
| Unit test setup | `vite.config.ts`, `src/test/setup.ts` | jsdom config + browser API mocks |
| E2E flow setup | `playwright.config.ts`, `scripts/start-playwright-*.mjs` | backend `8001`, frontend `4173` |

## CONVENTIONS
- Routing stays flat under `Layout`; feature depth lives inside components, not in nested route trees.
- Server data flows through `src/lib/api.ts` and `src/hooks/*`; routed screens should not call `fetch` directly.
- Use the `@` alias for `src/` imports instead of long relative paths.
- Mutation-heavy screens use Sonner toasts for success/error feedback and shadcn/ui primitives for dialogs/forms.

## ANTI-PATTERNS
- Do not hard-code API URLs or call `fetch` directly from routed screens.
- Do not invent ad-hoc query keys or parse decimal strings in pages when shared helpers already exist.
- Do not put feature-heavy routed screens in `src/components/ui/`.
- Do not blur the boundary between global stock-analysis resources and portfolio-scoped workflows.

## COMMANDS
```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm test:run
pnpm test:e2e
```

## NOTES
- `vite.config.ts` sets up the `@` alias and jsdom-based Vitest runs.
- Playwright only runs Chromium here and starts both backend/frontend web servers automatically.
- The router currently has ten child routes under `Layout`; the sidebar exposes seven destinations because portfolio detail and create pages are reachable from the workspace rather than the nav.
