# PORTFOLIO FEATURE GUIDE

> Inherits `/AGENTS.md` and `/frontend/AGENTS.md`. This file only covers local feature rules.

## OVERVIEW
This subtree owns the portfolio register and workspace: overview, trade entry, history, analysis, asset detail, CRUD dialogs, shared status cards, and workspace data orchestration.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Register / portfolio list | `portfolio-list-page.tsx` | create, select, batch-delete flows |
| Active workspace shell | `portfolio-workspace-layout.tsx` | outlet context, navigation, keyboard shortcuts |
| Shared workspace fetch/state | `use-portfolio-workspace-data.ts` | central TanStack Query orchestration |
| Overview dashboard | `portfolio-overview-page.tsx` | balances, positions, CSV import, metrics |
| Trade entry | `portfolio-trade-page.tsx` + `trading-operation-form.tsx` | settlement balance + operation submission |
| History / analysis / asset drilldown | `portfolio-history-page.tsx`, `portfolio-analysis-page.tsx`, `asset-detail-page.tsx` | secondary feature pages |
| Dialog stack | `dialogs.tsx` | portfolio/balance/position/csv dialogs |
| Shared types + form schemas | `model.ts` | Zod schemas, enums, feature types |
| Shared feature UI | `shared.tsx` | status callouts, badges, empty states, row actions |

## CONVENTIONS
- Active nested routes run through `PortfolioWorkspaceLayout` and its outlet context.
- Reuse `usePortfolioWorkspaceData` before adding page-specific query trees.
- Mutations should invalidate via `invalidatePortfolioScope`, then follow existing toast/navigation patterns.
- Reuse `FeedStatus`, `getQuoteStatus`, `StatusCallout`, `FeedStatusBadge`, `WorkspaceMetricCard`, and `RowActionMenu` before inventing new feature components.
- Keep Zod form schemas, feature enums, and shared option lists in `model.ts`.
- Extend `dialogs.tsx` for new portfolio/balance/position import flows instead of creating one-off modal patterns.

## ANTI-PATTERNS
- Do not add new work to `portfolio-detail-page.tsx` unless you first confirm it is mounted; current routing in `src/App.tsx` goes through `PortfolioWorkspaceLayout` + child pages, and `PortfolioDetailPage` appears unrouted.
- Do not duplicate portfolio/balance/position/quote loading logic across pages.
- Do not inline custom invalidation, toast, or error-formatting logic when shared helpers already exist.
- Do not push app-specific styling down into `components/ui`.
- Do not make missing quotes fatal; preserve degraded-state messaging and warning callouts.

## NOTES
- `portfolio-detail-page.tsx` is the largest local hotspot and a candidate for cleanup only after confirming whether it is legacy or pending reuse.
- Keyboard shortcuts are installed from `PortfolioWorkspaceLayout` via `useKeyboardShortcuts`.
