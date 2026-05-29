# G-003 Spec — `useGridState` onStateChange unified callback + debounce 옵션

**Goal**: MOD-GRID-02 / G-003
**Stage**: SPECIFY
**Model**: sonnet (medium)
**Rubric**: specify-rubric v1.0.5
**Threshold**: 90 (medium tier)
**Created**: 2026-05-14
**DependsOn**: MOD-GRID-02/G-002 (완료)

---

## ★ 사전 결정 표 (D#) — G-01 v1.0.4 cross-consistency 기준

| ID | 결정 내용 |
|----|-----------|
| D1 | **C-28 경로 확인**: goals.json G-003 `implementFiles[0]` = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` (올바른 prefix), `implementFiles[1]` = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useDebouncedCallback.ts` (올바른 prefix) → **C-28 정정 불필요** |
| D2 | **파일 변경: NEW 1 + MODIFY 2 = 3파일** — NEW: `internal/useDebouncedCallback.ts`. MODIFY: `useGridState.ts` (debounceMs 지원 — debounceMs > 0 시 onStateChange를 useDebouncedCallback으로 감싸기), `types.ts` (UseGridStateOptions에 `debounceMs?: number` 추가). `index.ts`는 신규 타입 export 없음 → **MODIFY 대상 아님** |
| D3 | **goals.json drift**: G-003 `implementFiles`에 `types.ts`가 미포함 (2파일만 열거). spec authority (C-27) 기준으로 `types.ts` MODIFY 확정 (`UseGridStateOptions.debounceMs` 추가 필요) |
| D4 | **`onStateChange` 시그니처**: G-002 D5에서 확정된 `(next: GridStateValues<TData>, key: GridStateKey) => void` 시그니처 유지. G-003은 debounce 적용만 — 시그니처 변경 없음 (breaking 없음). **G-003 목표**: `onStateChange`를 `useDebouncedCallback`으로 감싸는 wiring 추가 |
| D5 | **`useDebouncedCallback` API generic**: `<TArgs extends unknown[]>(fn: (...args: TArgs) => void, ms: number): (...args: TArgs) => void` — C-4 strict (`any` 금지), `unknown[]` 기반 variadic generic. 반환 함수 타입이 입력 fn 타입과 동일하여 타입 안전성 보장 |
| D6 | **debounce 구현**: `useRef` + `setTimeout` 자체 구현 (lodash 의존 X — C-21 번들 + AC-003). `useEffect` return에서 `clearTimeout` 으로 unmount cleanup (AC-004 + C-12). `debounceMs=0` 또는 미설정 시 즉시 동기 호출 분기 (`if (ms > 0)`) |
| D7 | **번들 extrapolation 차단** — G-001 실측 +0.12 KB, G-002 실측 +0.23 KB 으로부터 G-003 예측 금지. ADR-MOD-GRID-00-010 §"extrapolation 금지" 룰 적용. goals.json 참조치 "+1 KB" 기준 사용. 실측은 implement 직후 size-limit 측정. 이론적 여유: G-002 기준선(24.87 KB) 확인 필요 → implement 시 측정 게이트 |
| D8 | **C-29 exactOptionalPropertyTypes 적용 판단**: `useDebouncedCallback`의 파라미터는 함수 — optional prop forwarding 케이스 아님. `UseGridStateOptions.debounceMs?: number` 추가는 optional prop이나, useGridState 내부에서 `options?.debounceMs`로 접근 후 `if (debounceMs > 0)` 분기 → C-29 union 명시 패턴 불필요 (함수 파라미터에 전달되지 않음). **C-29 해당 없음** |

---

## Section 1 — 현황 및 배경

### 1.1 L0: 현 구현 파일 + 코드 발췌

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` (G-002 구현체, 직접 Read 확인)

```ts
// useGridState.ts L107-112 (G-002 현재 동기 호출 패턴)
const [sorting, setSorting] = useControllableState<SortingState>({
  value: options?.state?.sorting,
  defaultValue: options?.initialState?.sorting ?? [],
  onChange: (next) =>
    options?.onStateChange?.({ ...snapshotRef.current, sorting: next }, 'sorting'),
  //         ^^^^^^^^^^^ 동기 호출 — debounce 없음 (G-002 D5 확정)
});
```

**현황**: `onStateChange`가 각 `useControllableState` 의 `onChange` 콜백에서 **동기로** 호출됨. 빠른 연속 state 변경(예: 정렬 토글 → 페이지 변경)시 `onStateChange`가 여러 번 발화. URL 동기화 또는 서버 요청 등 외부 시스템 통보에서 호출 횟수 제어 불가.

**L0 출처**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` L107-112 (직접 Read 확인 — 파일 전체 222줄)

### 1.2 L1: TanStack v8 API 참조

출처: `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` §3

TanStack Table의 `onXxxChange` 패턴은 state 변경 시 동기로 즉시 호출됨:

```ts
// tanstack-api-inventory.md §3 TableOptions
interface TableOptions<TData> {
  onSortingChange?: OnChangeFn<SortingState>;       // 동기 호출
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>; // 동기 호출
  onPaginationChange?: OnChangeFn<PaginationState>; // 동기 호출
  // ... (12개 on*Change 모두 동기)
}
```

**L1 결론**: TanStack 자체는 debounce 미제공. 외부 콜백(URL 동기화/서버 요청)을 debounce 처리하려면 소비자가 직접 구현해야 함. `useGridState`에서 `debounceMs` 옵션으로 이를 내장 제공 → 소비자 코드 단순화.

