# G-002 Spec — `useGridState` initialState prop + controlled mode (외부 state 주입)

**Goal**: MOD-GRID-02 / G-002
**Stage**: SPECIFY
**Model**: sonnet (medium)
**Rubric**: specify-rubric v1.0.4
**Threshold**: 90 (medium tier)
**Created**: 2026-05-14
**DependsOn**: MOD-GRID-02/G-001 (완료)

---

## ★ 사전 결정 표 (D#) — G-01 v1.0.4 cross-consistency 기준

| ID | 결정 내용 |
|----|-----------|
| D1 | **C-28 경로 정정**: goals.json `implementFiles` 중 일부가 `TOMIS/packages/...` prefix를 포함할 가능성 → spec authority (C-27) 기준으로 본 spec Section 7의 monorepo 경로(`topvel-grid-monorepo/packages/...`)를 정확한 경로로 채택 |
| D2 | **파일 변경: NEW 1 + MODIFY 3 = 4파일** — NEW: `internal/useControllableState.ts`. MODIFY: `useGridState.ts` (options 파라미터 추가 + useControllableState 8개 wiring), `types.ts` (GridStateValues/GridStateKey/UseGridStateOptions 3개 타입 추가), `index.ts` (UseGridStateOptions/GridStateValues/GridStateKey 3개 type export 추가) |
| D3 | **goals.json drift 기록** — goals.json G-002 `implementFiles`에 `types.ts`, `index.ts` 미포함 (2개 파일만 열거). spec authority (C-27) 기준으로 소비자 type import 가능성 및 실제 코드 변경 범위를 검토한 결과 두 파일 MODIFY 확정. goals.json 업데이트는 implement 단계 권장 |
| D4 | **C-29 exactOptionalPropertyTypes 적용 판단** — `useControllableState<T>({ value: options?.state?.sorting, ... })` 형태에서 `options?.state?.sorting`은 `SortingState | undefined`. `useControllableState` 내부 `value` 필드가 `value?: T`(T만)면 TS2375 발생. **C-29 union 명시 pattern 적용**: `value: T | undefined` (NOT `value?: T`) — G-001 D4의 "C-29 해당 없음"과 달리 G-002는 진짜 적용 case (R-1 cascading risk 해소). 선례: ADR-MOD-GRID-01-004 EmptyStateProps `string | undefined` union 명시 |
| D5 | **`onStateChange` 시그니처 G-002 확정**: G-003에서 debounce 추가 예정이나, G-002에서 시그니처를 `(next: GridStateValues<TData>, key: GridStateKey) => void`로 확정. G-003은 `debounceMs` 옵션 추가만. 시그니처 변경 없음 (breaking 없음) |
| D6 | **controlled ↔ uncontrolled mount 후 모드 전환 동작**: React controlled component 표준 준수 — mount 후 `state` prop이 `undefined → 정의` 또는 `정의 → undefined`로 변경되면 `dev mode console.warn` 1회 발생. 전환 금지는 아니지만 비권장 (React 표준과 동일) |
| D7 | **번들 예측 +2 KB (goals.json 참조치)**. G-001 실측 24.64 KB 기준 / 30 KB 한도. ADR-MOD-GRID-00-010 "measurement at implement time only" 적용 — extrapolation 금지. 이론적 여유: 30 - 24.64 = 5.36 KB |

---

## Section 1 — 현황 및 배경

### 1.1 L0: 현 구현 파일 + 코드 발췌

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` (G-001 구현체, 직접 Read 확인)

```ts
// 현재 G-001 구현 — 파라미터 없음 (L65)
export function useGridState<TData = unknown>(): GridState<TData> {
  const [sorting, setSorting] = useState<SortingState>([]);
  // ... 8개 useState (L66-76)
  return { sorting, ..., setSorting, ... };
}
```

**현황**: 파라미터가 없어 initialState 설정 불가. 외부 store 연동 불가. controlled mode 없음.

**L0 출처**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` L65 (직접 Read 확인)

### 1.2 L1: TanStack v8 API 참조

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` §3

TanStack Table의 controlled state 패턴:

```ts
// TableOptions §3 (tanstack-api-inventory.md §3 직접 확인)
interface TableOptions<TData> {
  state?: Partial<TableState>;           // 외부 state 주입 (controlled 키 단위)
  onSortingChange?: OnChangeFn<SortingState>;   // setter (controlled 시 필수)
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  onColumnOrderChange?: OnChangeFn<ColumnOrderState>;
  onColumnSizingChange?: OnChangeFn<ColumnSizingState>;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  // 초기값은 state.XXX로 주입 or 별도 initialState 개념 없음 (TanStack 자체)
}
```

**L1 결론**: TanStack은 `state.XXX` prop으로 controlled, 미제공 시 내부 상태 사용(uncontrolled). 키 단위 혼합(mixed) 가능.

### 1.3 L2: 8 variant 공통 패턴 분석

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` §5

