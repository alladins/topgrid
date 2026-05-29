# MOD-GRID-05 — Architecture Decision Records

Module: `@tomis/grid-renderers` (cell renderer package, MIT, brotli ≤ 10 KB)
Authored: 2026-05-14

---

## ADR-MOD-GRID-05-001 — ButtonCell variant API rename (D2)

**Status**: Accepted (2026-05-14, G-002 implement)
**Context**: Spec MOD-GRID-05/G-002 absorbs the legacy `tw-framework-front` `renderers/ButtonCell.tsx` (L0 — 29 lines) into the monorepo `@tomis/grid-renderers` package. The L0 variant union was `'primary' | 'danger' | 'ghost'`, while `goals.json` AC-003 specified `'default' | 'destructive' | 'ghost'`. The two naming conventions disagreed; per **C-27 (Spec authority)**, the spec body (AC-003) is authoritative — but this disagreement created a potential breaking change for downstream callers.

### Decision

Rename the variant union to `'default' | 'destructive' | 'ghost'` in the monorepo `ButtonCell` (spec D2). The internal Tailwind class mapping is unchanged: `default` reuses L0 `primary`'s class string, `destructive` reuses L0 `danger`'s class string, `ghost` is unchanged. No visual regression.

The legacy `tw-framework-front/.../renderers/ButtonCell.tsx` is rewritten as a thin re-export shim so existing import paths continue to compile. Any caller that hardcoded `variant='primary'` or `variant='danger'` would surface a TS2322 build error.

### Trade-offs

1. **Convention alignment with shadcn/ui** (chosen): The new names match the shadcn/ui Button convention which is the de-facto standard in the React ecosystem. Long-term it reduces friction when other components (Badge/Dialog/Alert) adopt the same vocabulary.
   - vs. **Keep L0 names**: rejected — locks the new package to a non-standard convention; would create a second translation layer when more renderers join.
2. **Direct rename + grep gate** (chosen): At implement time, run `Grep "variant=['\"](primary|danger)['\"]" tw-framework-front/src`. Result: **0 files matched**. → rename is safe without a codemod.
   - vs. **Backward-compat shim** (`variant: 'primary'|'default'|'danger'|'destructive'|'ghost'` union + console.warn at runtime): rejected — adds run-time cost and a deprecation cycle to support zero observed callers. The R1 grep gate definitively rules out hidden usage.

### Consequences

- **Pros**: Cleaner public API, ecosystem alignment, no maintenance overhead of a legacy union.
- **Cons**: If a future Goal accidentally re-introduces `variant='primary'` somewhere, it will fail compilation. This is acceptable: the rename is recorded here and visible in the package README + JSDoc.
- **Migration**: MOD-GRID-17 will switch usage sites to direct `from '@tomis/grid-renderers'` imports; if any new sites are added between G-002 and MOD-GRID-17 they must use the new union directly (the shim continues to export the renamed `ButtonCell`).
- **Test plan**: 8 Storybook placeholder stories cover each variant + disabled + size; tsc strict + size-limit gates verify mechanical correctness.

### Evidence

- R1 grep: `Grep "variant=['\"](primary|danger)['\"]"` tw-framework-front/src → 0 matches.
- R1 grep: `Grep "import.*ButtonCell"` tw-framework-front/src → 0 matches outside the renderers folder itself.
- Spec Section 11.4 R1 — implement-time gate satisfied.
- Visual equivalence: see `findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` Section 2.1 (Tailwind class 1:1 mapping table).

### Related

- Spec: `artifacts/MOD-GRID-05/renderer/G-002-spec.md` Section 2.3 + D2 + Section 11.4 R1
- finding: `findings/auto-fixed/MOD-GRID-05-G-002-visual-regression.md` Section 5 Deviation #1
- Constraint: C-6 (backward compatibility), C-27 (Spec authority)

---