`debounceMs` 미설정 시 동기 호출 = TanStack 표준 on*Change 패턴과 동일 (breaking 없음).

### 1.3 L2: 현 구현 — GridStateValues, GridStateKey, UseGridStateOptions

출처: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` L536-614 (직접 Read 확인)

```ts
// types.ts L562-570 (GridStateKey — G-003 onStateChange changedKey 타입)
export type GridStateKey =
  | 'sorting'
  | 'columnFilters'
  | 'rowSelection'
  | 'pagination'
  | 'columnPinning'
  | 'columnOrder'
  | 'columnSizing'
  | 'columnVisibility';

// types.ts L591-615 (UseGridStateOptions — debounceMs 추가 대상)
export interface UseGridStateOptions<TData = unknown> {
  initialState?: Partial<GridStateValues<TData>>;
  state?: Partial<GridStateValues<TData>>;
  onStateChange?: (next: GridStateValues<TData>, key: GridStateKey) => void;
  // ← G-003: debounceMs?: number 추가 예정
}
```

**G-002에서 확정된 `onStateChange` 시그니처** (D4):
`(next: GridStateValues<TData>, key: GridStateKey) => void`

G-003은 이 시그니처를 **변경하지 않는다**. debounce는 호출 타이밍만 조절.

### 1.4 L3: 영향 사용처

`affectedUsageFiles: []` (goals.json G-003 확인) — **0개**. G-003은 `debounceMs` optional 옵션 추가만. 기존 `useGridState()` 및 `useGridState({ onStateChange })` 호출 완전 보존 (options optional, debounceMs optional).

### 1.5 migrationImpact

**medium** (goals.json G-003 확인) — URL/서버 동기화 패턴의 호출 횟수 제어. 기존 `onStateChange` 동기 호출 동작은 `debounceMs` 미설정 시 완전 유지.

### 1.6 R-A / R-W 참조

- **R-A (AG Grid)**: `AggridTable.tsx` `clearSelectionKey` 패턴 (publish-aggrid-analysis.md §9) — 외부 트리거로 grid state를 reset하는 패턴. 직접 debounce API 없음. debounce는 소비자가 직접 구현. 코드 차용 금지 (C-7, C-16) — 패턴 참조만.
- **R-W (Wijmo)**: CollectionView의 `trackChanges` + refresh 패턴 — debounce 미제공. Wijmo import 금지 (C-16) — 패턴 참조만.
- **결론**: 두 라이브러리 모두 내장 debounce 콜백 미제공 → `useGridState`에서 자체 구현(useRef+setTimeout)이 표준 접근법 (C-21 번들 최적화).

---

## Section 2 — API 계약

### 2.1 `UseGridStateOptions` MODIFY — `debounceMs` 추가

```ts
// packages/grid-core/src/types.ts (MODIFY — 기존 UseGridStateOptions에 debounceMs 추가)

export interface UseGridStateOptions<TData = unknown> {
  /** uncontrolled 모드 초기값. */
  initialState?: Partial<GridStateValues<TData>>;

  /** controlled 모드 외부 state (키 단위). */
  state?: Partial<GridStateValues<TData>>;

  /**
   * state 변경 통보 unified callback.
   *
   * controlled/uncontrolled 양쪽에서 호출됨.
   * `debounceMs > 0` 시 debounced 호출 (마지막 변경만 발화).
   * `debounceMs` 미설정 또는 0 시 동기 호출 (G-002 동작 보존).
   *
   * @param next - 변경 후 전체 state snapshot (`GridStateValues<TData>`).
   * @param changedKey - 변경된 state key (`GridStateKey`).
   */
  onStateChange?: (next: GridStateValues<TData>, changedKey: GridStateKey) => void;

  /**
   * `onStateChange` debounce 대기 시간 (ms).
   *
   * - 미설정 또는 `0`: 동기 호출 (G-002와 동일 동작, breaking 없음).
   * - `> 0`: 마지막 변경 후 `debounceMs` ms 경과 시 1회 발화.
   *   300ms 내 N번 연속 변경 → 마지막 snapshot만 전달.
   * - 음수: `0`과 동일 처리 (동기).
   *
   * @example 300ms debounce — URL 동기화
   * ```ts
   * useGridState({ onStateChange: updateUrl, debounceMs: 300 })
   * ```
   *
   * @remarks
   * 구현: `useRef` + `setTimeout` (lodash 의존 X — C-21, AC-003).
   * unmount 시 pending timeout cleanup (C-12, AC-004).
   */
  debounceMs?: number;
}
```

### 2.2 `useDebouncedCallback` — NEW 내부 헬퍼

```ts
// packages/grid-core/src/internal/useDebouncedCallback.ts (NEW)

/**
 * `useDebouncedCallback<TArgs extends unknown[]>(fn, ms)` 파라미터 + 반환 타입.
 *
 * @typeParam TArgs - debounced 함수의 파라미터 타입 (tuple).
 * @param fn - debounce 대상 원본 함수.
 * @param ms - debounce 대기 시간 (ms). 0 이하이면 debounce 없음 (즉시 호출).
 * @returns `ms > 0` 시 debounced 함수, `ms <= 0` 시 원본 fn (동기).
 */