현재 8 variant 모두 uncontrolled(직접 useState). controlled state 패턴 없음.
- `DailyAttendancePage.tsx` 등 서버 사이드 검색 연동 페이지는 외부 state 주입 필요 (L3 근거)
- 기존 AG Grid `clearSelectionKey` 패턴: 외부 트리거로 grid state reset (참조)

### 1.4 L3: 영향 사용처

`affectedUsageFiles: []` (goals.json G-002 확인). G-002는 useGridState에 옵션 파라미터 추가 — 기존 호출 `useGridState()` 파라미터 없는 형태는 `options=undefined`로 동작하므로 **영향 사용처 0개** (options optional).

### 1.5 migrationImpact

**medium** (goals.json G-002 확인) — controlled state 패턴 도입. 직접 사용처는 신규 페이지 (MOD-GRID-17) 또는 외부 store 연동 시. 기존 사용처 영향 없음.

### 1.6 R-A / R-W 참조

- **R-A (AG Grid)**: AG Grid `GridOptions.defaultColDef` + `GridOptions.columnDefs` 초기값 지정 패턴. controlled state는 AG Grid Enterprise only. 코드 차용 금지 (C-7, C-16). 참조만.
- **R-W (Wijmo)**: CollectionView `currentItem` / `trackChanges` — 내장 관리, 외부 state 주입 없음. Wijmo import 금지 (C-16). 참조만.
- **결론**: 두 라이브러리 모두 hook 기반 controlled/uncontrolled 분리 패턴 없음 → shadcn/Radix 의 `useControllableState` 패턴을 reference로 채택 (MIT, 코드 직접 재사용 아닌 패턴 참조)

---

## Section 2 — API 계약

### 2.1 신규 타입 정의 (types.ts에 추가)

```ts
// packages/grid-core/src/types.ts (MODIFY — 추가)

import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';

/**
 * useGridState가 관리하는 8개 state의 value-only 타입.
 * setter를 포함하지 않음 (GridState와 구분).
 *
 * @typeParam TData - 현재 미사용 (G-003+ 확장 예정). 일관성을 위해 유지.
 */
export interface GridStateValues<TData = unknown> {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
}

/**
 * useGridState의 8개 state key union.
 * resetSection(key) / onStateChange(next, key) 등에서 사용.
 */
export type GridStateKey =
  | 'sorting'
  | 'columnFilters'
  | 'rowSelection'
  | 'pagination'
  | 'columnPinning'
  | 'columnOrder'
  | 'columnSizing'
  | 'columnVisibility';

/**
 * useGridState<TData>(options?) 의 파라미터 타입.
 *
 * @typeParam TData - 행 데이터 타입 (GridStateValues에 전달).
 */
export interface UseGridStateOptions<TData = unknown> {
  /**
   * uncontrolled 모드 초기값.
   * 제공 시 해당 키의 useState 초기값으로 사용.
   * controlled 모드(`state` 제공)와 함께 사용 시 initialState는 무시됨 (controlled 우선).
   */
  initialState?: Partial<GridStateValues<TData>>;

  /**
   * controlled 모드 외부 state.
   * Partial<GridStateValues>로 키 단위 controlled 허용.
   * `state.sorting`이 있으면 sorting은 controlled, 나머지는 uncontrolled.
   *
   * @remarks exactOptionalPropertyTypes: true 환경 — 이 필드가 존재하면
   * `undefined`와 "미제공"을 구분. undefined를 명시적으로 전달하면 controlled 해제.
   */
  state?: Partial<GridStateValues<TData>>;

  /**
   * state 변경 통보 콜백.
   * controlled/uncontrolled 양쪽에서 호출됨.
   * G-003에서 debounceMs 옵션 추가 예정 (시그니처 변경 없음).
   */
  onStateChange?: (next: GridStateValues<TData>, key: GridStateKey) => void;
}
```

### 2.2 hook 시그니처 확장

```ts
// packages/grid-core/src/useGridState.ts (MODIFY)

// G-001: useGridState<TData = unknown>(): GridState<TData>
// G-002: 확장
function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>
): GridState<TData>
```

- `options` optional → G-001 `useGridState()` 호출 완전 보존 (C-6 backward compatibility)
- 반환 타입 `GridState<TData>` 변경 없음 (8 state + 8 setter)

### 2.3 `useControllableState` 내부 헬퍼 API

