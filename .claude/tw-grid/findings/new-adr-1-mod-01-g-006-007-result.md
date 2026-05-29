# 신 ADR-1 (MOD-GRID-01 G-006 ADR-007 + G-007 ADR-008) 실행 결과

- 작성일: 2026-05-18
- 작성자: 단일 implementer agent (G-006 + G-007 동시 처리 — 같은 모듈 일관성)
- 입력 spec: `.claude/tw-grid/findings/canonical-gap-supplementation-spec.md` §4.1 + §4.5
- 영향 패키지: `@tomis/grid-core` (main) + `@tomis/grid-renderers` (type-only re-export)

---

## 1. 변경 파일

| 파일 | 변경 종류 | 변경 내용 |
|------|----------|----------|
| `packages/grid-core/src/types.ts` | MODIFY | `CellClassNameCallback<TData>` + `RowClassNameCallback<TData>` canonical 정의 추가 (역의존 제거 — ADR-REFACTOR-009 정신). `GridHandle.startEditing?` optional method 추가. `GridProps.cellClassName?` / `rowClassName?` / `onCellKeyDown?` / `onStartEditing?` 추가. `KeyboardEvent` + `Row` import 추가. |
| `packages/grid-core/src/Grid.tsx` | MODIFY | virtualized + non-virtualized 양쪽 branch 의 `<tr>` 에 `rowClassName` callback wiring, `<td>` 에 `cellClassName` callback + `onCellKeyDown` wiring. `useGridImperativeHandle` 호출에 `onStartEditing` 전달. |
| `packages/grid-core/src/internal/useGridImperativeHandle.ts` | MODIFY | `UseGridImperativeHandleParams<TData>` 에 `onStartEditing?` 필드 추가. `useImperativeHandle` 반환 객체에 `startEditing` method 추가 (callback-delegating + dev warn). |
| `packages/grid-core/src/index.ts` | MODIFY | `CellClassNameCallback` + `RowClassNameCallback` public type export 추가. |
| `packages/grid-renderers/src/EditableCell.tsx` | MODIFY | `CellClassNameCallback<TData>` 의 local 정의 제거 (ADR-REFACTOR-009 역의존 제거 정책 부합) → `export type { CellClassNameCallback } from '@tomis/grid-core'` (type-only re-export). `@tanstack/react-table` 의 `Cell` import 제거 (no longer needed locally). backward compat 보장 — 외부 사용처가 `@tomis/grid-renderers` 에서 import 하던 코드 그대로 동작. parallel agent (G-004) 의 race condition 3rd attempt 에서 settled — Path A 성공. |
| `.claude/tw-grid/decisions/MOD-GRID-01-decisions.md` | MODIFY | ADR-MOD-GRID-01-007 + ADR-MOD-GRID-01-008 신설 (각 D1/D2/D3 결정 + alternatives + trade-off + consequences + confidence + Pattern Catalog Note). |
| `.claude/tw-grid/decisions/ID-LEDGER.md` | MODIFY | Section 2.2 MOD-GRID-01 ledger 에 ADR-007 + ADR-008 행 추가 (lastIssued 008). Section 7 MOD-GRID-01 lastIssued G-005 → G-007 (G-006 + G-007 행 추가). 총 합계 79 → 81+. |
| `.claude/tw-grid/state.json` | MODIFY | `goalsIndex` 에 MOD-GRID-01 G-006 + G-007 entry 추가 (overallStatus: completed, stages all done). |
| `.changeset/g-006-007-grid-core-callbacks.md` | NEW | minor changeset (`@tomis/grid-core`: minor + `@tomis/grid-renderers`: patch). |

---

## 2. probe 결과 (ADR-014 학습 적용)

probe 작성 → typecheck PASS → 즉시 삭제 (실 source ↔ probe 동거 0).

| probe | typecheck | 검증 항목 |
|-------|-----------|----------|
| `__probe__/g-006-cellClassName.probe.ts` | **PASS** | `CellClassNameCallback<TData>` + `RowClassNameCallback<TData>` direct + `GridProps` 통합 + `GridHandle` 7+1 method 인터페이스 |
| `__probe__/g-007-keyboard-handle.probe.ts` | **PASS** | `onCellKeyDown` 시그니처 `(cell, row, event)` + `onStartEditing` (rowId, colId) + `GridHandle.startEditing` 호출 (string + number rowId 모두) |

probe 디렉토리는 typecheck 직후 `rm -rf` 로 즉시 제거 — disk 잔존 0건 (Grep `__probe__` → 0 hits).

---

## 3. 검증 결과

### 3.1 pnpm -r typecheck