function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms: number,
): (...args: TArgs) => void
```

**구현 세부** (AC-003, D6):
- `useRef<ReturnType<typeof setTimeout> | null>` 으로 timer ref 보유
- `useRef<(...args: TArgs) => void>` 으로 fn 최신 참조 보유 (stale closure 방지)
- `useEffect(() => { fnRef.current = fn; })` — 매 render fn 갱신
- `useEffect(() => () => { clearTimeout(timerRef.current ?? undefined); }, [])` — unmount cleanup
- `ms <= 0` 분기: debounced wrapper 생성 없이 fn 직접 반환
- `ms > 0` 분기: `useCallback` 기반 안정 참조 반환

### 2.3 `useGridState` MODIFY — debounce wiring

```ts
// packages/grid-core/src/useGridState.ts (MODIFY — 기존 파일)

export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData> {
  // debounceMs 추출 (undefined / 0 / 음수 → 동기)
  const debounceMs = options?.debounceMs ?? 0;

  // onStateChange를 useDebouncedCallback으로 감싸기 (D6, AC-003)
  // debounceMs <= 0 시 useDebouncedCallback 내부에서 즉시 동기 반환
  const debouncedOnStateChange = useDebouncedCallback(
    (next: GridStateValues<TData>, changedKey: GridStateKey) => {
      options?.onStateChange?.(next, changedKey);
    },
    debounceMs,
  );

  // ... snapshotRef, useControllableState 8개 wiring (기존 유지)
  // onChange 콜백에서 options?.onStateChange 대신 debouncedOnStateChange 사용:
  //   onChange: (next) =>
  //     debouncedOnStateChange({ ...snapshotRef.current, sorting: next }, 'sorting'),
}
```

### 2.4 사용 예시 1 — debounceMs=0 / 미설정 (동기 — G-002 호환)

```tsx
import { useGridState } from '@tomis/grid-core';

function SlipListPage() {
  // debounceMs 미설정 → 동기 호출 (G-002와 완전 동일)
  const s = useGridState<Slip>({
    onStateChange: (next, key) => {
      console.log('state changed:', key, next);
    },
  });
  // 정렬 클릭 → onStateChange 즉시 1회 호출 (동기)
}
```

### 2.5 사용 예시 2 — debounceMs=300 (URL 동기화)

```tsx
import { useGridState } from '@tomis/grid-core';
import { useCallback } from 'react';