```ts
// packages/grid-core/src/internal/useControllableState.ts (NEW)

interface UseControllableStateOptions<T> {
  /**
   * controlled 모드 외부 value.
   * exactOptionalPropertyTypes: true 환경 — optional이 아닌 T | undefined union 명시 (D4 C-29).
   * 이유: caller가 `options.state?.sorting` (T | undefined)을 이 필드에 전달하므로
   * child의 `value?: T` (T만 허용)로의 직접 forwarding은 TS2375 발생.
   */
  value: T | undefined;          // ← ?: 아닌 union 명시 (C-29 union 명시 pattern)
  defaultValue: T;               // uncontrolled 초기값 (필수)
  onChange?: (next: T) => void;  // 변경 통보
}

function useControllableState<T>(
  opts: UseControllableStateOptions<T>
): [T, (updater: T | ((prev: T) => T)) => void]
```

- `value`가 `undefined`이면 uncontrolled (내부 useState 사용)
- `value`가 `T`이면 controlled (내부 state 무시, onChange만 호출)
- 반환 setter는 `OnChangeFn<T>` 호환 — functional update(`(prev) => next`) 지원

### 2.4 기본값 (D1 — L1 §2.2 + G-001 D4 계승)

| state | 기본값 (uncontrolled default) | 출처 |
|-------|------------------------------|------|
| sorting | `[]` | TanStack SortingState |
| columnFilters | `[]` | TanStack ColumnFiltersState |
| rowSelection | `{}` | TanStack RowSelectionState |
| pagination | `{ pageIndex: 0, pageSize: 10 }` | TanStack PaginationState |
| columnPinning | `{}` | TanStack ColumnPinningState |
| columnOrder | `[]` | TanStack ColumnOrderState |
| columnSizing | `{}` | TanStack ColumnSizingState |
| columnVisibility | `{}` | TanStack VisibilityState |

`initialState`가 특정 키를 제공하면 해당 키의 기본값으로 대체.

### 2.5 사용 예시 1 — uncontrolled + initialState

```tsx
import { useGridState } from '@tomis/grid-core';

function SlipListPage() {
  // 초기 정렬: 날짜 내림차순
  const s = useGridState<Slip>({
    initialState: {
      sorting: [{ id: 'date', desc: true }],
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  // s.sorting 초기값 = [{ id: 'date', desc: true }]
  // 이후 setSorting 호출 시 내부 state 변경 (uncontrolled)
  const table = useReactTable<Slip>({
    data,
    columns,
    state: { sorting: s.sorting, pagination: s.pagination },
    onSortingChange: s.setSorting,
    onPaginationChange: s.setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
}
```

### 2.6 사용 예시 2 — controlled mode (Redux/Zustand 연동)

```tsx
import { useSelector, useDispatch } from 'react-redux';
import { useGridState } from '@tomis/grid-core';

function DailyAttendancePage() {
  const dispatch = useDispatch();
  const externalSorting = useSelector(selectGridSorting);

  // sorting만 controlled, 나머지 uncontrolled
  const s = useGridState<Attendance>({
    state: { sorting: externalSorting },
    onStateChange: (next, key) => {
      if (key === 'sorting') dispatch(setGridSorting(next.sorting));
    },
  });

  // s.sorting = externalSorting (controlled — external store 기준)
  // s.columnFilters = internal state (uncontrolled)
  // s.setSorting 호출 시 → onStateChange(next, 'sorting') 호출
  //   → dispatch → Redux → externalSorting 변경 → re-render → s.sorting 갱신
}
```

---

## Section 3 — 기존 variant 대응표

| AS-IS 패턴 | 신규 API | 마이그레이션 액션 |
|-----------|---------|----------------|
| `useGridState()` (G-001 파라미터 없는 호출) | `useGridState()` — options=undefined → 동작 보존 | 변경 없음 |
| `useState<SortingState>([{id:'date',desc:true}])` | `useGridState({ initialState: { sorting: [...] } })` | 치환 (optional) |
| `useState(externalSorting)` + `useEffect` 동기화 | `useGridState({ state: { sorting: externalSorting }, onStateChange })` | 치환 (권장) |
| 외부 검색 폼 + grid state 분리 | `useGridState({ state: partialExternal })` mixed mode | 점진 마이그레이션 |

---

## Section 4 — Breaking Change / Deprecation

- **Breaking change**: **없음** (G-001 `useGridState()` 파라미터 없는 호출 완전 보존 — `options?: UseGridStateOptions<TData>` optional)
- **Deprecation**: 없음. 신규 기능 추가만.
- **마이그레이션 경로**: 기존 사용처는 변경 불필요. 신규 controlled/initialState 기능은 opt-in.
- **Breaking 시 계획 (해당 없음)**: G-002는 breaking 없으므로 D-04 N/A.

---

## Section 5 — 호환성 정책

