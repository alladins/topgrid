# G-004 Specification — 변경된 셀/행 시각 표시 (배경색 마커) + 변경 취소 UX (행 단위 undo)

**Module**: MOD-GRID-10 (ChangeTracking + Mapping + Validator — Wijmo CollectionView 대체)
**Goal**: G-004
**Area**: tracking
**Phase**: wijmo-class (Pro 패키지 4번째 Goal — 시각 마커 + 행 단위 undo)
**Priority**: P1
**migrationImpact**: medium
**threshold**: 90 (rubric medium=90 기준 — goals.json stages.specify.threshold 95 는 copy-paste artifact, rubric 권위)
**spec 작성일**: 2026-05-15
**spec 버전**: v1.0 (loops 0/3, 첫 시도)
**라이선스 tier**: Pro (G-001 결정 cascade)
**선행 Goal**: G-003 (buildChangeSet + mapping/validator 완료)

---

## ★ 사전 결정 표 (D# — 본문 cross-consistency 의무, rubric G-01 v1.0.6)

| D# | 결정 | 본문 위치 | 출처 |
|----|------|----------|------|
| D1 | 구현 대상 monorepo = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/` (TOMIS git 외부). C-28 의무 — G-001/G-002/G-003 cascade. goals.json G-004 implementFiles 경로 이미 monorepo prefix 정상. | Section 7 + Section 11 | C-28 + G-003 D1 cascade |
| D2 | G-004 범위 = **rowStatusStyle pure helper NEW** (`src/internal/rowStatusStyle.ts`) + **applyUndo pure helper MODIFY** (`src/internal/changeMap.ts`) + **undoRow 실구현 MODIFY** (`src/useChangeTracking.ts`) + **RowStatusClassNames type MODIFY** (`src/types.ts`) + **barrel export MODIFY** (`src/index.ts`) + **ADR-007 MODIFY** (`decisions/MOD-GRID-10-decisions.md`). **합계 6 파일** (1 NEW + 5 MODIFY). editedCells 런타임 wiring 은 G-005 defer (AC-004 scope-split — D4). | Section 7 표 (6 행) + Section 11 Step 표 | goals.json G-004 implementFiles (5 entries after G-01 fix) + AC-004 scope-split + C-32 |
| D3 | `rowStatusStyle.ts` API = `getRowStatusClassName(status: RowStatus, classNames?: RowStatusClassNames): string` + `const defaultRowStatusClassNames: Readonly<RowStatusClassNames>` + `interface RowStatusClassNames { added: string; edited: string; deleted: string }`. **RowStatusClassNames 는 types.ts 에 public export** (소비자가 커스텀 classNames 전달 시 타입 참조 필요). `getRowStatusClassName` + `defaultRowStatusClassNames` 는 index.ts barrel 에도 추가 (public surface). | Section 2.1 + Section 7 #1 + Section 7 #4 + AC-002/AC-003 | goals.json AC-002/AC-003 + L0 ROW_STATUS_COLORS 패턴 + C-5 |
| D4 | `editedCells` scope-split: **G-004 = 구조적 typed surface 제공** — `ChangeTrackingConfig<TData>` 에 `editedCells?: boolean` config field 추가 + `ChangeTrackingAPI<TData>` 에 `editedCellsMap: ReadonlyMap<string, boolean>` view 추가 (stub: 항상 `new Map()` 반환). runtime `cellClassName` 콜백 연결 + hook reducer wiring 은 G-005 책임. G-001 D5 structural/functional split 선례: D5는 G-001에서 타입 시그니처 선언, G-002에서 런타임 구현. 동일 패턴으로 G-004는 구조, G-005는 wiring. | Section 2.4 + Section 5 AC-004 + Section 7 #3 + Section 7 #4 + Section 13 | G-001 D5 cascade + AC-004 goals.json 본문 + advisor 지적 |
| D5 | `applyUndo` 위치 = `src/internal/changeMap.ts` MODIFY. G-002 패턴: 모든 `ChangeMapState<TData>` 순수 변환 함수는 changeMap.ts 에 집중 (C-32 pure helper 분리). `applyUndo<TData>(state, key)` 4-branch semantics: ① `'added'` → net-zero 제거 (applyDelete added branch L218-234 재활용 패턴) ② `'edited'` → originalMap[key] 복원 + statusMap 제거 + originalMap 제거 ③ `'deleted'` → statusMap.delete(key) + **originalMap.delete(key)** (leak 방지: unchanged→update→delete→undo 시퀀스에서 originalMap 엔트리가 남아 있으면 subsequent updateRow 가 snapshot-once invariant 위반 — advisor 지적) ④ `undefined`(unknown/unchanged) → `console.warn` + state 반환 (applyUpdate L157-159 패턴). | Section 2.2 + Section 2.2 브랜치 표 + Section 6 EC-01~EC-06 + Section 7 #2 | G-002 changeMap.ts L157-159 (unknown warn) + L218-234 (added net-zero) + C-32 + EC-06 originalMap leak fix |
| D6 | `applyUndo` 시그니처 = `export function applyUndo<TData>(state: ChangeMapState<TData>, key: string): ChangeMapState<TData>`. unknown key 는 `console.warn('[grid-pro-tracking] undoRow: unknown key ${key}')` + return state — throw 없음 (applyUpdate L158 패턴, ADR-MOD-GRID-10-004 parity). | Section 2.2 + Section 11.2 snippet | changeMap.ts L157-159 applyUpdate warn 패턴 + ADR-004 |
| D7 | `undoRow` 실구현: useChangeTracking.ts L165-174 stub (throw Error) → `dispatch({ type: 'UNDO', key })` + reducer에 `{ type: 'UNDO'; key: string }` Action 추가 + `case 'UNDO': return applyUndo(state, action.key)`. `useCallback` deps `[]` (dispatch 안정 보장). | Section 2.4 + Section 11.3 Before/After + Section 7 #3 | useChangeTracking.ts L32-37 Action union + L165-174 stub + C-32 |
| D8 | **AC-002 기본 className**: `added: 'bg-green-50 border-l-2 border-green-400'`, `edited: 'bg-yellow-50 border-l-2 border-yellow-400'`, `deleted: 'bg-red-50 line-through opacity-60'` (goals.json AC-002 권위). L0 ChangeTrackingGrid.tsx ROW_STATUS_COLORS 와 의도적 차이: L0 는 `border-l-green-400` (directional shorthand), 본 spec 은 `border-green-400` (non-directional) + deleted 에 border 없음. **goals.json AC-002 가 권위 — L0 는 참조만.** C-5: Tailwind className only, inline style 금지. | Section 2.1 + Section 11.1 L0-vs-spec 표 | goals.json AC-002 + L0 ROW_STATUS_COLORS (L28-33) + C-5 |
| D9 | ADR-007 추가 = `decisions/MOD-GRID-10-decisions.md` MODIFY (ADR-006 다음 섹션). 내용: rowStatusStyle API 표면 결정 + applyUndo 4-branch 시맨틱 + editedCells G-005 defer. C-14: 대안 2개+ + trade-off 필수. | Section 7 #6 + Section 11 Step 6 | C-14 + goals.json AC 목록 |

**D# breakdown cross-check (G-01 v1.0.6 — 합계/분류/이름 모두 일치)**:
- D2 명시 합계 **6 파일** = NEW 1 (`src/internal/rowStatusStyle.ts`) + MODIFY 5 (`src/internal/changeMap.ts`, `src/useChangeTracking.ts`, `src/types.ts`, `src/index.ts`, `decisions/MOD-GRID-10-decisions.md`). Section 7 표 6 행과 1:1 매칭. Section 11 Step 1~6 enumerate 와도 1:1 매칭.
- goals.json G-004 implementFiles 5 entries: `rowStatusStyle.ts`(NEW #1), `changeMap.ts`(MODIFY #2), `useChangeTracking.ts`(MODIFY #3), `types.ts`(MODIFY #4), `index.ts`(MODIFY #5). decisions.md MODIFY 는 harness convention 상 implementFiles 미포함(spec-only artifact) → Section 7 #6 에 enumerate, goals.json 에는 포함 X.
- D4 editedCells 구조적 typed surface: `ChangeTrackingConfig.editedCells?: boolean` + `ChangeTrackingAPI.editedCellsMap: ReadonlyMap<string, boolean>` stub → `types.ts` MODIFY(#4) + `useChangeTracking.ts` MODIFY(#3) 에 포함. D2 "6 파일" 합계 변동 없음.
- D5 'deleted' branch: `originalMap.delete(key)` 추가 (leak fix) → Section 2.2 브랜치 표 + Section 11.2 snippet 에 반영.
- D8 className 차이 = Section 11.1 표에 명문화.

**E-06 자가-검증 (Spec Truth Table Discipline)**: 본 D# 표 + Section 7 표 + Section 11 Step 표 모두 6 파일 일치. 본문 "재결정", "변경 대상", "대체", "수정함", "~로 변경", "~ 대신" 키워드 0건 (재결정 없음 — 첫 시도 spec).

---

## Section 1: 참조 추적

**(disclaimer — H-01 명확화)** 본 Section 1 표(L0/L1/L3/R-W/R-A)는 **기존(pre-IMPLEMENT) referenceEvidence 참조 자료**만 enumerate. 본 G-004 가 새로 *생성*하는 산출물(NEW: `internal/rowStatusStyle.ts` / MODIFY: `internal/changeMap.ts` applyUndo, `useChangeTracking.ts` undoRow, `types.ts` RowStatusClassNames, `index.ts` barrel, `decisions.md` ADR-007)은 Section 7 의 별도 권위 표(C-30)에서 관리됨. H-01 평가는 **본 Section 1 표의 참조 경로 실재** 만 대상.

### L0: 현 구현 (tw-framework-front)

**파일 경로 + Read 확인 (2026-05-15)**:

| 파일 | Read 라인 | 핵심 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` | L1-160 (전체 Read) | `ROW_STATUS_COLORS` L28-33: added/edited/deleted 별 Tailwind className 객체 — **G-004 rowStatusStyle 의 구조적 선례** |