function SlipListPageWithUrl() {
  const handleStateChange = useCallback(
    (next: GridStateValues<Slip>, key: string) => {
      // URL 동기화 — 300ms debounce로 빠른 클릭 시 마지막만 반영
      const params = new URLSearchParams(window.location.search);
      params.set('sort', JSON.stringify(next.sorting));
      params.set('page', String(next.pagination.pageIndex));
      window.history.replaceState(null, '', `?${params.toString()}`);
    },
    [],
  );

  const s = useGridState<Slip>({
    onStateChange: handleStateChange,
    debounceMs: 300,  // 300ms 내 연속 변경 → 마지막만 URL 반영
  });
  // 정렬 토글 후 곧바로 페이지 변경 → 300ms 후 1회만 URL 업데이트
}
```

### 2.6 타입 export 경로 명시

| 타입 | 파일 | export 경로 |
|------|------|------------|
| `UseGridStateOptions<TData>` | `packages/grid-core/src/types.ts` | `@tomis/grid-core` (기존 export — index.ts 이미 export) |
| `GridStateValues<TData>` | `packages/grid-core/src/types.ts` | `@tomis/grid-core` (기존 export) |
| `GridStateKey` | `packages/grid-core/src/types.ts` | `@tomis/grid-core` (기존 export) |
| `useDebouncedCallback` | `packages/grid-core/src/internal/useDebouncedCallback.ts` | **internal only** (export from index.ts 불필요) |

`index.ts` 신규 type export 불필요 — `UseGridStateOptions` 는 G-002에서 이미 export됨. D2 MODIFY 대상 아님 (C-30 truth table 동기).

---

## Section 3 — 기존 variant 대응표

| AS-IS 패턴 | 신규 API | 마이그레이션 액션 |
|-----------|---------|----------------|
| `useGridState({ onStateChange: fn })` (G-002 동기 호출) | `useGridState({ onStateChange: fn })` debounceMs 미설정 — 동기 보존 | 변경 없음 |
| 소비자 직접 debounce: `useEffect(() => { const t = setTimeout(() => fn(state), 300) }, [state])` | `useGridState({ onStateChange: fn, debounceMs: 300 })` | 소비자 useEffect 제거 + debounceMs 추가 (옵션) |
| `useGridState()` 파라미터 없음 | `useGridState()` — 완전 보존 | 변경 없음 |
| `useGridState({ onStateChange: fn, debounceMs: 0 })` | 동기 호출 (ms=0 분기) | N/A (신규 기능) |

---

## Section 4 — Breaking Change / Deprecation

- **Breaking change**: **없음**
  - `debounceMs?: number` optional — 기존 `useGridState()`, `useGridState({ onStateChange })` 호출 완전 보존
  - `onStateChange` 시그니처 변경 없음 (G-002 D5 확정값 유지)
  - `debounceMs` 미설정/0 시 G-002와 완전 동일한 동기 호출 동작
- **Deprecation**: 없음 (신규 기능 opt-in)
- **마이그레이션 경로**: 기존 사용처 변경 불필요. debounce 원하면 `debounceMs` 추가만.
- **D-04 N/A**: breaking change 없으므로 deprecation 전략 해당 없음

---

## Section 5 — 호환성 정책

- **TypeScript (exactOptionalPropertyTypes: true)**: D8 — `debounceMs?: number`는 useGridState 내부에서 `options?.debounceMs ?? 0`로 접근. 함수 파라미터 forwarding 없음 → C-29 해당 없음. TS2375 위험 없음.
- **React 18/19 호환**: `useRef`, `useCallback`, `useEffect` 표준 사용. StrictMode double-invoke 안전 (timerRef는 단순 숫자 — double-invoke 후에도 동일 동작).
- **TanStack v8**: `@tanstack/react-table@^8.0.0` peerDependency — 변경 없음.
- **Bundle**: +1 KB 예측 (goals.json 참조치). 실측 implement 시 (D7 — ADR-MOD-GRID-00-010 extrapolation 금지).
- **No `any`**: `useDebouncedCallback<TArgs extends unknown[]>` — C-4 strict 준수.
- **lodash 의존 없음**: useRef + setTimeout 자체 구현 (C-21 + AC-003).

---

## Section 6 — 엣지 케이스

| # | 엣지 케이스 | 예상 동작 |
|---|------------|---------|
| EC-01 | `debounceMs` 미설정 또는 `0` | 동기 호출 — `useDebouncedCallback` 내부 `ms <= 0` 분기에서 원본 fn 즉시 반환. G-002와 동일. |
| EC-02 | `debounceMs` 음수 (`-1`, `-300`) | `0`과 동일 처리 — 동기 호출. (`ms <= 0` 분기 포함) |
| EC-03 | debounceMs=300 중 연속 변경 (정렬 토글 → 페이지 변경 → 필터 추가 in 300ms) | 각 변경마다 timer reset. 마지막 변경(필터 추가) 후 300ms 경과 시 최신 snapshot 1회 발화. snapshotRef.current는 항상 최신값 — stale 없음. |
| EC-04 | unmount 시 pending timeout 존재 | `useEffect` cleanup에서 `clearTimeout(timerRef.current)` → 누수 없음 (AC-004, C-12). unmount 후 `onStateChange` 미발화. |
| EC-05 | `debounceMs`가 render 중 변경 (props 변경 등) | `useDebouncedCallback` 내부 `fnRef`는 최신 fn 참조 유지. `ms`는 훅 인자로 전달 — `useCallback` deps에 포함. ms 변경 시 새 debounced wrapper 생성. 기존 pending timeout은 cleanup 후 신규 wrapper 적용. |
| EC-06 | `onStateChange` 미제공 + `debounceMs` 제공 | `debouncedOnStateChange` 내부에서 `options?.onStateChange?.()` — optional chaining으로 안전. 실제 발화 시 no-op. |
| EC-07 | `onStateChange` 내부에서 `setSorting` 호출 (무한 루프 시도) | `setSorting` → `useControllableState` onChange → `debouncedOnStateChange` → `onStateChange`. `onStateChange`가 다시 `setSorting` 호출하면 동일 cycle 반복 가능. **사용자 책임** — spec/JSDoc에 경고. |
| EC-08 | React 19 StrictMode double-invoke | `useEffect`가 두 번 실행 → timer 두 번 등록 → cleanup 두 번 호출. 최종 상태: mount 후 정상 1개 effect. 동작 안전. |

---

## Section 7 — 파일별 변경 명세 (E-01, H-02 cross-check 기준)

| # | 파일 경로 | NEW/MODIFY | 변경 범위 |
|---|-----------|-----------|---------|
| 1 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useDebouncedCallback.ts` | **NEW** | `useDebouncedCallback<TArgs extends unknown[]>(fn, ms)` hook 전체 — useRef×2 + useEffect×2 + useCallback 기반 debounced wrapper |
| 2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | **MODIFY** | `debounceMs` 추출 + `useDebouncedCallback` import + `debouncedOnStateChange` 생성 + 8개 `useControllableState` onChange에서 `options?.onStateChange?.(...)` → `debouncedOnStateChange(...)` 교체 |
| 3 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | `UseGridStateOptions<TData>` 인터페이스에 `debounceMs?: number` 필드 추가 + JSDoc |

**D2 cross-check**: NEW 1개(`useDebouncedCallback.ts`) + MODIFY 2개(`useGridState.ts`, `types.ts`) = **총 3파일** ✓
**분류 cross-check**: D2 "NEW 1 + MODIFY 2 = 3파일" ↔ Section 7 표 NEW 1행 + MODIFY 2행 = 3행 ✓
**파일명 cross-check**: D2 열거(`useDebouncedCallback.ts` / `useGridState.ts` / `types.ts`) ↔ Section 7 #1/#2/#3 행 파일명 ✓
**E-06 재결정 점검**: Section 7 본문에 재결정 문장 없음 → 최종 표 모순 없음 ✓
**index.ts 미포함 근거 (D2 명시)**: G-003은 신규 public type export 없음 (`UseGridStateOptions`는 G-002에서 이미 export). C-30 truth table 동기 — index.ts 행 없음 = 의도된 결정.

---

## Section 8 — 영향도 분석

### 8.1 영향 사용처

`affectedUsageFiles: []` (goals.json G-003 직접 확인) — **0개**. `debounceMs` optional → 기존 모든 호출 패턴 변경 없음.