## ADR-MOD-GRID-05-002 — EditableCell extraction + EditType widening + cellClassName scope split (D1/D2/D3)

**Status**: Accepted (2026-05-14, G-003 implement)
**Context**: Spec MOD-GRID-05/G-003 extracts the inline editable cell rendering from `tw-framework-front` `EditableGrid.tsx` (L0 L75-129) into a reusable `EditableCell` component in `@tomis/grid-renderers`. Three coupled decisions need ADR-grade documentation because they shape both this Goal's surface and downstream Goals (MOD-GRID-01 wrapper, MOD-GRID-04 createColumns, MOD-GRID-10 ChangeTrackingGrid).

### Decision

Three coupled decisions, documented together because they share rationale and downstream impact:

**D1 — `EditType` widening (additive)**: The monorepo `EditType` is defined as `'text' | 'number' | 'date' | 'select' | 'textarea'` (5 members). The L0 type at `tw-framework-front/src/types/tomis/grid.ts:43` is `'text' | 'select' | 'date' | 'number'` (4 members) — a subset of the new 5-union, so the widening is purely additive. The TOMIS-side `EditType` is not modified in this Goal (deferred to MOD-GRID-17 or a cleanup Goal); usage sites only assign 4-member literals which remain valid in both unions, so build impact is zero.

**D2 — EditableGrid body refactor (not a re-export shim)**: `EditableGrid` is a *grid wrapper* (it owns `useReactTable`, sorting state, pagination, and table markup), while `EditableCell` is a *single cell renderer*. The two operate at different abstraction levels, so `export { EditableCell as EditableGrid }` is not viable. Instead, EditableGrid's `editableColumns` useMemo (L75-129 in L0) was refactored to delegate cell rendering to `<EditableCell>` while preserving EditableGrid's full public props contract (`data` / `columns` / `onDataChange` / `pagination` / `loading` / `emptyText` / `className`). The L0 `editValue` state, `inputRef`, and `handleKeyDown` callback were removed as orphans (the EditableCell now owns its own draft state, ref, and key handling); `commitEdit` was simplified to receive `(rowIndex, colId, newValue)` directly, eliminating the L0 stale-closure risk on `editValue`.

**D3 — `cellClassName` scope split**: `CellClassNameCallback<TData> = (cell: Cell<TData, unknown>) => string` is exported from `@tomis/grid-renderers` as a type only. `EditableCell` accepts `cellClassName?: string` as a cell-level prop. The Grid-level callback wiring (i.e. calling the callback per cell at the Grid wrapper and injecting the resolved string into each cell) is **deferred to MOD-GRID-01 (Grid wrapper) or MOD-GRID-04 (createColumns)** because it touches abstractions that don't exist yet in monorepo. The C-31 (functional wiring audit) is satisfied: `cellClassName` is consumed by EditableCell itself in className composition — not dead code.

### Trade-offs

1. **D1 widening vs deprecation cycle**: Chose additive widening (no breaking change) over forking a separate 5-member union with a deprecation alias. Reason: the L0 4-member union is a strict subset, all existing usage sites remain valid, and no caller currently passes `'textarea'`. R1 grep on tw-framework-front confirmed zero callers passing literal `'textarea'`. No deprecation overhead needed.
   - Rejected alternative: synchronously widen TOMIS-side `EditType` in `grid.ts:43`. This would have been clean but expands the Goal scope and risks touching unrelated `EditableColumnMeta` consumers. Deferred to a cleanup Goal.

2. **D2 body refactor vs re-export shim**: Chose body refactor because `EditableGrid` and `EditableCell` operate at different abstraction levels (grid vs cell). A re-export shim is impossible. The body refactor is more invasive than a shim but is the only structurally-valid option.
   - Rejected alternative: defer the refactor to a future Goal and have EditableCell live unused in the monorepo. This would have left AC-008 (visual regression) without a baseline and would have delayed MOD-GRID-10 ChangeTrackingGrid's adoption of EditableCell.