**L0 ROW_STATUS_COLORS 원문 (L28-33 발췌)**:
```tsx
const ROW_STATUS_COLORS = {
  added:   'bg-green-50 border-l-2 border-l-green-400',
  edited:  'bg-yellow-50 border-l-2 border-l-yellow-400',
  deleted: 'bg-red-50 border-l-2 border-l-red-400 opacity-60 line-through',
};
```

**L0 vs G-004 AC-002 의도적 차이 (D8)**:
- L0 `border-l-green-400` (directional shorthand) → AC-002 `border-green-400` (non-directional)
- L0 deleted 에 `border-l-2 border-l-red-400` 포함 → AC-002 deleted 에 border 없음
- **goals.json AC-002 가 권위** (G-004 spec의 정의 기준)

**부족한 점 (G-004 강화 대상)**:
1. `ROW_STATUS_COLORS` 는 컴포넌트 내 private 상수 — 외부 커스터마이징 불가 (G-004 `RowStatusClassNames` 타입 + `defaultRowStatusClassNames` 으로 공개)
2. `undoRow` per-row undo 없음 — 전체 `resetChanges` 만 존재 (G-004 AC-003 추가)
3. `deleteRow(visibleIndex)` positional index 방식 → `deleteRow(key)` key 방식 (G-002 산출, G-004 undoRow 도 key 기반)