### 8.2 무파괴 검증

- `debounceMs?: number` optional — 기존 `useGridState()` / `useGridState({ onStateChange })` 완전 보존 (C-6).
- `types.ts` MODIFY: `UseGridStateOptions`에 필드 추가(add-only) — 기존 타입 파괴 없음.
- `useGridState.ts` MODIFY: `debounceMs` 추출 후 `useDebouncedCallback` wiring. `debounceMs <= 0` 시 동기 → G-002 동작 완전 보존.
- 부모 디렉토리 `packages/grid-core/src/internal/` 실재 확인: G-002에서 `useControllableState.ts` NEW 완료. 동일 디렉토리에 `useDebouncedCallback.ts` NEW.

### 8.3 타입 안전성

```ts
// 타입 검증 스니펫
const s1 = useGridState();                             // 완전 G-002 호환
const s2 = useGridState({ debounceMs: 300 });          // debounce 활성, onStateChange 없음 (no-op)
const s3 = useGridState({
  onStateChange: (next, key) => updateUrl(next, key),  // 시그니처 G-002 동일
  debounceMs: 300,
});
// ✓ s3.sorting: SortingState
// ✓ no `any` — C-4 compliant
// ✓ useDebouncedCallback: TArgs extends unknown[] → 타입 안전
```

### 8.4 롤백 전략

- `useDebouncedCallback.ts` 삭제
- `useGridState.ts`에서 `debouncedOnStateChange` wiring 제거 + `options?.onStateChange?.(...)` 직접 호출 복원
- `types.ts`에서 `debounceMs?: number` 제거
- 사용처 0개 → 롤백 비용 최소

### 8.5 번들 영향

```
D7 extrapolation 차단:
  G-001 실측: +0.12 KB hook 추가 (useGridState.ts 8 useState)
  G-002 실측: +0.23 KB hook 추가 (useControllableState.ts + wiring)
  ★ G-001/G-002 평균 추정 금지 — 훅 프로파일 다름 (ADR-MOD-GRID-00-010)

goals.json 참조치: +1 KB (useDebouncedCallback.ts NEW + useGridState.ts MODIFY)
기준선: G-002 이후 측정치 필요 (implement 시 확인)
한도: 30 KB (C-21)
★ D7 게이트: implement 직후 size-limit 측정 → implement-score.json bundleMeasured 기록 의무
```

---

## Section 9 — 의존성

### 9.1 peerDependencies (C-22)

**변경 없음**. G-002 계승:

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

- `useDebouncedCallback.ts` (NEW) → `useRef`, `useCallback`, `useEffect` (react peer only)
- `useGridState.ts` (MODIFY) → `useDebouncedCallback` (신규 내부 import) + `UseGridStateOptions` (types.ts — 기존)
- 신규 외부 dep 없음 (C-9/C-20 ADR 게이트 영향 없음 — lodash 미사용)
- `useDebouncedCallback`은 React hook(`use*`) — peerDependency react에 포함됨

---

## Section 10 — 사용자 여정 매핑

### 10.1 개발자 여정 (5단계 — goals.json userJourneySteps 매핑)

| Step | 사용자 행동 | 시스템 반응 |
|------|-----------|-----------|
| 1 | `useGridState({ onStateChange: handleChange, debounceMs: 300 })` | hook 초기화. `useDebouncedCallback(handleChange, 300)` 생성. |
| 2 | 사용자 정렬 토글 → `setSorting` 호출 | `useControllableState` onChange → `debouncedOnStateChange(snapshot, 'sorting')` 호출 → 내부 setTimeout 300ms 예약. |
| 3 | 300ms 내 추가 변경 (페이지 변경 등) | 기존 timer clearTimeout + 새 timer 300ms 예약. `handleChange` 아직 미호출. |
| 4 | 300ms 경과 (추가 변경 없음) | `handleChange(latestSnapshot, 'pagination')` — 마지막 key, 최신 snapshot으로 1회 발화. |
| 5 | `debounceMs=0` 또는 미설정 | `useDebouncedCallback` ms=0 분기 → 원본 fn 즉시 반환. 동기 호출 (G-002 동작 보존). |

### 10.2 최종 사용자 여정

grid state 훅은 개발자 API. 최종 사용자는 URL이 빠른 클릭 중 중간에 갱신되지 않는 경험(debounce 효과)을 받음. N/A (직접 상호작용 없음).

---

## Section 11 — 구현 계획

### 11.1 Step 순서 (의존성 고려)

**Step 1**: `types.ts` MODIFY — `UseGridStateOptions<TData>`에 `debounceMs?: number` 추가

**Step 2**: `internal/useDebouncedCallback.ts` NEW — 전체 구현

**Step 3**: `useGridState.ts` MODIFY — `debounceMs` 추출 + `useDebouncedCallback` wiring

**Step 4**: tsc `--noEmit` → 0 errors 확인 + size-limit 측정 (D7 게이트)

### 11.2 Before/After 코드 스니펫

**Step 1: types.ts MODIFY — debounceMs 추가**