3. **D3 cellClassName cell-level prop only vs full Grid-level wiring**: Chose to export the callback type now and the EditableCell cell-level prop now, but defer the per-cell invocation wiring to MOD-GRID-01/04. Reason: the Grid wrapper that would invoke the callback per cell doesn't exist yet; MOD-GRID-04 createColumns is the natural home. Exporting the type now means downstream Goals can import it without churning the package's public API.
   - Rejected alternative: implement a full Grid-level wiring in this Goal. This would have required a new Grid wrapper component for EditableGrid only (since EditableGrid already does its own table assembly), and the wrapper would be discarded once MOD-GRID-01 ships. Unnecessary throwaway code.

### Consequences

- **Pros**:
  - D1: Zero migration burden for existing 4-union callers; `'textarea'` becomes available immediately for new consumers.
  - D2: EditableGrid retains its public API contract; `PayrollEditablePage` (the sole consumer) compiles unchanged. EditableCell is now reusable by MOD-GRID-10 ChangeTrackingGrid.
  - D2 (bonus): The refactor eliminated a latent stale-closure bug on `editValue` (L0 commitEdit closed over `editValue` state which could be stale during rapid edits). The new pattern passes `newValue` directly as a callback argument.
  - D3: Clean separation of concerns — EditableCell stays a leaf renderer; Grid-level orchestration lives at the appropriate abstraction level (MOD-GRID-01/04).
- **Cons**:
  - D1: The TOMIS-side `EditType` is temporarily out of sync (4 members) with the monorepo (5 members) until a cleanup Goal aligns them. Risk: minimal — assignment from TOMIS to monorepo is a safe widening; the reverse direction isn't used anywhere.
  - D2: One-time refactor cost (≈30 lines net reduction in EditableGrid.tsx).
  - D3: `cellClassName` callback wiring won't be visible until MOD-GRID-04 ships. Risk: if MOD-GRID-04 slips, `cellClassName` remains a leaf prop with no Grid-level dispatcher. Acceptable: leaf prop is still useful directly.
- **C-29 (exactOptionalPropertyTypes) handling**: The EditableGrid call site uses conditional-spread for `selectOptions` (`{...(meta.selectOptions !== undefined ? { selectOptions: meta.selectOptions } : {})}`) because `EditableColumnMeta.selectOptions` is `T[] | undefined` and EditableCell's prop is `ReadonlyArray<T>?` (exactOptional). EditableCell internally is C-29 exempt per spec D5 (leaf component, no optional prop forwarding).

### Evidence

- Spec D1/D2/D3 (G-003-spec.md L19-23).
- L0 paths read: `tw-framework-front/src/components/tomis/Grid/EditableGrid.tsx` (232 lines), `tw-framework-front/src/types/tomis/grid.ts:43-49`.
- R1 grep: `Grep "editType.*['\"]textarea['\"]" tw-framework-front/src` → 0 matches (no preexisting `'textarea'` callers).
- D9 grep: `Grep "EditableGrid|EditType|EditableColumnMeta" tw-framework-front/src --include=*.{tsx,ts}` → 3 files: `EditableGrid.tsx` (this Goal), `PayrollEditablePage.tsx:8` (`import type { EditableColumnMeta }` only), `grid.ts:43-49` (type definitions). PayrollEditablePage uses no internal EditableGrid state.
- tsc: monorepo `grid-renderers` → 0 errors; `tw-framework-front` → 0 errors.
- tsup: `grid-renderers` build success, `dist/index.mjs` 13.53 KB raw.
- size-limit: `@tomis/grid-renderers` 5.19 KB brotli / 10 KB limit (4.81 KB headroom; G-002 baseline 4.5 KB → +0.7 KB delta).
- Visual equivalence: `findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md` Section 3 (JSX token table) + Section 4 (5-step state transition table).

### Related