- **TypeScript (exactOptionalPropertyTypes: true)**: `useControllableState.value: T | undefined` union 명시 패턴 적용 (D4, C-29). `UseGridStateOptions.state?: Partial<GridStateValues<TData>>` — Partial이므로 각 키는 `T | undefined` 가능. hook 내부에서 `opts.state?.sorting !== undefined` 조건 분기 후 `useControllableState({ value: opts.state.sorting, ... })` 전달 — TS2375 없음.
- **React 19 StrictMode**: `useState` + `useRef` 표준 사용. double-invoke 안전 (AC-005). `useControllableState`의 상태 초기화는 `useState(defaultValue)` 표준 — StrictMode 재호출 안전.
- **React 18/19 호환**: `useState` API — 양 버전 호환.
- **TanStack v8**: `OnChangeFn<T>` 타입 계승. 변경 없음.
- **Bundle**: +2 KB 예측 (goals.json) / 실측 implement 시. 이론적 여유 5.36 KB (ADR-MOD-GRID-00-010 extrapolation 금지).
- **No `any`**: 전체 strict (C-4). `useControllableState<T>` generic으로 타입 보존.

---

## Section 6 — 엣지 케이스

| # | 엣지 케이스 | 예상 동작 |
|---|------------|---------|
| EC-01 | `options=undefined` (`useGridState()` 파라미터 없음) | G-001 완전 호환. 모든 state = 기본값 (uncontrolled). Section 2.4 기본값 적용 |
| EC-02 | `initialState` 일부 키만 제공 (`initialState: { sorting: [...] }`) | 제공 키만 initialState 적용. 나머지 키는 Section 2.4 기본값 사용 (`Partial<GridStateValues>` 보장) |
| EC-03 | `state` prop이 mount 후 `undefined → 정의`로 변경 (controlled 모드 진입) | dev mode `console.warn` 1회 발생 (D6). state 값은 제공된 값으로 변경됨 |
| EC-04 | `state` prop이 mount 후 `정의 → undefined`로 변경 (uncontrolled로 전환) | dev mode `console.warn` 1회 발생 (D6). 이전 controlled 값이 내부 state로 잔존 (React standard) |
| EC-05 | mixed: `state.sorting` controlled + `state.columnFilters` undefined (미제공) | sorting = controlled (외부 state 우선). columnFilters = uncontrolled (내부 state 관리). 키 단위 분기 정확 동작 |
| EC-06 | `onStateChange` 미제공 + `state` 제공 (controlled, 콜백 없음) | controlled 상태는 갱신되나 외부 알림 없음. dev mode `console.warn` 1회 권고 (controlled + 콜백 없음은 읽기 전용 의도로 해석) |
| EC-07 | **C-29 exactOptionalPropertyTypes** — `useControllableState({ value: opts.state?.sorting, ... })` | `opts.state?.sorting`은 `SortingState | undefined`. `value: T | undefined` union 명시로 TS2375 없음 (D4). spread 패턴 불필요 — internal helper의 union 명시 패턴 (ADR-MOD-GRID-01-004 선례) |
| EC-08 | React 19 StrictMode — `useControllableState` 내부 `useState` 더블 invoke | `useState(defaultValue)` 순수 초기화 — 더블 invoke 후에도 동일 initialValue 결과. 안전 (AC-005) |
| EC-09 | `initialState.pagination.pageSize = 50` + `state.pagination` controlled | controlled 우선 — `state.pagination`이 존재하므로 `initialState.pagination` 무시. 혼동 방지를 위해 JSDoc 경고 |

---

## Section 7 — 파일별 변경 명세 (E-01, H-02 cross-check 기준)