- **14 / 14 PASS** (`grid-license`, `grid-export`, `grid-renderers`, `grid-core`, `grid-pro-datamap`, `grid-pro-agg`, `grid-features`, `grid-pro-header`, `grid-pro-master`, `grid-pro-merging`, `grid-pro-range`, `grid-pro-tracking`, `grid`).
- 초기 `grid-pro-master` 에서 `ContextMenuGrid.tsx` + `MasterDetailGrid.tsx` 2건의 TS2741 error (자체 GridHandle 구현이 신 `startEditing` required field 미충족) — **fix**: `GridHandle.startEditing?` 를 optional (`expandAll?` / `collapseAll?` 패턴과 일관) 로 변경 → all PASS.

### 3.2 pnpm -r build (apps/docs 제외)

- **13 / 13 PASS** (모든 packages/* build Done).
- `apps/docs` 는 pre-existing Docusaurus `customCss` 설정 오류 — 본 cycle 무관.

### 3.3 size-limit (`@tomis/grid-core`)

- **9.12 KB / 30 KB** (한도 30.4%, 여유 20.88 KB).
- G-005 baseline 24.52 KB 보다 작은 이유: G-005 이후 ADR-MOD-GRID-REFACTOR-2026-05-17-001~019 19건 누적 (특히 REFACTOR-011 `.size-limit.json` ignore 정책 통일 + REFACTOR-009 역의존 제거 + legacy alias 사용처 마이그레이션).
- **ADR-003 D7 sub-entry split 트리거** (25 KB 초과 시) **미발동** (9.12 KB ≪ 25 KB).

### 3.4 wiring grep 확인 (단일 ground-truth)

| 키워드 | grid-core/src 의 hit 수 |
|--------|------------------------|
| `cellClassName` | types.ts + Grid.tsx (2 branches × 1 hit each = 2 hits in Grid.tsx) |
| `rowClassName` | types.ts + Grid.tsx (2 branches × 1 hit each = 2 hits) |
| `onCellKeyDown` | types.ts + Grid.tsx (2 branches × 1 hit each = 2 hits) |
| `startEditing` | types.ts (GridHandle interface) + internal/useGridImperativeHandle.ts (params field + method body) + index.ts (comment) |

### 3.5 ID-LEDGER 갱신 검증

- Section 2.2 MOD-GRID-01 lastIssued: 006 → **008** (ADR-007 + ADR-008 신설).
- Section 7 MOD-GRID-01 lastIssued: G-005 → **G-007** (G-006 + G-007 신설).
- state.json `goalsIndex` MOD-GRID-01 entry 수: 5 → **7** (G-006 + G-007 추가, both `overallStatus: completed`).

---

## 4. 결과 체크리스트

- [x] `cellClassName` + `rowClassName` props (G-006 D1/D2) — `GridProps` 노출 + `<td>`/`<tr>` className 합성.
- [x] `onCellKeyDown` prop (G-007 D1) — `(cell, row, event)` 시그니처 (onCellClick ADR-004 D4 와 일관).
- [x] `onStartEditing` prop + `GridHandle.startEditing?` (G-007 D2) — callback-delegating 패턴 (G-004 D3 일관).
- [x] `CellClassNameCallback<TData>` + `RowClassNameCallback<TData>` type export from `@tomis/grid-core/index.ts` (canonical 이전 — 역의존 제거).
- [x] `ADR-MOD-GRID-01-007` + `ADR-MOD-GRID-01-008` 신설 (MOD-GRID-01-decisions.md).
- [x] ID-LEDGER lastIssued ADR-008 + G-007 갱신.
- [x] state.json `goalsIndex` G-006 + G-007 entry 추가 (both completed).
- [x] `.changeset/g-006-007-grid-core-callbacks.md` 신설 (minor + patch).
- [x] probe 2개 작성 + typecheck PASS + 즉시 삭제 (ADR-014).
- [x] pnpm -r typecheck PASS (14 / 14).
- [x] pnpm -r build PASS (13 / 13 packages; apps/docs pre-existing 무관).
- [x] size-limit PASS (9.12 KB / 30 KB).

---

## 5. Advisor 권고 적용 결과

advisor 호출 1회 (작업 전 orientation 직후) — 7 권고 모두 적용:

| # | 권고 | 적용 결과 |
|---|------|----------|
| 1 | 시그니처 — spec 권위 (`Cell<TData>`, `(cell, row, event)`) | ★ 적용 — task prose 의 `CellContext` 대신 spec 의 `Cell<TData, unknown>` + `(cell, row, event)` 3-arg (onCellClick 일관) |
| 2 | `CellClassNameCallback` canonical 이전 (grid-core 로) | ★ 적용 — grid-core/types.ts 에 canonical 정의 + grid-renderers 는 type-only re-export (3rd Edit attempt 에서 race condition 해소, Path A) |
| 3 | `GridHandle.startEditing` callback-delegating 패턴 | ★ 적용 — `onStartEditing` prop + dev warn + no-op (G-004 D3 패턴) |
| 4 | size-limit 측정 의무 | ★ 적용 — 9.12 KB / 30 KB 측정 + ADR-007 Consequences 에 기록 |
| 5 | probe → types.ts 먼저 → Grid.tsx 후 | ★ 적용 — types.ts → probes → Grid.tsx wiring 순서 |
| 6 | C-29 spread 패턴 | ★ 적용 — callback fields 모두 `| undefined` union + spread (UseGridImperativeHandleParams) |
| 7 | rowClassName + virtualization measure thrash 경고 | ★ 적용 — ADR-007 Consequences 의 "Con (rowClassName + virtualization)" 행 + types.ts JSDoc 명시 |

---

## 6. 알려진 한계

| # | 한계 | 영향 |
|---|------|------|
| L-1 | **Cross-package wiring detail**: `startEditing(rowId, colId)` 호출 시 EditableCell 의 `isEditing=true` setting 메커니즘은 본 ADR 범위 외 — application 책임 (controlled `isEditing` state). EditingContext / column.meta.editable 패턴 통합은 별도 cycle 결정. | 중 — implementer/spec 의 자체 결정. ChangeTrackingGrid + useChangeTracking 통합 사용처에서는 application 측 controlled state 로 진행 가능. |
| L-2 | **Focus 정책**: `<td>` 가 default tabIndex 부재 → native focus 불가. `onCellKeyDown` 사용 시 cellRenderer 가 focus-able 자식 부여 의무 (JSDoc 명시). AS-IS Wijmo 의 `hostElement.addEventListener` 는 grid root 한 곳 등록 → 자동 receive. tw-grid 는 cell-level. | 작음 — JSDoc + Storybook story `KeyboardEdit` 시나리오로 보강 (별도 cycle). |
| L-3 (**resolved**) | **`@tomis/grid-renderers` race condition**: 1st + 2nd Edit attempts 가 parallel agent (MOD-GRID-05 G-004) 의 save 와 race 으로 revert 됨. **3rd attempt 에서 settled** (Path A) — type-only re-export 가 disk 에 영구 적용. typecheck PASS 확인 (grid-renderers + 전체 14 / 14). | 0 — resolved. ADR-007 D3 본문과 disk 코드 일치. |
| L-4 | **`GridHandle.startEditing` optional**: 본 G-007 implement 단계에서 `expandAll?` / `collapseAll?` 패턴과 일관 적용 (`startEditing?` optional). grid-pro-master 의 ContextMenuGrid + MasterDetailGrid 가 자체 GridHandle 구현 — 본 method 미구현. base `<Grid>` 만 본 method 가 `useImperativeHandle` 로 제공. | 작음 — backward compat 보장 (C-23). 별도 wrapper 들도 후속 cycle 에서 점진적 추가 가능. |
| L-5 | **단위 테스트 부재**: monorepo 의 grid-core 에 단위 테스트 인프라 부재 (parallel package `useStoragePersist.test.ts` 외). probe 만으로 typecheck — 본 cycle 범위 외. | 작음 — Storybook visual baseline + size-limit + tsc 가 회귀 가드. |

---

## 7. Pattern Catalog 등록 결과

- **callback-delegating imperative API 패턴**: ADR-008 의 Pattern Catalog Note 에 **4번째 등록** (addRow + deleteRow + updateRow + startEditing). 1=anecdote, 2=pattern, 3=policy 기준 **policy 단계 강하게 진입** — 후속 GridHandle 확장 시 본 패턴 의무. 별도 ADR (예: `constraints.md` 의 C-NN) 으로 elevate 권장.
- **Type ownership 이전 + type-only re-export 패턴**: ADR-007 D3 의 Pattern Catalog Note — REFACTOR-009 (grid-core ↔ grid-features) + 본 ADR-007 D3 (grid-renderers → grid-core canonical) = **2 occurrences = pattern**. 3rd occurrence 발생 시 ADR-MOD-GRID-00-XX 로 promote 검토.

---

## 8. §6 정책 적용 결과 — advisor 우선 / critical 5 비해당

본 cycle:
- A 비즈니스 정책: 영향 X (canonical 보강 spec 의 권고 그대로 적용, 추가 비즈니스 결정 없음)
- B 외부 사용자: 영향 X (additive API, backward compat)
- C 비용: 영향 X (자체 결정 — semver minor, 라이선스/배포 동일)
- D 비가역: 영향 X (점진적, 사용처 마이그레이션 별도 cycle)
- E 환경: 영향 X (개발 환경 변경 0건)

→ **advisor 우선 / 자체 결정 — 사용자 surface 안 함** (task body 명시).

사용자 surface 가 필요한 시점: 후속 마이그레이션 적용 (예: publish/organizeSchedule → tw-framework-front) 단계 — 별도 cycle.

---

**implementer self-assessment**: 모든 prerequisites + acceptance criteria 충족. 변경된 9개 파일 + 1 신규 changeset = 10개 entity. probe 2개 사용 직후 삭제. typecheck 14/14 + build 13/13 + size-limit 9.12 KB / 30 KB 모두 PASS.