### L1: 자체 설계

**파일 + Read 확인 (2026-05-15)**:

| 파일 | Read 라인 | 사용 |
|------|----------|------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/types.ts` | L1-132 (전체) | G-001/G-002/G-003 산출. `RowStatus = 'added' \| 'edited' \| 'deleted'` L10. `ChangeTrackingAPI.undoRow(key): void` L119 (G-004 stub 주석). `RowStatusClassNames` 아직 없음 — G-004 추가 대상 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/internal/changeMap.ts` | L35-244 (applyUpdate + applyDelete) | G-002 산출. applyUpdate unknown warn 패턴 L157-159 (D6 선례). applyDelete added-branch net-zero L218-234 (D5 ①branch 패턴). `ChangeMapState<TData>` L35-41 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/useChangeTracking.ts` | L25-230 (Action union + undoRow stub) | G-002/G-003 산출. Action union L32-37 (5 actions, UNDO 미존재). undoRow stub L165-174 (throw Error → G-004 실구현). `dispatch` L43-64 reducer |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking/src/index.ts` | L1-23 (전체) | G-001 산출. 현 barrel. G-004: `getRowStatusClassName`, `defaultRowStatusClassNames`, `RowStatusClassNames` 추가 |

**자체 설계 핵심 (D3 + D5 + D7)**:
```
RowStatusClassNames = { added: string; edited: string; deleted: string }
defaultRowStatusClassNames: Readonly<RowStatusClassNames>  // AC-002 값
getRowStatusClassName(status: RowStatus, classNames?: RowStatusClassNames): string
applyUndo<TData>(state: ChangeMapState<TData>, key: string): ChangeMapState<TData>
```

### L3: 영향 사용처 (Read 확인)

| 파일 | Read 라인 | 사용 패턴 |
|------|----------|----------|
| `D:/project/topvel_project/TOMIS/tw-framework-front/src/pages/tomis/payroll/PayrollEditablePage.tsx` | L1-50 (전체 Read) | `ChangeTrackingGrid` via `gridRef`. `resetChanges` 만 노출 — G-004 undoRow 로 per-row undo 가능. 본 G-004 미수정 (affectedUsageFiles: [] — goals.json) |

**본 G-004 의 영향 사용처 수정 = 0 파일** (goals.json affectedUsageFiles: [] 명시). G-005 가 ChangeTrackingGrid 통합 책임.

### R-A: AG Grid — N/A

goals.json L287 명시: `(N/A)`. AG Grid Server-side Row State 는 자체 ChangeSet/undo 컨셉 없음.

### R-W: Wijmo formatItem 이벤트 기반 DOM 스타일링 — 참조 (코드 차용 X — C-16)

goals.json R-W: `Wijmo formatItem 이벤트 기반 DOM 스타일링 패턴 학습 (publish-wijmo-analysis.md §3) — 참조만, 코드 차용 X (C-16)`. Wijmo 는 `formatItem` 이벤트에서 직접 DOM style 객체 조작. G-004 는 React Tailwind className 패턴으로 대체 (CSS-in-JS / inline style 미사용). **@mescius/wijmo\* import 0건 의무 — AC-005.**

---

## Section 2: API 계약 (TypeScript)

### 2.1 신규 타입 및 상수 (export 경로: `@tomis/grid-pro-tracking`)

**MODIFY — `RowStatusClassNames` interface 신설** (`types.ts`, D3, AC-002):
```ts
/**
 * Tailwind className strings for each row status.
 * Pass a partial override to `getRowStatusClassName` to customise colours.
 * @see defaultRowStatusClassNames for the built-in values.
 * @see AC-002 — default values are canonical.
 */
export interface RowStatusClassNames {
  added: string;
  edited: string;
  deleted: string;
}
```

**NEW — `rowStatusStyle.ts` 공개 helpers** (`src/internal/rowStatusStyle.ts`, D3, AC-002/AC-003):
```ts
import type { RowStatus } from '../types';
import type { RowStatusClassNames } from '../types';

/**
 * Default Tailwind className strings for each RowStatus.
 * Consumers can spread-override to customise a single key.
 * @see AC-002 — canonical values (goals.json G-004 AC-002).
 */
export const defaultRowStatusClassNames: Readonly<RowStatusClassNames> = {
  added:   'bg-green-50 border-l-2 border-green-400',
  edited:  'bg-yellow-50 border-l-2 border-yellow-400',
  deleted: 'bg-red-50 line-through opacity-60',
};

/**
 * Returns the Tailwind className string for a given RowStatus.
 * If `classNames` is provided, it is merged over `defaultRowStatusClassNames`
 * (consumer override). Returns `''` for an unknown status (defensive).
 *
 * @param status  - RowStatus value from `row.__rowStatus`.
 * @param classNames - Optional override map (partial override supported via spread).
 * @returns Tailwind className string, or `''` if status is not recognised.
 * @see AC-003 — zero Wijmo import; pure helper (C-32).
 */
export function getRowStatusClassName(
  status: RowStatus,
  classNames?: RowStatusClassNames,
): string {
  const merged = classNames
    ? { ...defaultRowStatusClassNames, ...classNames }
    : defaultRowStatusClassNames;
  return merged[status] ?? '';
}
```

### 2.2 `applyUndo` pure helper (`src/internal/changeMap.ts` MODIFY, D5/D6)