| 파일 경로 | NEW/MODIFY | 변경 범위 |
|-----------|-----------|---------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useControllableState.ts` | **NEW** | `UseControllableStateOptions<T>` interface + `useControllableState<T>` hook 전체 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | **MODIFY** | `options?: UseGridStateOptions<TData>` 파라미터 추가 + 8개 `useState` → `useControllableState` 8개 호출로 교체 + `onStateChange` wiring |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | `GridStateValues<TData>`, `GridStateKey`, `UseGridStateOptions<TData>` 3개 타입/인터페이스 추가 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY** | `UseGridStateOptions`, `GridStateValues`, `GridStateKey` 3개 type export 추가 |

**D2 cross-check**: NEW 1개(`useControllableState.ts`) + MODIFY 3개(`useGridState.ts`, `types.ts`, `index.ts`) = 총 4파일 ✓
**분류 cross-check**: D2 "NEW 1 + MODIFY 3 = 4파일" ↔ Section 7 표 NEW 1행 + MODIFY 3행 ✓
**파일명 cross-check**: D2 열거(`useControllableState.ts` / `useGridState.ts` / `types.ts` / `index.ts`) ↔ Section 7 4행 파일명 ✓

---

## Section 8 — 영향도 분석

### 8.1 영향 사용처

`affectedUsageFiles: []` (goals.json G-002 직접 확인) — **0개**. `useGridState()` 기존 파라미터 없는 호출은 `options=undefined`로 동작하여 G-001과 동일. 신규 기능은 opt-in.

### 8.2 무파괴 검증

- `options?: UseGridStateOptions<TData>` — optional. 기존 `useGridState()` 호출 완전 보존 (C-6).
- `types.ts` / `index.ts` MODIFY는 추가(add-only) — 기존 export 무삭제.
- `useGridState.ts` MODIFY: 8개 `useState` → `useControllableState` 교체. `options=undefined`(기본) 시 `useControllableState({ value: undefined, defaultValue: defaultFor[key] })` → uncontrolled, G-001과 동일 동작.
- 이 Goal이 외부 monorepo 경로에 새 파일을 생성 (`internal/useControllableState.ts`) — 부모 디렉토리 `packages/grid-core/src/internal/` 실재 확인: `computePinnedOffset.ts` / `buildTableOptions.ts` / `useAutoSelectFirstRow.ts` / `useGridVirtualizer.ts` / `useGridImperativeHandle.ts` 5개 파일 존재 (Glob 직접 확인).

### 8.3 타입 안전성

```ts
// 타입 검증 스니펫 (type-test 파일)
const s1 = useGridState<User>();                         // G-001 완전 호환
const s2 = useGridState<User>({ initialState: { sorting: [] } });  // uncontrolled + initial
const s3 = useGridState<User>({
  state: { sorting: externalSorting },
  onStateChange: (next, key) => console.log(key, next),
});
// ✓ s3.sorting: SortingState (controlled)
// ✓ s3.setSorting: OnChangeFn<SortingState>
// ✓ no `any` — C-4 compliant
```

### 8.4 롤백 전략

- `useControllableState.ts` 삭제 + `useGridState.ts`를 G-001 버전으로 revert → G-001 상태 복원.
- `types.ts` + `index.ts`에서 추가 타입 3개 제거 → add-only이므로 기존 타입 무영향.
- 사용처 0개 → 롤백 비용 최소.

### 8.5 번들 영향

```
현행 (G-001 verify 실측): 24.64 KB gzipped
한도: 30 KB (C-21, ADR-MOD-GRID-00-007)
예측: +2 KB (goals.json 참조치)
★ ADR-MOD-GRID-00-010 적용:
  "hook profile (+0.12KB G-001 실측) → G-002 hook 추가 예상 +0.4 KB 가능"
  → 실측 의무. extrapolation 금지.
→ D7 측정 게이트: implement 시 size-limit 측정 + 결과 implement-score JSON 기록.
이론적 여유: 30 - 24.64 = 5.36 KB
```

---

## Section 9 — 의존성

### 9.1 peerDependencies (C-22)

변경 없음. G-001 계승:

```json
{
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0",
    "@tanstack/react-table": "^8.0.0",
    "@tanstack/react-virtual": "^3.0.0"
  }
}
```

### 9.2 내부 의존

- `useControllableState.ts` (NEW) → `useState`, `useRef` (react peer)
- `useGridState.ts` (MODIFY) → `useControllableState` (내부) + `UseGridStateOptions`/`GridStateValues` (types.ts)
- 신규 외부 dep 없음 (C-9/C-20 ADR 게이트 영향 없음)

---

## Section 10 — 사용자 여정 매핑

### 10.1 개발자 여정 (5단계 — goals.json userJourneySteps 매핑)

| Step | 사용자 행동 | 시스템 반응 |
|------|-----------|-----------|
| 1 | `useGridState({ initialState: { sorting: [{id:'date',desc:true}] } })` | sorting 초기값 `[{id:'date',desc:true}]` — uncontrolled |
| 2 | `useGridState({ state: externalState, onStateChange })` | controlled 모드 — state prop 우선 |
| 3 | grid에서 정렬 클릭 (controlled 모드) | `setSorting` 호출 → `onStateChange(next, 'sorting')` 발생. 내부 state 변경 없음. 외부 store 갱신 후 re-render로 state 반영 |
| 4 | `useGridState()` (파라미터 없음) | G-001 동일 동작 — 모든 state uncontrolled, 기본값 |
| 5 | `useGridState({ state: { sorting: ext }, })` mixed | sorting controlled, 나머지 uncontrolled — 키 단위 분기 |

### 10.2 최종 사용자 여정

grid state 훅은 개발자 API. 최종 사용자는 grid 렌더링 결과만 경험. N/A.

---

## Section 11 — 구현 계획

### 11.1 Step 순서 (의존성 고려)

**Step 1**: `types.ts` MODIFY — `GridStateValues<TData>`, `GridStateKey`, `UseGridStateOptions<TData>` 추가

**Step 2**: `internal/useControllableState.ts` NEW — `UseControllableStateOptions<T>` + `useControllableState<T>` 구현

**Step 3**: `useGridState.ts` MODIFY — options 파라미터 추가 + useControllableState 8개 wiring + onStateChange 연결

**Step 4**: `index.ts` MODIFY — `UseGridStateOptions`, `GridStateValues`, `GridStateKey` type export 추가

**Step 5**: tsc `--noEmit` → 0 errors 확인 + size-limit 측정

### 11.2 Before/After 코드 스니펫

**Step 2: useControllableState NEW**

```ts
// packages/grid-core/src/internal/useControllableState.ts (전체 신규)
import { useRef, useState } from 'react';

