# FRONTEND GUIDE

> Inherits root rules from `/AGENTS.md`. Local frontend docs live under `src/*/AGENTS.md`.

## OVERVIEW
React 19 + Vite frontend with a flat route shell, TanStack Query for server state, shadcn/ui primitives, and Playwright-backed end-to-end coverage.

## CHILD DOCS
- `src/lib/AGENTS.md` — API client, query keys, analytics, formatting
- `src/hooks/AGENTS.md` — TanStack Query wrappers and invalidation patterns
- `src/pages/AGENTS.md` — routed page components and orchestration patterns
- `src/components/AGENTS.md` — shared components, forms, portfolio UI, and primitives
- `src/components/portfolios/AGENTS.md` — portfolio feature-specific sections, dialogs, and trading forms

## STRUCTURE
```text
frontend/
├── src/lib/            # API contract, query keys, formatting, analytics
├── src/hooks/          # TanStack Query hooks wrapping lib/api.ts
├── src/pages/          # routed page components mapping to routes
├── src/components/     # shared components, forms, portfolio feature UI, shadcn/ui primitives
├── src/test/           # Vitest jsdom setup
├── e2e/                # Playwright smoke + functional specs
└── scripts/            # Playwright backend/frontend startup helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| App bootstrap | `src/App.tsx`, `src/routes.ts`, `src/components/layout.tsx` | query client, router provider, dashboard + portfolio routes |
| Shared API/state logic | `src/lib/AGENTS.md`, `src/hooks/AGENTS.md` | typed fetch, query keys, analytics, TanStack Query wrappers |
| Routed page components | `src/pages/AGENTS.md` | dashboard plus portfolio list/detail pages |
| Shared components | `src/components/AGENTS.md` | layout shell, shared UI, forms, portfolio feature folders |
| Portfolio feature UI | `src/components/portfolios/AGENTS.md` | detail sections, dialogs, trading form |
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
- Do not add dead routes or unused API modules without wiring them into the actual router and tests.

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
- The live router exposes dashboard, portfolio list, and portfolio detail routes; create/edit flows are dialog-driven from those screens.