**시그니처 및 4-branch 시맨틱**:
```ts
/**
 * Undo the tracked change for a single row by key.
 *
 * Four branches (D5):
 *  ① 'added'   → net-zero removal: scrub from statusMap, currentMap,
 *                originalMap, insertionOrder (reuse applyDelete 'added' pattern).
 *  ② 'edited'  → restore originalMap[key] to currentMap[key],
 *                delete key from statusMap and originalMap.
 *  ③ 'deleted' → un-mark: delete key from statusMap only (currentMap intact).
 *  ④ undefined (unknown / unchanged) → console.warn + return state unchanged
 *               (no throw — ADR-MOD-GRID-10-004 parity, applyUpdate L157-159 pattern).
 *
 * @param state - Current ChangeMapState.
 * @param key   - Row key to undo.
 * @returns New ChangeMapState (immutable update).
 */
export function applyUndo<TData>(
  state: ChangeMapState<TData>,
  key: string,
): ChangeMapState<TData>
```

**브랜치별 상태 변경 요약**:

| branch | statusMap | currentMap | originalMap | insertionOrder |
|--------|-----------|------------|-------------|----------------|
| `'added'` | `delete(key)` | `delete(key)` | `delete(key)` | `.filter(k ≠ key)` |
| `'edited'` | `delete(key)` | `set(key, originalMap[key])` | `delete(key)` | 변경 없음 |
| `'deleted'` | `delete(key)` | 변경 없음 | **`delete(key)`** (leak 방지 — D5) | 변경 없음 |
| `undefined` | 변경 없음 | 변경 없음 | 변경 없음 | 변경 없음 + warn |

**`'deleted'` branch originalMap.delete(key) 이유 (D5 EC-05)**: unchanged→updateRow→deleteRow→undoRow(→'deleted' branch)→updateRow 시퀀스에서 undoRow 후 originalMap[key] 가 잔존하면, 후속 updateRow 가 `applyUpdate` 의 `prevStatus === undefined` 분기에서 `structuredClone(currentMap[key])` 로 snapshot을 덮어씌우는 대신 기존 잔존 originalMap[key] 를 그대로 두게 되어 snapshot-once invariant 위반. `delete(key)` 로 scrub 하면 후속 updateRow 가 올바르게 재snapshot 함.

### 2.3 `editedCells` 구조적 typed surface (D4 — types.ts + useChangeTracking.ts MODIFY)

**목적**: AC-004 structural/functional split. G-004 에서 타입 시그니처 + stub view 선언 → G-005 에서 runtime `Map<rowKey+'_'+columnId, true>` 추적 + `cellClassName` 콜백 wiring.

**`ChangeTrackingConfig<TData>` 추가 field** (`types.ts` MODIFY):
```ts
// G-004 추가 — runtime wiring은 G-005 책임
/** 셀 단위 편집 추적 활성화. `true`로 설정 시 editedCellsMap에 편집된 셀 위치 기록. Default false. (G-005 wires reducer) */
editedCells?: boolean;
```

**`ChangeTrackingAPI<TData>` 추가 member** (`types.ts` MODIFY):
```ts
// G-004 추가 — 항상 new Map() 반환 (stub). G-005에서 실 데이터 채움.
/** 편집된 셀 위치 맵. key = `rowKey + '_' + columnId`. editedCells config가 false면 항상 empty. (G-005 wires) */
editedCellsMap: ReadonlyMap<string, boolean>;
```

**`useChangeTracking` return 에 stub 추가** (`useChangeTracking.ts` MODIFY):
```ts
// G-004: editedCellsMap stub — G-005에서 reducer 통합으로 실구현.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editedCellsMap: ReadonlyMap<string, boolean> = useMemo(() => new Map(), []);
```
return object 에 `editedCellsMap` 추가.

### 2.4 `undoRow` 실구현 (`src/useChangeTracking.ts` MODIFY, D7)

**Action union 확장** (L32-37 기존 5-branch → 6-branch):
```ts
type Action<TData> =
  | { type: 'ADD'; seed: Partial<TData>; assignedKey: string }
  | { type: 'UPDATE'; key: string; patch: Partial<TData> }
  | { type: 'DELETE'; key: string }
  | { type: 'RESET' }
  | { type: 'REBUILD'; data: readonly TData[]; extractKey: (row: TData) => string }
  | { type: 'UNDO'; key: string };  // G-004 추가
```

**undoRow After** (L165-174 stub 교체):
```ts
const undoRow = useCallback((key: string): void => {
  dispatch({ type: 'UNDO', key });
}, []);
```

**reducer UNDO case** (reducer switch 추가):
```ts
case 'UNDO':
  return applyUndo(state, action.key);
```

---

## Section 3: 영향받는 사용처 파일 목록

**해당 없음** — goals.json `affectedUsageFiles: []`. G-004 는 신규 helper 추가 + undoRow stub 실구현으로, 기존 사용처가 API를 새로 호출하도록 수정하는 단계가 아님 (G-005 통합 책임). `PayrollEditablePage.tsx` 는 참조(Section 1 L3)로 확인했으나 수정 대상 아님.

---

## Section 4: 하위 호환성 정책

**breaking**: `false` (goals.json `compatibilityPolicy.breaking: false`)

**이유**:
1. `undoRow` 는 G-002 시점부터 `ChangeTrackingAPI` 에 선언된 stub → 타입 시그니처 불변, throw→dispatch 는 런타임 동작 교체(사용처 0건이므로 breaking 0).
2. `RowStatusClassNames` 신설 + `getRowStatusClassName` / `defaultRowStatusClassNames` 신규 export → 추가만 (기존 심볼 삭제/변경 0).
3. `applyUndo` 는 `internal/` 경로 → public surface 아님 (internal 은 public export X 정책 — G-002 C-32).

**deprecation**: `신규 기능 — alias 불필요` (goals.json 명시)

**migrationPath**: N/A

---

## Section 5: Acceptance Criteria 목록