interface UseControllableStateOptions<T> {
  value: T | undefined;     // union 명시 (C-29 D4)
  defaultValue: T;
  onChange?: (next: T) => void;
}

export function useControllableState<T>(
  opts: UseControllableStateOptions<T>
): [T, (updater: T | ((prev: T) => T)) => void] {
  const isControlled = opts.value !== undefined;
  const [internalValue, setInternalValue] = useState<T>(
    isControlled ? opts.value : opts.defaultValue
  );

  // controlled/uncontrolled 모드 전환 경고 (D6)
  const wasControlled = useRef(isControlled);
  if (process.env.NODE_ENV !== 'production') {
    if (wasControlled.current !== isControlled) {
      console.warn(
        '[useControllableState] controlled/uncontrolled mode changed after mount. ' +
        'This is not recommended (React controlled component standard).'
      );
    }
  }
  wasControlled.current = isControlled;

  const setValue = (updater: T | ((prev: T) => T)): void => {
    const next =
      typeof updater === 'function'
        ? (updater as (prev: T) => T)(isControlled ? opts.value! : internalValue)
        : updater;

    if (!isControlled) {
      setInternalValue(next);
    }
    opts.onChange?.(next);
  };

  return [isControlled ? opts.value! : internalValue, setValue];
}
```

**Step 3: useGridState MODIFY — Before/After**

```ts
// BEFORE (G-001)
export function useGridState<TData = unknown>(): GridState<TData> {
  const [sorting, setSorting] = useState<SortingState>([]);
  // ... 7 더
  return { sorting, ..., setSorting, ... };
}

// AFTER (G-002)
export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>
): GridState<TData> {
  // stale-closure 방지: 최신 state 참조를 useRef로 유지
  const snapshotRef = useRef<GridStateValues<TData>>(null!);

  // C-29 D4: opts.state?.sorting은 SortingState | undefined → value: T | undefined union OK
  const [sorting, setSorting] = useControllableState<SortingState>({
    value: options?.state?.sorting,
    defaultValue: options?.initialState?.sorting ?? [],
    onChange: (next) =>
      options?.onStateChange?.({ ...snapshotRef.current, sorting: next }, 'sorting'),
  });
  // ... 8개 동일 패턴

  // ref 갱신 — 매 render마다 최신 snapshot 유지
  const snapshot: GridStateValues<TData> = {
    sorting, columnFilters, rowSelection, pagination,
    columnPinning, columnOrder, columnSizing, columnVisibility,
  };
  snapshotRef.current = snapshot;

  return { sorting, ..., setSorting, ... };
}
```

### 11.3 구현 위험 + 완화

| 위험 | 완화 |
|------|------|
| `onStateChange` snapshot stale closure — 8개 state 중 변경된 key의 onChange가 다른 key 값을 클로저로 캡처하면 stale 값 전달 위험 | `useRef<GridStateValues<TData>>` `snapshotRef`를 두고 매 render마다 갱신. 각 onChange는 `{ ...snapshotRef.current, [key]: next }` 형태로 최신 snapshot 사용 (Section 11.2 After 코드 참고) |
| controlled → uncontrolled 전환 시 내부 state 잔존 | D6 경고 + 전환 후 이전 controlled 값이 defaultValue가 됨을 JSDoc 명시 |
| `options?.state?.sorting` exactOptionalPropertyTypes 오류 | D4: `useControllableState({ value: T | undefined })` union 명시로 해결. TS2375 없음 |
| `initialState` + `state` 동시 제공 혼동 | EC-09: JSDoc 경고 — controlled(`state`) 우선, initialState 무시 명시 |
| React 19 StrictMode double-invoke (useControllableState 내부 useRef) | `useRef` 초기화는 단순 boolean — double-invoke 안전 |

---

## Section 12 — 검증 계획

### 12.1 단위 테스트 (vitest)

```ts
// packages/grid-core/src/__tests__/useGridState-g002.test.ts