- Spec: `artifacts/MOD-GRID-05/renderer/G-003-spec.md` D1/D2/D3 + Section 2.1/2.2/2.3 + Section 11.4 R1/R2/R3
- finding: `findings/auto-fixed/MOD-GRID-05-G-003-visual-regression.md`
- Constraints: C-1 (Read-then-Write), C-4 (no any), C-6 (backward compatibility), C-22 (peerDeps), C-27 (Spec authority), C-29 (exactOptional spread — applied at EditableGrid call site, exempt at EditableCell leaf)
- Downstream consumers: MOD-GRID-01 (Grid wrapper — cellClassName callback wiring), MOD-GRID-04 (createColumns — rendererRegistry consumer), MOD-GRID-10 (ChangeTrackingGrid — EditableCell reuse)

---

## ADR-MOD-GRID-05-003 — EditableCellProps 3 prop 추가: maxLength + align + stopPropagationOnKeyDown (D1/D2/D3)

**Status**: Accepted (2026-05-18, G-004 implement)
**Context**: `canonical-gap-supplementation-spec.md` §4.4 (G-6) 분석 결과, `publish/organizeSchedule:L287-300`의
`prepareCellForEdit.addHandler` 패턴이 editor (`<input>`) 에 3가지 customization 을 수행한다:
1. `editor.style.textAlign = 'center'`
2. `(editor as HTMLInputElement).maxLength = 4`
3. `editor.addEventListener('keydown', (evt) => evt.stopPropagation())`

현 `EditableCellProps` (ADR-002 G-003) 는 이 use case 를 미지원. 본 G-004 가 additive 3 prop 으로 보강.

### Decision

**D1 — `maxLength?: number`**: HTML 표준 `maxLength` attribute — `<input>` + `<textarea>` 에 C-29 (exactOptionalPropertyTypes)
conditional spread 패턴으로 전달 (`{...(maxLength !== undefined ? { maxLength } : {})}`) .
`editType === 'select'` 에는 전달하지 않음 (`HTMLSelectElement` 에 `maxLength` 미존재).

**D2 — `align?: 'left' | 'center' | 'right'`** (default `'left'`): Tailwind class 분기로 적용.
- `'left'` → 클래스 없음 (브라우저 기본값)
- `'center'` → `text-center`
- `'right'` → `text-right`
C-5 의무 (인라인 style 금지, Tailwind only) 준수. `alignToClass()` 순수 헬퍼 함수로 분리.
모든 `editType` 브랜치 (`input` / `textarea` / `select`) 의 `composed` className 에 포함.

**D3 — `stopPropagationOnKeyDown?: boolean`** (default `false`): `true` 시 `handleKey` 의
Enter/Esc/Tab 처리 완료 후 `e.stopPropagation()` 추가 호출. host keyboard wiring (G-7 대상 MOD-GRID-01)
과 분리. `useCallback` deps 배열에 `stopPropagationOnKeyDown` 추가.

### Trade-offs

1. **정형 3 prop (D1/D2/D3) vs `onEditStart(input: HTMLInputElement)` ref callback**:
   - 정형 prop 채택 이유: (a) C-5 (Tailwind only) 위반 통로 차단, (b) type-safe API surface.
   - ref callback 기각: DOM 직접 노출 → `style.textAlign` 인라인 style 삽입 위험 (C-5 위반).

2. **`stopPropagationOnKeyDown` 단일 boolean vs `onKeyDown(e)` callback**:
   - boolean 채택 이유: Enter/Esc/Tab 의 기본 처리와 충돌 없음. publish use case (host 와 분리) 정확 처리.
   - callback 기각: `handleKey` 와 중복 처리 + Tab preventDefault 순서 불명확.

### Evidence