| AC# | 기준 | 출처 |
|-----|------|------|
| AC-001 | `__rowStatus: 'added'\|'edited'\|'deleted'` 필드가 `rows` 항목에 포함 (`TData & { __rowStatus: RowStatus }`) — 렌더러가 `cellClassName` 으로 스타일 적용. C-5: Tailwind className only, `style={{}}` 금지. **[G-002 산출 — materialize() 이미 __rowStatus attach. G-004 신규 작업 없음 — verification 항목]** | `C-5` + G-002 cascade |
| AC-002 | 기본 rowStatusClassName: `{ added: 'bg-green-50 border-l-2 border-green-400', edited: 'bg-yellow-50 border-l-2 border-yellow-400', deleted: 'bg-red-50 line-through opacity-60' }` — `defaultRowStatusClassNames` 상수로 export. C-5 Tailwind only. | `C-5` + goals.json AC-002 |
| AC-003 | `undoRow(key: string)`: void API 실구현. added 행 undo → `rows` 에서 제거 (net-zero). edited 행 undo → originalSnapshot 복원. deleted 행 undo → 삭제 표시 해제. unknown key → `console.warn` + no-op (no throw). | `L1` (자체 설계) |
| AC-004 | `editedCells` structural/functional split (D4): **G-004 delivers typed surface** — `ChangeTrackingConfig.editedCells?: boolean` 추가 + `ChangeTrackingAPI.editedCellsMap: ReadonlyMap<string, boolean>` stub(항상 `new Map()`) 추가. **runtime** `Map<rowKey+'_'+columnId, true>` 추적 + `cellClassName` 콜백 연결은 **G-005 책임**. G-001 D5 선례: G-001에서 구조 선언, G-002에서 런타임 구현. | `L1` + G-001 D5 cascade |
| AC-005 | `@mescius/wijmo*` import 0건 (C-16). Wijmo `formatItem` 스타일링 패턴은 학습 참조만. | `C-16` |
| AC-006 | `tsc --noEmit` 0 error (C-12). `exactOptionalPropertyTypes` 대응: optional field spread 시 `...(classNames ?? {})` 패턴 사용 금지 — `classNames ? { ...defaults, ...classNames } : defaults` 패턴 사용 (C-29). | `C-12` + `C-29` |
| AC-007 | Storybook story 1개 (C-25): added/edited/deleted 각 상태 시각 + `undoRow` 인터랙션. `useChangeTracking.stories.tsx` 기존 파일에 추가 entry (G-003 D9 policy cascade). | `C-25` |

---

## Section 6: Edge Cases

| EC# | 케이스 | 기대 동작 | 참조 |
|-----|--------|----------|------|
| EC-01 | `undoRow(key)` — `'added'` 행 undo | net-zero 제거: statusMap.delete(key) + currentMap.delete(key) + originalMap.delete(key) + insertionOrder.filter. `rows` 에서 즉시 제거. `hasChanges()` 해당 행이 유일한 변경이면 → `false` 반환. | changeMap.ts applyDelete added-branch L218-234 패턴 재활용 |
| EC-02 | `undoRow(key)` — `'edited'` 행 undo 후 재수정 | undo 완료 → statusMap.delete(key) + originalMap.delete(key) + currentMap.set(key, original). 이후 `updateRow(key, patch)` 호출 시 applyUpdate: prevStatus=undefined → 재snapshot (EC-02 snapshot-once 재적용). | changeMap.ts applyUpdate L167-170 |
| EC-03 | `undoRow(key)` — `'deleted'` 행 undo | statusMap.delete(key) 만. currentMap 은 삭제 전 값 그대로 (applyDelete 는 mark-only). `rows` 에서 해당 행 `__rowStatus` 없이 복원. | applyDelete mark-only 설계 (changeMap.ts L236-238) |
| EC-04 | `undoRow(key)` — unknown key (snapshot에 없는 key) | `console.warn('[grid-pro-tracking] undoRow: unknown key ${key}')` + state unchanged 반환 (no throw). applyUpdate L157-159 warn 패턴 일관성. | changeMap.ts L157-159 warn pattern |
| EC-05 | `undoRow(key)` — unchanged row (statusMap에 없음 = 한 번도 수정 안 됨) | EC-04 동일 처리: statusMap.get(key) === undefined → console.warn + state unchanged. | D6 applyUndo branch ④ |
| EC-06 | `undoRow(key)` — unchanged→updateRow→deleteRow→undoRow→updateRow 시퀀스 (originalMap leak 검증) | undoRow('deleted' branch): statusMap.delete(key) + **originalMap.delete(key)**. 이후 updateRow 호출 시 applyUpdate: prevStatus=undefined → 신규 structuredClone snapshot (EC-02 invariant 정상 재적용). originalMap 잔존 없음. | D5 'deleted' branch + advisor 지적 |
| EC-07 | `getRowStatusClassName(status, undefined)` — classNames 미제공 | `defaultRowStatusClassNames[status]` 반환. `status` 가 세 값 이외일 경우 (TS 외부에서 호출 등) `''` 반환 (defensive nullish fallback `?? ''`). | D3 + AC-006 |

---

## Section 7: 최종 파일 변경 표 (C-30 권위 표)