describe('useGridState G-002', () => {
  // 모드 1: options=undefined (G-001 호환)
  it('options 없음 — G-001 동일 동작', () => {
    const { result } = renderHook(() => useGridState());
    expect(result.current.sorting).toEqual([]);
    expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 10 });
  });

  // 모드 2: uncontrolled + initialState
  it('initialState — 초기값 적용', () => {
    const { result } = renderHook(() =>
      useGridState({ initialState: { sorting: [{ id: 'date', desc: true }] } })
    );
    expect(result.current.sorting).toEqual([{ id: 'date', desc: true }]);
    act(() => { result.current.setSorting([]); });
    expect(result.current.sorting).toEqual([]); // uncontrolled — 내부 변경
  });

  // 모드 3: controlled (sorting만)
  it('controlled — setSorting은 onStateChange만 호출, 내부 state 변경 없음', () => {
    const externalSorting: SortingState = [{ id: 'col', desc: false }];
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useGridState({ state: { sorting: externalSorting }, onStateChange: onChange })
    );
    expect(result.current.sorting).toEqual(externalSorting);
    act(() => { result.current.setSorting([{ id: 'col', desc: true }]); });
    // controlled — sorting은 externalSorting 그대로 (외부 state 미갱신)
    expect(result.current.sorting).toEqual(externalSorting);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sorting: [{ id: 'col', desc: true }] }),
      'sorting'
    );
  });

  // 모드 4: mixed (sorting controlled + columnFilters uncontrolled)
  it('mixed — sorting controlled, columnFilters uncontrolled', () => {
    const externalSorting: SortingState = [];
    const { result } = renderHook(() =>
      useGridState({ state: { sorting: externalSorting } })
    );
    // columnFilters는 uncontrolled
    act(() => {
      result.current.setColumnFilters([{ id: 'dept', value: 'IT' }]);
    });
    expect(result.current.columnFilters).toEqual([{ id: 'dept', value: 'IT' }]);
    expect(result.current.sorting).toEqual([]); // controlled — 외부 externalSorting 그대로
  });
});
```

### 12.2 TypeScript 타입 검증

```bash
# packages/grid-core에서
pnpm tsc --noEmit
# 0 errors 필수 (C-4, C-12, exactOptionalPropertyTypes)
```

### 12.3 빌드 + 번들 검증 (D7 게이트)

```bash
pnpm --filter @tomis/grid-core build
# dist/ 생성 확인
# size-limit 측정 → 30 KB 미만 확인
# 실측값 implement-score.json bundleMeasured 필드 기록 (ADR-MOD-GRID-00-010)
```

### 12.4 Storybook (C-25)

```
story 경로: packages/grid-core/src/stories/useGridState-controlled.stories.tsx
시나리오:
  - UncontrolledWithInitial: initialState sorting 설정 + 정렬 클릭 변경 확인
  - ControlledSorting: 외부 상태(useState로 시뮬레이션) + controlled sorting
  - MixedMode: sorting controlled + pagination uncontrolled 혼합
```

---

## Section 13 — 상용 제품화

### 13.1 패키지

- **대상**: `packages/grid-core` (MIT 라이선스)
- **라이선스**: MIT — Pro 패키지 아님 (F-02 N/A)

### 13.2 문서 계획 (F-03)

```
Docusaurus 경로: docs/grid-core/hooks/use-grid-state.md (G-001 문서 확장)
  - controlled mode 섹션 추가
  - UseGridStateOptions API 표
  - 사용 예시: uncontrolled+initial / controlled / mixed

Storybook: packages/grid-core/src/stories/useGridState-controlled.stories.tsx
  - Section 12.4 시나리오 3개