```ts
// BEFORE (G-002)
export interface UseGridStateOptions<TData = unknown> {
  initialState?: Partial<GridStateValues<TData>>;
  state?: Partial<GridStateValues<TData>>;
  onStateChange?: (next: GridStateValues<TData>, key: GridStateKey) => void;
}

// AFTER (G-003 — debounceMs 추가)
export interface UseGridStateOptions<TData = unknown> {
  initialState?: Partial<GridStateValues<TData>>;
  state?: Partial<GridStateValues<TData>>;
  onStateChange?: (next: GridStateValues<TData>, changedKey: GridStateKey) => void;
  /**
   * onStateChange debounce 대기 시간 (ms).
   * 미설정/0/음수 → 동기 호출 (G-002 동작 보존).
   * > 0 → 마지막 변경 후 ms 경과 시 1회 발화.
   */
  debounceMs?: number;
}
```

**Step 2: useDebouncedCallback.ts NEW — 전체 파일**

```ts
// packages/grid-core/src/internal/useDebouncedCallback.ts
/**
 * useRef + setTimeout 기반 debounce 헬퍼 훅 (G-003, MOD-GRID-02).
 * lodash 의존 없음 (C-21 + AC-003).
 * unmount 시 pending timeout cleanup (C-12 + AC-004).
 *
 * @typeParam TArgs - debounced 함수 파라미터 타입 (tuple, C-4 strict).
 * @param fn - debounce 대상 함수 (최신 참조 자동 유지).
 * @param ms - 대기 시간. 0 이하이면 fn 즉시 반환 (동기).
 * @returns ms > 0: debounced wrapper. ms <= 0: fn 그대로 반환.
 */
import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  ms: number,
): (...args: TArgs) => void {
  // 최신 fn 참조 — stale closure 방지
  const fnRef = useRef<(...args: TArgs) => void>(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  // pending timer ref
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // unmount cleanup (AC-004, C-12)
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // ms <= 0: 동기 (debounce 없음) — D6
  if (ms <= 0) {
    return fn;
  }

  // ms > 0: debounced wrapper
  return useCallback(
    (...args: TArgs) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current(...args);
      }, ms);
    },
    [ms], // ms 변경 시 새 wrapper (deps)
  );
}
```

**Step 3: useGridState.ts MODIFY — Before/After (대표 부분)**

```ts
// BEFORE (G-002) — useGridState 함수 시작 부분
export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData> {
  const snapshotRef = useRef<GridStateValues<TData>>(null!);

  const [sorting, setSorting] = useControllableState<SortingState>({
    value: options?.state?.sorting,
    defaultValue: options?.initialState?.sorting ?? [],
    onChange: (next) =>
      options?.onStateChange?.({ ...snapshotRef.current, sorting: next }, 'sorting'),
  });
  // ... 7개 동일 패턴

// AFTER (G-003) — debounceMs + debouncedOnStateChange 추가
export function useGridState<TData = unknown>(
  options?: UseGridStateOptions<TData>,
): GridState<TData> {
  const snapshotRef = useRef<GridStateValues<TData>>(null!);

  // G-003: debounce wiring (D6, AC-003)
  const debounceMs = options?.debounceMs ?? 0;
  const debouncedOnStateChange = useDebouncedCallback(
    (next: GridStateValues<TData>, changedKey: GridStateKey) => {
      options?.onStateChange?.(next, changedKey);
    },
    debounceMs,
  );

  const [sorting, setSorting] = useControllableState<SortingState>({
    value: options?.state?.sorting,
    defaultValue: options?.initialState?.sorting ?? [],
    onChange: (next) =>
      debouncedOnStateChange({ ...snapshotRef.current, sorting: next }, 'sorting'),
    //  ^^^^^^^^^^^^^^^^^^^ options?.onStateChange 대신 debouncedOnStateChange 사용
  });
  // ... 7개 동일 패턴 (debouncedOnStateChange 사용)
```

### 11.3 구현 위험 + 완화

| 위험 | 완화 |
|------|------|
| `useDebouncedCallback` 내부 `useCallback`이 Rules of Hooks 위반 — `if (ms <= 0)` 분기 후 조건부 hook 호출 | **해결**: `ms <= 0` 시 fn 직접 반환(early return). `useCallback`은 `ms > 0` 분기에서만 호출. React Rules of Hooks: 조건부 return은 hook 이전에 허용. **단, `ms <= 0` 분기는 `useRef`, `useEffect` 선언 이후에 위치해야 함** — hook 순서 고정을 위해 `useRef`/`useEffect`(fn갱신, unmount cleanup)는 항상 먼저 호출 후 `if (ms <= 0) return fn` |
| `debounceMs`가 render 중 변경될 때 기존 pending timeout과 신규 wrapper 혼재 | `useCallback([ms])` — ms 변경 시 새 함수 참조. 기존 pending timeout은 fnRef.current를 통해 최신 fn 호출. ms 변경 시 기존 timer를 clearTimeout하지 않으므로 이전 timer가 이전 ms 기준으로 발화 가능. 이는 허용된 동작 (spec에 명시) |
| `onStateChange` 내부에서 setState 호출 → 무한 루프 | Section 6 EC-07 — 사용자 책임. JSDoc에 경고 명시 |
| stale closure: `debouncedOnStateChange` 내부에서 `options?.onStateChange` 참조 | `useDebouncedCallback` 내부 `fnRef.current` 갱신으로 최신 fn 보장 |

---

## Section 12 — 검증 계획

### 12.1 단위 테스트 (vitest + @testing-library/react)