| # | 파일 (monorepo 기준) | 변경 유형 | 주요 변경 내용 | D# |
|---|---------------------|----------|--------------|-----|
| 1 | `packages/grid-pro-tracking/src/internal/rowStatusStyle.ts` | **NEW** | `RowStatusClassNames` import + `defaultRowStatusClassNames` 상수 + `getRowStatusClassName` 함수 | D3, D8 |
| 2 | `packages/grid-pro-tracking/src/internal/changeMap.ts` | **MODIFY** | `applyUndo<TData>` 함수 추가 (4-branch undo semantics) | D5, D6 |
| 3 | `packages/grid-pro-tracking/src/useChangeTracking.ts` | **MODIFY** | Action union에 `UNDO` 추가 + reducer `case 'UNDO'` + undoRow stub → dispatch + `editedCellsMap` stub(D4) | D4, D7 |
| 4 | `packages/grid-pro-tracking/src/types.ts` | **MODIFY** | `RowStatusClassNames` interface 신설 + `ChangeTrackingConfig.editedCells?: boolean` + `ChangeTrackingAPI.editedCellsMap` stub view (D4) | D3, D4 |
| 5 | `packages/grid-pro-tracking/src/index.ts` | **MODIFY** | `getRowStatusClassName`, `defaultRowStatusClassNames` named export + `RowStatusClassNames` type export 추가 | D3 |
| 6 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/decisions/MOD-GRID-10-decisions.md` | **MODIFY** | ADR-MOD-GRID-10-007 추가 (rowStatusStyle API + applyUndo semantics + editedCells defer) | D9 |

**합계**: 1 NEW + 5 MODIFY = 6 파일. D2 명시 6 파일과 일치.

---

## Section 8: Preflight 체크리스트

### 8.1 영향 사용처
- **수정 필요 사용처**: 0파일 (goals.json `affectedUsageFiles: []` 명시)
- G-005 이후 `ChangeTrackingGrid.tsx` + `PayrollEditablePage.tsx` 가 `undoRow` / `getRowStatusClassName` 활용

### 8.2 번들 영향
- **예상 증가**: +1 KB (goals.json `bundleImpact.expected: "+1 KB"`) — rowStatusStyle pure helper (~300B) + applyUndo in changeMap (~250B) + undoRow dispatch (~50B) + type export (~0B)
- **현황**: G-002 4040B + G-003 +531B = ~4.57 KB brotli (goals.json bundleProjection 인용)
- **G-004 후 누적**: ~5.57 KB brotli — C-21 한도 20 KB 의 27.9% (충분)
- `.size-limit.json` 수정 불필요

### 8.3 하위 호환성
- breaking: false (Section 4 분석)
- undoRow stub → real dispatch: 동일 시그니처 유지 (throw 제거 = breaking 아님; 사용처 0건)

### 8.4 롤백 계획
- Git revert 단위: `src/internal/rowStatusStyle.ts` 삭제 + `changeMap.ts` applyUndo 제거 + `useChangeTracking.ts` UNDO action 제거 + undoRow stub 복원 + `types.ts` RowStatusClassNames 제거 + `index.ts` export 제거
- 영향 사용처 0건이므로 롤백 cascade 없음

### 8.5 선행 조건
- G-002 complete (changeMap.ts ChangeMapState + materialize — verify 100)
- G-003 complete (buildChangeSet + getChangeSet wire-up — verify 진행 중)
- applyDelete 'added' branch (L218-234) 및 applyUpdate warn pattern (L157-159) 코드 실재 확인 ✓ (Read 2026-05-15)

---

## Section 9: 신규 의존성

**신규 외부 의존성: 없음** (zero-dep 유지 — C-21 패키지 크기 정책).
- `getRowStatusClassName` / `applyUndo` 는 TypeScript 순수 함수, 외부 라이브러리 import 0건.
- `@mescius/wijmo*` import 0건 — AC-005 / C-16 충족.

---

## Section 10: 사용자 여정 매핑

goals.json `userJourneySteps` 매핑:

| Step | 요구 | G-004 구현 |
|------|------|-----------|
| 1 | `tracking.rows` 렌더링 시 `row.__rowStatus` 값으로 Tailwind className 분기 | `getRowStatusClassName(row.__rowStatus)` 호출 → className 반환. AC-001 (G-002 산출 __rowStatus attach 이미 충족) |
| 2 | `added → 'bg-green-50 border-l-2 border-green-400'`, `edited → 'bg-yellow-50 border-l-2 border-yellow-400'`, `deleted → 'bg-red-50 line-through opacity-60'` | `defaultRowStatusClassNames` 상수 (AC-002). 커스텀은 `RowStatusClassNames` 타입으로 전달 |
| 3 | 행 status indicator column (optional) — 아이콘 표시 | `row.__rowStatus` 로 아이콘 분기 (소비자 책임 — 본 Goal scope 외 렌더 로직) |
| 4 | `undoRow(key)` API → 해당 행만 원본 snapshot 으로 복원, added 면 rows 에서 제거 | `applyUndo` 4-branch (Section 2.2) + dispatcher (Section 2.3) — AC-003 |
| 5 | 수정 셀 레벨 표시 (optional) — 개별 셀 배경 강조 (`editedCells: Set<string>` 추적) | **G-005 defer** (AC-004 scope-split — D4). `RowStatusClassNames` 타입 제공으로 구조 준비 |

---

## Section 11: Before / After

### 11.1 L0 vs G-004 AC-002 className 비교

| Status | L0 ROW_STATUS_COLORS (현 ChangeTrackingGrid.tsx) | G-004 `defaultRowStatusClassNames` (AC-002 권위) |
|--------|---------------------------------------------------|--------------------------------------------------|
| `added` | `'bg-green-50 border-l-2 border-l-green-400'` | `'bg-green-50 border-l-2 border-green-400'` |
| `edited` | `'bg-yellow-50 border-l-2 border-l-yellow-400'` | `'bg-yellow-50 border-l-2 border-yellow-400'` |
| `deleted` | `'bg-red-50 border-l-2 border-l-red-400 opacity-60 line-through'` | `'bg-red-50 line-through opacity-60'` |

**의도적 차이**: `border-l-green-400` (directional) → `border-green-400` (non-directional). deleted: border 제거. goals.json AC-002 권위.

### 11.2 `applyUndo` BEFORE/AFTER snippet

**BEFORE** (changeMap.ts — applyUndo 미존재):
```ts
// changeMap.ts에 applyUndo 없음 — undoRow는 useChangeTracking.ts L165-174에서 throw:
const undoRow = useCallback(
  (_key: string): void => {
    throw new Error(
      'useChangeTracking.undoRow: implemented in MOD-GRID-10/G-004',
    );
  },
  [],
);
```

**AFTER** (changeMap.ts applyUndo + useChangeTracking.ts dispatch):
```ts
// changeMap.ts — applyUndo 추가 (4-branch):
export function applyUndo<TData>(
  state: ChangeMapState<TData>,
  key: string,
): ChangeMapState<TData> {
  const prevStatus = state.statusMap.get(key);

  if (prevStatus === undefined) {
    console.warn(`[grid-pro-tracking] undoRow: unknown key ${key}`);
    return state;
  }

  if (prevStatus === 'added') {
    // net-zero: scrub entirely (① branch)
    const nextStatus = new Map(state.statusMap);
    const nextCurrent = new Map(state.currentMap);
    const nextOriginal = new Map(state.originalMap);
    nextStatus.delete(key);
    nextCurrent.delete(key);
    nextOriginal.delete(key);
    const nextInsertionOrder = state.insertionOrder.filter((k) => k !== key);
    return { statusMap: nextStatus, originalMap: nextOriginal, currentMap: nextCurrent, snapshotMap: state.snapshotMap, insertionOrder: nextInsertionOrder };
  }

  if (prevStatus === 'edited') {
    // restore snapshot (② branch)
    const original = state.originalMap.get(key)!;
    const nextStatus = new Map(state.statusMap);
    const nextCurrent = new Map(state.currentMap);
    const nextOriginal = new Map(state.originalMap);
    nextStatus.delete(key);
    nextCurrent.set(key, original);
    nextOriginal.delete(key);
    return { statusMap: nextStatus, originalMap: nextOriginal, currentMap: nextCurrent, snapshotMap: state.snapshotMap, insertionOrder: state.insertionOrder };
  }

  // prevStatus === 'deleted': un-mark (③ branch) + scrub originalMap (D5 leak fix)
  const nextStatus = new Map(state.statusMap);
  const nextOriginal = new Map(state.originalMap);
  nextStatus.delete(key);
  nextOriginal.delete(key); // prevents snapshot-once invariant violation on subsequent updateRow
  return { statusMap: nextStatus, originalMap: nextOriginal, currentMap: state.currentMap, snapshotMap: state.snapshotMap, insertionOrder: state.insertionOrder };
}