```

### 13.3 peerDependencies (F-04 — C-22)

변경 없음. G-001 계승 (Section 9.1).

### 13.4 릴리즈 노트

- `grid-core@1.x` — `useGridState<TData>(options?)` 시그니처 확장 (non-breaking)
- `UseGridStateOptions<TData>` / `GridStateValues<TData>` / `GridStateKey` 신규 type export
- 마이그레이션 가이드: `useGridState()` 기존 호출 변경 없음. controlled 모드는 opt-in.

---

## ★ 메타 게이트 자가-검증

### H-01: referenceEvidence 경로 실재

| 레벨 | 경로 | 검증 방법 |
|------|------|---------|
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | Read 직접 확인 — L65 `function useGridState<TData = unknown>(): GridState<TData>` 발췌 |
| L1 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` | §3 `TableOptions.state?` / `onSortingChange?` 등 확인 |
| L2 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` | §5 variant 중복 분석 확인 |
| L3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | Read 확인 — L65 현재 파라미터 없음 (L0과 동일 파일, 다른 근거) |
| R-A | canonical-modules.json MOD-GRID-02 `referenceAGGrid` | AG Grid 내장 state 참조 (직접 import 금지 C-7) |
| R-W | canonical-modules.json MOD-GRID-02 `referenceWijmo` | CollectionView 참조 (import 금지 C-16) |

**판정**: 전 경로 Read/Glob 도구로 직접 확인 완료 → **H-01 YES**

### H-02: implementFiles 경로 합리성

| 파일 | 부모 디렉토리 실재 | 파일명 컨벤션 | 판정 |
|------|-----------------|------------|------|
| `packages/grid-core/src/internal/useControllableState.ts` | `packages/grid-core/src/internal/` — 5개 파일 Glob 확인 | camelCase hook 파일 (`useAutoSelectFirstRow.ts` 선례) | YES |
| `packages/grid-core/src/useGridState.ts` | 기존 파일 (Read 확인) | 기존 파일 MODIFY | YES |
| `packages/grid-core/src/types.ts` | 기존 파일 (Read 확인) | 기존 파일 MODIFY | YES |
| `packages/grid-core/src/index.ts` | 기존 파일 (Read 확인) | 기존 파일 MODIFY | YES |

외부 monorepo `topvel-grid-monorepo/`: 조부모 `D:/project/topvel_project/` 실재 (ADR-MOD-GRID-00-001). C-28 적용: goals.json G-002 `implementFiles`에 `TOMIS/packages/` 오류 prefix 확인 여부 — goals.json을 직접 Read한 결과, `implementFiles[0]` = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` (올바른 prefix), `implementFiles[1]` = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useControllableState.ts` (올바른 prefix) → **C-28 이미 정확, 정정 불필요**.

**판정**: **H-02 YES**

### H-03: AC 출처 태그 검증

| AC | source 태그 | spec 내 인용 |
|----|------------|------------|
| AC-001 | `C-4` | Section 2.1 `UseGridStateOptions<TData>` strict typing + no any |
| AC-002 | `L1` | Section 1.2 TanStack `TableOptions.state?` 패턴 + Section 2.2 |
| AC-003 | `L1` | Section 1.2 TanStack on*Change 패턴 + Section 2.6 controlled 예시 |
| AC-004 | `L1` | Section 6 EC-05 mixed 동작 + Section 2.6 mixed 예시 |
| AC-005 | `C-12` | Section 6 EC-08 StrictMode double-invoke 안전성 + Section 5 호환성 |

**판정**: **H-03 YES**

---

## ★ G-01 v1.0.4 Cross-Consistency 검증

### D# ↔ Section 7 ↔ Section 11 1:1 매핑

| D# | 명시 내용 | Section 7 일치 | Section 11 일치 |
|----|----------|--------------|---------------|
| D2 | NEW 1 + MODIFY 3 = 4파일 | 표 4행 (NEW 1 + MODIFY 3) ✓ | Step 1(types.ts MODIFY) + Step 2(useControllableState NEW) + Step 3(useGridState MODIFY) + Step 4(index.ts MODIFY) = 4파일 ✓ |
| D4 | C-29: `value: T | undefined` union 명시 (internal helper) | Section 2.3 `value: T | undefined` 명시 ✓ | Section 11.2 Step 2 코드 `value: T | undefined` ✓ |
| D5 | onStateChange 시그니처 확정 | Section 2.1 `onStateChange?: (next: GridStateValues<TData>, key: GridStateKey) => void` ✓ | Section 11.2 Step 3 Before/After onChange 호출 ✓ |
| D6 | mount 후 mode 전환 → dev console.warn | Section 6 EC-03/EC-04 ✓ | Section 11.2 Step 2 `useRef wasControlled` + console.warn ✓ |
| D7 | 번들 +2KB ref-only; 24.64KB baseline; measurement 의무 | Section 8.5 명시 ✓ | Section 12.3 size-limit 측정 게이트 ✓ |

**결론**: 합계(4파일) + 분류(NEW 1 + MODIFY 3) + 파일명 목록 전부 일치 — G-01 v1.0.4 통과.

---

## Acceptance Criteria 최종 확인

| AC | 기준 | 출처 | 충족 근거 |
|----|------|------|---------|
| AC-001 | `UseGridStateOptions<TData>` — `initialState?`, `state?`, `onStateChange?` (C-4 strict) | C-4 | Section 2.1 인터페이스 + no any 전체 |
| AC-002 | controlled 모드 — `state` prop이 있으면 내부 setter가 `onStateChange`만 호출 | L1 | Section 2.3/2.6 + Section 11.2 After 코드 + EC-03 |
| AC-003 | uncontrolled 모드 — `initialState`로 useState init | L1 | Section 2.3 defaultValue + Section 11.2 After 코드 + EC-02 |
| AC-004 | mixed (`state` 일부만 controlled) — 키 단위 분기 | L1 | Section 2.3 `Partial<GridStateValues>` + EC-05 + Section 2.6 mixed 예시 |
| AC-005 | React 19 StrictMode 호환 (double-invoke 안전) | C-12 | Section 5 호환성 + EC-08 + Section 11.2 Step 2 useState 표준 |