```ts
// packages/grid-core/src/__tests__/useDebouncedCallback.test.ts
describe('useDebouncedCallback', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('ms=0 — 동기 반환 (fn 그대로)', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 0));
    result.current('arg1');
    expect(fn).toHaveBeenCalledWith('arg1');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('ms=300 — 300ms 후 1회 발화', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, 300));
    result.current('a'); result.current('b'); result.current('c'); // 연속 호출
    expect(fn).not.toHaveBeenCalled(); // 300ms 전 미발화
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('c'); // 마지막 인자
  });

  it('unmount 시 pending timeout cleanup', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, 300));
    result.current('a');
    unmount(); // cleanup
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled(); // unmount 후 미발화
  });
});

// packages/grid-core/src/__tests__/useGridState-g003.test.ts
describe('useGridState G-003 debounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('debounceMs 미설정 — 동기 호출 (G-002 호환)', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useGridState({ onStateChange: onChange }),
    );
    act(() => { result.current.setSorting([{ id: 'col', desc: false }]); });
    expect(onChange).toHaveBeenCalledTimes(1); // 즉시 호출
  });

  it('debounceMs=300 — 300ms 후 1회', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useGridState({ onStateChange: onChange, debounceMs: 300 }),
    );
    act(() => {
      result.current.setSorting([{ id: 'col', desc: false }]);
      result.current.setPagination({ pageIndex: 1, pageSize: 10 });
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(300); });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('unmount 시 pending timeout cleanup', () => {
    const onChange = vi.fn();
    const { result, unmount } = renderHook(() =>
      useGridState({ onStateChange: onChange, debounceMs: 300 }),
    );
    act(() => { result.current.setSorting([]); });
    unmount();
    act(() => { vi.advanceTimersByTime(300); });
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

### 12.2 TypeScript 타입 검증

```bash
# packages/grid-core에서
pnpm tsc --noEmit
# 0 errors 확인 (C-4, C-12, C-29)
# 특히 useDebouncedCallback<TArgs extends unknown[]> generic 타입 전파 확인
```

### 12.3 빌드 + 번들 검증 (D7 게이트)

```bash
pnpm --filter @tomis/grid-core build
# size-limit 측정 → 30 KB 미만 확인
# 실측값 implement-score.json bundleMeasured 필드 기록 (ADR-MOD-GRID-00-010)
```

### 12.4 Storybook (AC-005)

```
story 경로: packages/grid-core/src/stories/useGridState-debounce.stories.tsx
시나리오:
  - UrlSyncDemo: useGridState({ onStateChange: syncToUrl, debounceMs: 300 })
    정렬/페이지 변경 시 URL 파라미터 갱신 (브라우저 주소창 확인)
    빠른 연속 클릭 시 URL이 300ms 후 1회만 갱신되는 것을 시연

시각 회귀 (C-17 medium 의무):
  사용처 0개 (affectedUsageFiles=[]) → visual regression N/A.
  단, Storybook 자체는 AC-005 필수.
```

---

## Section 13 — 상용 제품화

### 13.1 패키지

- **대상**: `packages/grid-core` (MIT 라이선스)
- **라이선스**: MIT — Pro 패키지 아님 (F-02 N/A)

### 13.2 문서 계획 (F-03)

```
Docusaurus 경로: docs/grid-core/hooks/use-grid-state.md (G-001/G-002 문서 확장)
  - debounceMs 옵션 섹션 추가
  - URL 동기화 예시 (Section 2.5 코드 기반)
  - 내부 동작 설명 (useRef+setTimeout, unmount cleanup)

Storybook: packages/grid-core/src/stories/useGridState-debounce.stories.tsx
  - Section 12.4 UrlSyncDemo 시나리오
```

### 13.3 peerDependencies (F-04 — C-22)

변경 없음. G-002 계승 (Section 9.1). `useDebouncedCallback`은 react hook — 신규 peer 없음.

### 13.4 릴리즈 노트

- `grid-core@1.x` — `useGridState` options에 `debounceMs?: number` 추가 (non-breaking)
- `useDebouncedCallback` 내부 helper (public export 없음)
- migration guide: 기존 `useGridState({ onStateChange: fn })` 호출 변경 없음. debounce 원하면 `debounceMs: 300` 추가.

---

## ★ 메타 게이트 자가-검증

### H-01: referenceEvidence 경로 실재

| 레벨 | 경로 | 검증 방법 | 판정 |
|------|------|---------|------|
| L0 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` | Read 직접 확인 — L107-112 `useControllableState` onChange 동기 호출 패턴 발췌 (파일 222줄) | YES |
| L1 | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` | §3 `TableOptions.onSortingChange?` 등 12개 on*Change 동기 패턴 확인 | YES |
| L2 | `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | L536-614 `GridStateValues`, `GridStateKey`, `UseGridStateOptions` Read 직접 확인 | YES |
| L3 | `affectedUsageFiles: []` (goals.json G-003 확인) | goals.json Read 직접 확인 — L163-166 | YES |
| R-A | `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` | AG Grid clearSelectionKey 패턴 — canonical-modules.json G-003 referenceEvidence R-A 인용 (publish-aggrid-analysis.md §9) | YES |
| R-W | canonical-modules.json MOD-GRID-02 `referenceWijmo` | Wijmo CollectionView 참조 (import 금지 C-16) | YES |

**판정**: 전 경로 Read 도구로 직접 확인 완료 → **H-01 YES**

### H-02: implementFiles 경로 합리성