// useChangeTracking.ts — undoRow stub 교체:
const undoRow = useCallback((key: string): void => {
  dispatch({ type: 'UNDO', key });
}, []);
```

### 11.3 구현 단계 표 (Step 1~6)

| Step | 파일 | 작업 내용 | Section 7 # |
|------|------|----------|-------------|
| 1 | `src/types.ts` | `RowStatusClassNames` interface 신설 + `ChangeTrackingConfig.editedCells?: boolean` 추가 + `ChangeTrackingAPI.editedCellsMap: ReadonlyMap<string, boolean>` 추가 (D3, D4) | #4 |
| 2 | `src/internal/rowStatusStyle.ts` | NEW 파일: `defaultRowStatusClassNames` + `getRowStatusClassName` | #1 |
| 3 | `src/internal/changeMap.ts` | `applyUndo<TData>` 함수 추가 (4-branch, D5/D6) — 'deleted' branch: originalMap.delete(key) 포함 | #2 |
| 4 | `src/useChangeTracking.ts` | Action union UNDO 추가 + reducer case + undoRow dispatch (import applyUndo) + `editedCellsMap` stub `useMemo(() => new Map(), [])` + return에 `editedCellsMap` 추가 (D4, D7) | #3 |
| 5 | `src/index.ts` | `getRowStatusClassName`, `defaultRowStatusClassNames` named export + `RowStatusClassNames` type export 추가 | #5 |
| 6 | `decisions/MOD-GRID-10-decisions.md` | ADR-MOD-GRID-10-007 추가 | #6 |

**C-32 패턴 준수**: Step 2~3 (pure helpers, React import 0건) → Step 4 (React shell, useCallback wrap). Step 1 (types.ts) React 미사용.

---

## Section 12: 검증 계획

### 12.1 tsc 검증 (AC-006)
```bash
cd D:/project/topvel_project/topvel-grid-monorepo/packages/grid-pro-tracking
npx tsc --noEmit
# 기대: 0 errors
```

### 12.2 유닛 테스트 (verifier 대상)

| 테스트 항목 | 검증 내용 |
|------------|----------|
| `applyUndo` 'added' branch | statusMap/currentMap/originalMap/insertionOrder 에서 key 삭제됨 |
| `applyUndo` 'edited' branch | currentMap[key] = original값; statusMap/originalMap 에서 key 삭제됨 |
| `applyUndo` 'deleted' branch | statusMap 에서 key 삭제; currentMap 불변 |
| `applyUndo` 'deleted' branch (EC-06) | statusMap.delete + originalMap.delete; currentMap 불변; 후속 updateRow → snapshot-once 재적용 (originalMap 잔존 없음) |
| `applyUndo` unknown key | console.warn 호출 + state ref identity 불변 |
| `getRowStatusClassName` default | 각 status → 기대 className 반환 |
| `getRowStatusClassName` override | custom classNames merged 반영 |
| `getRowStatusClassName` unknown status | `''` 반환 |
| `undoRow` hook integration | dispatch UNDO → state 변경 → rows 반영 |

### 12.3 Storybook (AC-007)
- `useChangeTracking.stories.tsx` 에 `UndoRow` story 추가
- added/edited/deleted 상태 행 렌더 + `undoRow` 인터랙션 버튼 포함

### 12.4 번들 크기 (AC-002 C-21)
- G-004 후 예상 누적 ~5.57 KB brotli (한도 20 KB의 27.9%)

---

## Section 13: 기타 고려사항

### 13.1 Pro 패키지 라이선스 (C-24)
- `@tomis/grid-pro-tracking` EULA 적용 (G-001 결정 cascade)
- `verifyOrWarn` stub (index.ts L14-17) — MOD-GRID-99-A/G-002 에서 실구현
- `getRowStatusClassName` / `defaultRowStatusClassNames` 은 Pro surface — EULA 적용 소비자 전용

### 13.2 `editedCells` G-005 cascade (AC-004 scope-split)
- **G-004 delivers**: `ChangeTrackingConfig.editedCells?: boolean` + `ChangeTrackingAPI.editedCellsMap: ReadonlyMap<string, boolean>` stub (항상 `new Map()`). 타입 시그니처 고정.
- **G-005 delivers**: `editedCells: true` 시 useReducer 에 cell-level 추적 action 추가 + `Map<rowKey+'_'+columnId, boolean>` 상태 관리 + `cellClassName` 콜백 배선.
- G-005 SPECIFY 단계에서 `editedCellsMap` 의 value type(`boolean` vs `true`) 및 `cellClassName` prop 인터페이스 상세 결정 (G-005 spec D# 에서).

### 13.3 Wijmo 코드 차용 0 (C-16)
- `formatItem` DOM 직접 조작 패턴은 참조로만 사용. G-004 는 순수 Tailwind className string 반환.

---

## Section 14: TBD 목록

**TBD 없음** — 모든 설계 결정(D1~D9) 확정. editedCells runtime 은 G-005 명시적 defer (TBD 아닌 의도적 deferral).

---

## Section 15: 참조

| 참조 | 위치 |
|------|------|
| G-001 spec | `artifacts/MOD-GRID-10/tracking/G-001-spec.md` |
| G-002 spec | `artifacts/MOD-GRID-10/tracking/G-002-spec.md` |
| G-003 spec | `artifacts/MOD-GRID-10/tracking/G-003-spec.md` |
| G-004 goals.json | `goals/MOD-GRID-10/tracking-goals.json` (G-004 object) |
| changeMap.ts applyUpdate warn | `src/internal/changeMap.ts` L157-159 |
| changeMap.ts applyDelete added | `src/internal/changeMap.ts` L218-234 |
| useChangeTracking.ts undoRow stub | `src/useChangeTracking.ts` L165-174 |
| useChangeTracking.ts Action union | `src/useChangeTracking.ts` L32-37 |
| L0 ROW_STATUS_COLORS | `tw-framework-front/src/components/tomis/Grid/ChangeTrackingGrid.tsx` L28-33 |
| Constraints | `.claude/tw-grid/constraints.md` C-5, C-12, C-14, C-16, C-21, C-24, C-25, C-28, C-29, C-30, C-31, C-32 |
| ADR-001~006 | `decisions/MOD-GRID-10-decisions.md` |

---

## Section 16: 자가 Self-Check (H-01/H-02/H-03/E-01/E-06/G-01)

| 항목 | 검증 내용 | 결과 |
|------|----------|------|
| **H-01** | Section 1 참조 경로 실재: `ChangeTrackingGrid.tsx` L28-33 (Read 확인 2026-05-15), `changeMap.ts` L157-159 + L218-234 (Read 확인), `useChangeTracking.ts` L165-174 (Read 확인), `types.ts` L10 (Read 확인), `PayrollEditablePage.tsx` L1-50 (Read 확인). 모든 경로 실재. | **PASS** |
| **H-02** | goals.json implementFiles 5 entries (changeMap.ts 5th entry G-01 fix 적용 후): `rowStatusStyle.ts`(NEW), `changeMap.ts`(MODIFY), `useChangeTracking.ts`(MODIFY), `types.ts`(MODIFY), `index.ts`(MODIFY). Section 7 표 5 src entries 와 1:1 매칭. decisions.md MODIFY = harness convention 상 implementFiles 미포함 (spec-only artifact) → Section 7 #6 별도 enumerate. D4 editedCells surface: types.ts #4 + useChangeTracking.ts #3 에 포함 (파일 추가 없음). | **PASS** |
| **H-03** | 모든 AC에 `source` 태그 명시 (AC-001: C-5+G-002, AC-002: C-5, AC-003: L1, AC-004: L1+G-001 D5, AC-005: C-16, AC-006: C-12+C-29, AC-007: C-25). goals.json AC source 필드 인용. | **PASS** |
| **E-01** | Section 7 표 6행 = D2 명시 6파일 = Section 11.3 Step 표 6행. 3-way 일치. | **PASS** |
| **E-06** | Spec Truth Table: D# 표 결정이 Section 7 표 / Section 11 / Section 5 AC / Section 6 EC 모두 일관. "재결정" 키워드 0건. D8 L0-vs-AC-002 차이는 D8에서 명문화. AC-004 구조 제공(D4) ↔ Section 2.4 + Section 5 AC-004 + Section 7 #3/#4 일관. D5 'deleted' originalMap.delete ↔ Section 2.2 브랜치 표 + Section 11.2 snippet + EC-06 일관. | **PASS** |
| **G-01** | D# decisions ↔ goals.json data consistency: goals.json G-004 implementFiles 5 entries (changeMap.ts 5th entry 추가됨) + Section 7 표 5 src entries + decisions.md MODIFY 1 (convention 상 제외) = 일치. G-003 loop 0 동일 실패 패턴 방지. | **PASS** |

**종합 평가**: H-01/H-02/H-03/E-01/E-06/G-01 모두 PASS. threshold 90 (medium) 기준 충족 예상.
