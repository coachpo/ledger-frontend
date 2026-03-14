# FRONTEND STOCK ANALYSIS GUIDE

> Inherits `/AGENTS.md`, `/frontend/AGENTS.md`, and `/frontend/src/components/AGENTS.md`. This file only covers `src/components/stock-analysis/`.

## OVERVIEW
`src/components/stock-analysis/` owns the portfolio-scoped run-builder workflow: conversation selection, mode-specific run inputs, prompt preview, execution, and run-status display.

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Run-builder route | `run-builder-page.tsx` | portfolio selection, conversation selection, active run orchestration |
| Main run form | `run-builder-form.tsx` | config selection, optional template selection, request composition, create/execute flow |
| Mode-specific inputs | `run-builder-mode-fields.tsx` | `single_prompt` vs `two_step_workflow` field groups |
| Conversation selection | `conversation-picker.tsx` | create/select conversation flows |
| Prompt preview | `prompt-preview-panel.tsx` | preview request/response rendering |
| Run status | `run-status-display.tsx` | queued/running/completed/partial_failure/failed presentation |

## CONVENTIONS
- The main flow is portfolio -> conversation -> run; page state should reset downstream selections when the upstream scope changes.
- `RunBuilderForm` composes the selected config, optional saved template, and mode-specific overrides into one backend request.
- Preview and execution both go through the portfolio-scoped stock-analysis endpoints and hook wrappers.
- `single_prompt` and `two_step_workflow` have different field requirements and different expectations around version creation.
- Disabled stock-analysis settings should still allow browsing existing conversation state while blocking execution controls.
- Archived conversation filtering lives in `run-builder-page.tsx`; `conversation-picker.tsx` only renders the already-filtered list and create/select controls.

## ANTI-PATTERNS
- Do not call provider APIs or build prompt payloads outside the backend-backed stock-analysis endpoints.
- Do not assume every run produces a version; `single_prompt` preserves request/response history only.
- Do not mix global config/template resource ids with portfolio-scoped conversation/run ids.
- Do not ignore `partial_failure`, `failed`, or prompt-preview errors; surface them as degraded workflow states, not silent failures.

## NOTES
- The responses browser lives in `../responses-page.tsx`, not this folder, because it is a top-level route rather than part of the run-builder stack.
- `run-builder-page.tsx` surfaces whether portfolio defaults exist, but the form still expects an explicit config selection and only applies a template when the operator chooses one.
