# FRONTEND PORTFOLIOS GUIDE

> Inherits `/AGENTS.md`, `/frontend/AGENTS.md`, and `/frontend/src/components/AGENTS.md`. This file only covers `src/components/portfolios/`.

## OVERVIEW
`src/components/portfolios/` owns the portfolio workspace: list/detail pages, balances, positions, trades, CRUD dialogs, and trading-operation forms.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Portfolio list route | `portfolio-list-page.tsx` | portfolio creation, navigation, overview cards |
| Portfolio workspace route | `portfolio-detail-page.tsx` | orchestrates hooks, quotes, analytics, tabs, dialogs |
| Balances section | `portfolio-balances-section.tsx`, `balance-form-dialog.tsx` | balance table + create/edit dialog |
| Positions section | `portfolio-positions-section.tsx`, `position-form-dialog.tsx` | position table, quote warnings, create/edit dialog |
| Trading operations | `portfolio-trades-section.tsx`, `trading-operation-form.tsx` | operation history + BUY/SELL/DIVIDEND/SPLIT form |
| Shared dialogs | `portfolio-form-dialog.tsx`, `confirm-delete-dialog.tsx` | create/edit/delete flows |

## CONVENTIONS
- Page components orchestrate hooks, analytics helpers, and local dialog state; section/dialog components keep narrower responsibilities.
- Quote-enriched position metrics come from `src/lib/portfolio-analytics.ts`, not inline page math.
- Use `formatCurrency()` and `formatDateTime()` for display consistency.
- Quote warnings are informational; show them without blocking the rest of the workspace.
- Mutation success/error feedback uses toasts close to the routed page or section that initiated the action.

## ANTI-PATTERNS
- Do not scatter decimal parsing across portfolio components; prefer shared analytics/format helpers and keep any current page-level aggregate parsing localized.
- Do not bypass section/dialog components by stuffing every portfolio action into `portfolio-detail-page.tsx`.
- Do not treat quote-warning states as fatal for balances, positions, or trade history.
- Do not change CSV import contract assumptions without coordinating with backend CSV tests, `src/lib/api.ts`, and `src/hooks/use-positions.ts`.

## NOTES
- `portfolio-detail-page.tsx` is the main orchestration hub: it combines portfolio, balance, position, trade, and quote hooks in one workspace.
- `portfolio-detail-page.tsx` still computes the cash aggregate locally from balance strings; keep any similar exceptions isolated rather than spreading parse logic through sections/dialogs.