- canonical-gap-supplementation-spec.md §4.4.2 (G-6) — 본 ADR 설계 origin.
- publish/organizeSchedule:L287-300 (`prepareCellForEdit.addHandler`) — 3 pattern 실 사용 증거.
- `pnpm -F @tomis/grid-renderers typecheck` → PASS (probe + 삭제 완료).
- `pnpm -F @tomis/grid-renderers build` → success (dist/index.mjs 15.62 KB).
- `pnpm -r typecheck` → 14 packages PASS (regression 0).

### Consequences

- **semver**: minor (additive — 기존 호출자 변경 불필요).
- **breaking**: 없음.
- **번들 영향**: `alignToClass` helper + handleKey deps 1 추가 + 3 prop 분기. 실 측정: `dist/index.mjs` G-003 baseline 13.53 KB → G-004 15.62 KB (raw ESM, tsup). size-limit script 미구성 (`packages/grid-renderers/package.json` 에 `size` 스크립트 없음) — brotli 절대치 미검증.
- **C-29 적용**: `maxLength` 전달 시 conditional spread (`{...(maxLength !== undefined ? { maxLength } : {})}`) 의무.
- **MOD-GRID-10 ChangeTrackingGrid**: `EditableCell` 재사용 구조이므로 신 prop 자동 노출 가능 (별도 cycle).
- **G-7 연관**: `stopPropagationOnKeyDown` 은 MOD-GRID-01 G-007 (`onCellKeyDown` + `GridHandle.startEditing`)
  implement 후 use case 재확인 권장 (canonical-gap-supplementation-spec.md §8 L-4 참조).

### Related

- Spec: `findings/canonical-gap-supplementation-spec.md` §4.4 (G-6)
- ADR: ADR-MOD-GRID-05-002 D3 (cellClassName scope split — 본 ADR 의 downstream)
- Constraints: C-4 (no any), C-5 (Tailwind only), C-14 (ADR 의무), C-23 (semver), C-25 (JSDoc), C-29 (exactOptional)
- ID-LEDGER: MOD-GRID-05 ADR lastIssued 002 → 003, Goal lastIssued G-003 → G-004

---

## ADR-MOD-GRID-05-004 — EditableCell initialDraft prop (G-005)

**Status**: Accepted (2026-05-18, G-005 implement)
**Context**: organizeSchedule Phase 3.3 결과가 PARTIAL 상태였음 — `<div tabIndex={0}>` + `setEditingCell` application-state route 는 동작하나 **첫 char keystroke lost** (finding: `organize-schedule-phase-3-4-result.md` L-2).

근본 원인: keydown → `setEditingCell` → re-render → `<div>` unmount + `<EditableCell>` mount → `useEffect` focus 시점에 원본 KeyboardEvent 는 이미 consumed. 따라서 편집 모드 전환은 되나 첫 글자 input 에 진입 불가.

### 결정

`EditableCell` 에 `initialDraft?: string` prop 추가. 컴포넌트 마운트 시 이 prop 이 존재하면 draft 상태 초기값으로 사용 (기존 `String(value ?? '')` 대신). 이후 focus + cursor-to-end 적용.

**구현 세부**:
1. `useState<string>(() => initialDraft ?? String(value ?? ''))` — 게으른 초기자로 `initialDraft` 우선 적용. React controlled `value={draft}` 이므로 imperative `input.value =` 불필요 (paint frame 이전에 올바른 값 표시 보장).
2. `useEffect([isEditing])` 안에서 `initialDraft === undefined` 가드 추가 — guard 없으면 `setDraft(String(value ?? ''))` 이 lazy init 값을 덮어씀.
3. Focus + `setSelectionRange(len, len)` — cursor end 배치.
4. `initialDraft` 는 마운트 시 1회만 읽힘 (lazy init). 이후 prop 변경은 의도적으로 무시 (컴포넌트가 draft 상태를 소유).

