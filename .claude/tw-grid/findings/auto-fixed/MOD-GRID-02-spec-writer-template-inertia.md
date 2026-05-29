# Spec Writer Template Inertia — F-06 Pattern Catalog (MOD-GRID-02)

**Status**: pattern (3 occurrences) — documentation-only, no rubric/constraints change
**Source**: MOD-GRID-02 G-006 self-review (2026-05-14)
**Scope**: cross-Goal observation within single module

---

## Pattern Description

Spec writer (sonnet model) carries forward template fragments from prior Goal spec, occasionally introducing stale defensive code that contradicts D# pre-decisions of the current Goal. Implementer (sonnet) catches via "tight read" (D# pre-decisions vs Section 11 code template cross-check), but reliance is fragile — if Implementer is rushed or copy-pastes literally, defect propagates to production.

## Occurrences in MOD-GRID-02

### Occurrence 1 — G-003 (Rules of Hooks reorder)

- **Spec location**: `G-003-spec.md` Section 11.2 Step 2 code template (L508-524)
- **Defect**: `if (ms <= 0) return fn;` THEN `return useCallback(...)` — useCallback called conditionally after early return → React Rules of Hooks violation.
- **Implementer fix**: `useDebouncedCallback.ts` L70-87 hoisted useCallback BEFORE the early return (Rules of Hooks compliant).
- **Reporting**: Initially NOT reported as drift (`promptSpecDrift=[]` in implement-score.json). Caught post-hoc by Self-Review. Triggered F-06 rule introduction (implement-rubric v1.0.7).

### Occurrence 2 — G-005 (`as any` cast)

- **Spec location**: `G-005-spec.md` Section 5.1 L234-235 code stub
- **Defect**: `(result as any)[key] = JSON.parse(raw)` — C-4 (No `any`) violation.
- **Implementer fix**: `serializeState.ts` L113 used `Record<GridStateKey, unknown>` pattern instead.
- **Reporting**: implement-score.json `specCodeDefects=[]` with severity=medium. F-06 rule operating correctly.

### Occurrence 3 — G-006 (over-specified eslint-disable)

- **Spec location**: `G-006-spec.md` Section 11.1 L546-547 code stub
- **Defect**: Spec code stub included `// eslint-disable-next-line react-hooks/exhaustive-deps` on save-trigger useEffect. But D2 explicitly stated "eslint-disable 0줄" (Option A saveRef pattern). Template inertia carried forward from G-005 `useUrlSync.ts` L95 pattern even though G-006 D2 specifically eliminated the need.
- **Implementer fix**: `useStoragePersist.ts` L135-146 has NO eslint-disable on save-trigger (saveRef.current is a React Ref, auto-excluded by react-hooks/exhaustive-deps without disable directive). Only L100 mount-only `[]` retains 1 eslint-disable (standard pattern).
- **Reporting**: implement-score.json + implement-verifier-score.json both record `specCodeDefects=[{defectId: "F-06-G006-1", ...}]`. F-06 rule operating correctly.

## Common Shape

| Aspect | Common across 3 instances |
|--------|---------------------------|
| Spec writer | sonnet (consistent model) |
| Implementer | sonnet (catches via tight read) |
| Source of defect | template fragment from prior Goal spec, not aligned with current Goal D# pre-decisions |
| Severity | medium (compilable, not runtime-blocking, but contradicts intent) |
| Resolution | Implementer auto-fix + specCodeDefects[] entry + feedback report |
| Rubric mechanism | F-06 (v1.0.7) functioning as designed in 2 of 3 cases (G-003 retroactively caught) |

## Hypothesis (not yet tested)

Spec writer (sonnet) attention budget may be biased toward Section 11 boilerplate copy-paste vs Section 1-10 (problem framing). When D# pre-decisions explicitly diverge from prior Goal patterns (e.g. G-006 D2 = "eslint-disable 0줄"), spec writer's copy-paste of Section 11 from prior Goal can introduce contradictions.

## Recommended Mitigation (future spec writer prompt enhancement)

Add explicit checklist step to spec writer prompt:

> Before finalizing Section 11 (Code Stub), re-read D# pre-decision table (Section 1.D or top of spec) and grep Section 11 for any pattern that contradicts D# decisions. Common candidates: eslint-disable presence/absence, useCallback vs raw fn, useRef vs useState, typeof window guard placement.

This is a documentation-only recommendation — not a rubric rule. Add to spec writer prompt template in `.claude/tw-grid/prompts/specify.md` (if such file exists) or surface to harness orchestrator on next spec writer invocation.

## Threshold for Policy Change

- 1 occurrence (G-003) = anecdote → F-06 rule introduced (v1.0.7)
- 2 occurrences (G-005) = pattern → F-06 evidence section update
- 3 occurrences (G-006) = policy threshold reached

**Decision**: REJECT rubric expansion. F-06 v1.0.7 scope already covers all 3 instances. Documentation catalog (this file) sufficient. Spec writer prompt enhancement (above) is documentation-only, not rubric.

## Cross-Module Forecast

Expected to recur in MOD-GRID-03+ if spec writer is invoked with prior-Goal spec as context. Mitigation: TB-1 vitest-infra Goal completion would catch some F-06 defects automatically (test-runtime would surface Rules of Hooks violations at minimum). G-006 over-specified eslint-disable is type of defect that test-runtime would NOT catch (eslint is build-time only).

Future occurrence (4th in different module) — escalate to F-06 v1.0.8 evidence section.

---

*MOD-GRID-02 module-end pattern catalog. Documentation only. No rubric/constraints change.*