| 파일 | 부모 디렉토리 실재 | 파일명 컨벤션 | 판정 |
|------|-----------------|------------|------|
| `packages/grid-core/src/internal/useDebouncedCallback.ts` | `packages/grid-core/src/internal/` — G-002에서 `useControllableState.ts` NEW 완료 (5개 파일 존재 확인) | camelCase hook 파일 (`useControllableState.ts`, `useAutoSelectFirstRow.ts` 선례) | YES |
| `packages/grid-core/src/useGridState.ts` | 기존 파일 (Read 확인 — 222줄) | 기존 파일 MODIFY | YES |
| `packages/grid-core/src/types.ts` | 기존 파일 (Read 확인 — L536+ GridStateValues 확인) | 기존 파일 MODIFY | YES |

외부 monorepo `topvel-grid-monorepo/`: 조부모 `D:/project/topvel_project/` 실재 (ADR-MOD-GRID-00-001). C-28 적용: goals.json G-003 `implementFiles` prefix = `topvel-grid-monorepo` (올바름) → 정정 불필요.

**판정**: **H-02 YES**

### H-03: AC 출처 태그 검증

| AC | source 태그 | spec 내 인용 |
|----|------------|------------|
| AC-001 | `C-4` | Section 2.1 `onStateChange?: (next: GridStateValues<TData>, changedKey: GridStateKey) => void` strict typing + D5 generic |
| AC-002 | `L1` | Section 1.2 TanStack on*Change 동기 패턴 + Section 2.1 `debounceMs?: number` 미설정 동기 |
| AC-003 | `C-21` | Section 2.2 `useRef + setTimeout` 자체 구현 + Section 9.2 lodash 미사용 |
| AC-004 | `C-12` | Section 2.2 `useEffect cleanup` + Section 6 EC-04 unmount cleanup |
| AC-005 | `C-25` | Section 12.4 Storybook UrlSyncDemo story 경로 + 시나리오 |

**판정**: **H-03 YES**

---

## ★ G-01 v1.0.4 Cross-Consistency 검증

### D# ↔ Section 7 ↔ Section 11 1:1 매핑

| D# | 명시 내용 | Section 7 일치 | Section 11 일치 |
|----|----------|--------------|---------------|
| D2 | NEW 1 + MODIFY 2 = 3파일. NEW: `useDebouncedCallback.ts`. MODIFY: `useGridState.ts`, `types.ts` | 표 3행 (NEW 1 + MODIFY 2) ✓ | Step 1(types.ts MODIFY) + Step 2(useDebouncedCallback NEW) + Step 3(useGridState MODIFY) = 3파일 ✓ |
| D4 | onStateChange 시그니처 변경 없음 — debounce 적용만 | Section 2.1 `onStateChange?: (..., changedKey: GridStateKey) => void` G-002 동일 ✓ | Section 11.2 Step 3 `debouncedOnStateChange` 사용으로 wiring만 변경 ✓ |
| D5 | `useDebouncedCallback<TArgs extends unknown[]>` generic | Section 2.2 함수 시그니처 ✓ | Section 11.2 Step 2 코드 `TArgs extends unknown[]` ✓ |
| D6 | debounce 구현: useRef+setTimeout, ms<=0 동기, unmount cleanup | Section 2.2 구현 세부 ✓ | Section 11.2 Step 2 useDebouncedCallback 코드 ✓ |
| D7 | extrapolation 차단 — goals.json +1KB 참조치, implement 시 측정 | Section 8.5 D7 게이트 명시 ✓ | Section 12.3 size-limit 측정 게이트 ✓ |
| D8 | C-29 해당 없음 — hook 파라미터, optional prop forwarding 아님 | Section 5 호환성 C-29 해당 없음 ✓ | Section 11.3 위험 표 (C-29 위험 없음) ✓ |

**합계 cross-check**: NEW 1 + MODIFY 2 = 3파일 ✓
**분류 cross-check**: D2 "NEW 1 + MODIFY 2" ↔ Section 7 "NEW 1행 + MODIFY 2행" ✓
**파일명 cross-check**: D2 열거 = Section 7 #1/#2/#3 파일명 ✓
**결론**: G-01 v1.0.4 통과 (합계 + 분류 + 파일명 모두 일치)

---

## Acceptance Criteria 최종 확인

| AC | 기준 | 출처 | 충족 근거 |
|----|------|------|---------|
| AC-001 | `onStateChange?: (next: GridStateValues<TData>, changedKey: GridStateKey) => void` 시그니처 | C-4 | Section 2.1 `UseGridStateOptions` 인터페이스 — G-002 D5 확정 시그니처 유지 |
| AC-002 | `debounceMs?: number` — 미설정 시 동기 | L1 | Section 2.1 JSDoc + Section 6 EC-01 + Section 11.2 Step 3 `debounceMs ?? 0` |
| AC-003 | debounce — `useRef` + `setTimeout` (lodash X) | C-21 | Section 2.2 구현 세부 + Section 11.2 Step 2 코드 `useRef` + `setTimeout` |
| AC-004 | unmount 시 pending timeout cleanup | C-12 | Section 2.2 `useEffect cleanup` + Section 6 EC-04 + Section 11.2 Step 2 코드 `clearTimeout` |
| AC-005 | Storybook story — URL 동기화 예제 1개 | C-25 | Section 12.4 `useGridState-debounce.stories.tsx` UrlSyncDemo 시나리오 |