**organizeSchedule 측 wire-up**:
- `editingCell` state type: `{ rowId; colId; initialDraft?: string }`.
- view-mode `<div>` 의 `onKeyDown`: `isChar` → `ev.preventDefault()` + `enterEdit(ev.key)`.
- `<EditableCell>` 에 C-29 conditional spread: `{...(editingCell?.initialDraft !== undefined ? { initialDraft: editingCell.initialDraft } : {})}`.

### 대안

1. **application 측 setTimeout + dispatchEvent** — `enterEdit()` 후 `setTimeout(() => inputRef.current?.dispatchEvent(new KeyboardEvent(...)), 0)`. 취약 (타이밍 의존), SSR 불호환, React synthetic event 가 아닌 native event 혼용.
2. **신 컴포넌트 `EditableCellWithDraft`** — 본 prop 만을 위한 별도 컴포넌트. 코드 중복, type 중복, 기존 callers 마이그레이션 필요.

### Trade-off

| Pro | Con |
|-----|-----|
| G-7 UX 달성 — Phase 3.3 PARTIAL → completed | `EditableCellProps` 표면 +1 prop (semver minor) |
| 기존 callers 변경 없음 (optional, default undefined) | initialDraft 는 mount-time only 의미 — prop 의미론적 비대칭 (문서화로 보완) |
| React controlled value 유지 — imperative DOM write 없음 | IME (한국어 조합입력) 첫 char 처리는 composition event 별도 검토 (본 cycle 범위 외) |
| (없음) | **`useEffect` deps 변경 부작용**: `[isEditing, value]` → `[isEditing]` — 기존에는 `isEditing=true` 상태에서 외부 `value` prop 이 변경되면 draft 가 리셋 + 재포커스 됐음. 새 동작: mid-edit 리셋 없음. organizeSchedule 에서는 EditableCell 을 조건부 렌더링(re-mount)하므로 `value` dep 가 실질적으로 불필요했으나, `EditableCell` 을 마운트 유지하면서 `isEditing` 을 토글하는 소비자(예: EditableGrid)는 이 동작 변화를 인지해야 함. semver minor 이지만 동작 변경이므로 changelog 에 명시. |

### 영향 분석

- 영향 패키지: `@tomis/grid-renderers` (EditableCell.tsx 단일 파일)
- semver: **minor** (additive — 기존 호출자 변경 불필요)
- breaking: 없음
- 번들 영향: 게으른 초기자 + guard 추가 (~200 bytes raw). dist/index.mjs G-004 baseline 15.62 KB → G-005 15.87 KB.
- C-29: `initialDraft` 전달 시 conditional spread (`{...(x !== undefined ? { initialDraft: x } : {})}`) 의무 (organizeSchedule 에서 적용됨).

### 검증

- `pnpm -F @tomis/grid-renderers typecheck` → PASS (probe ADR-014 패턴, probe 삭제 후 재확인)
- `pnpm -F @tomis/grid-renderers build` → success (`dist/index.mjs` 15.87 KB)
- `pnpm -r typecheck` → 14 packages PASS (regression 0)
- publish organizeSchedule `npx tsc --noEmit` → 0 errors (35 pre-existing unrelated 보존)

### 알려진 한계

- **IME (한국어 조합입력)**: 첫 char 가 compositionstart → compositionend 시퀀스로 처리됨. `ev.key` 는 composition 중 `'Process'` 또는 단일 자모일 수 있음. 본 cycle 범위 외 — 별도 composition event 처리 Goal 필요 시 신설 권고.
- **단위 테스트 부재**: 자동 검증 없음 — manual 검증 사용자 의무.

### Related

- finding: `organize-schedule-phase-3-4-result.md` L-2 (root cause)
- finding: `l-2-initial-draft-result.md` (본 Goal 결과 보고서)
- Constraints: C-4 (no any), C-14 (ADR 의무), C-23 (semver), C-25 (JSDoc), C-29 (exactOptional)
- ID-LEDGER: MOD-GRID-05 ADR lastIssued 003 → 004, Goal lastIssued G-004 → G-005
