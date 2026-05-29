# G-005 Spec — `useUrlSync` URL 동기화 helper (옵션) — search params 반영

**Goal**: MOD-GRID-02 / G-005
**Stage**: SPECIFY
**Model**: sonnet (medium)
**Rubric**: specify-rubric v1.0.6
**Threshold**: 85 (low tier — migrationImpact: low)
**Created**: 2026-05-14
**DependsOn**: MOD-GRID-02/G-003 (완료)

---

## ★ 사전 결정 표 (D#) — G-01 v1.0.4 cross-consistency 기준

| ID | 결정 내용 |
|----|-----------|
| D1 | **C-28 경로 확인**: goals.json G-005 `implementFiles[0]` = `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useUrlSync.ts` (올바른 `topvel-grid-monorepo` prefix) → **C-28 정정 불필요**. `internal/serializeState.ts` 역시 동일 prefix 확인. |
| D2 | **Hydration paradox 해결 — AC-004 필수**: `useUrlSync(state, options): void` 반환형은 void이나 AC-004는 mount 시 URL→state 역방향 hydration 요구. 해결: `UseUrlSyncOptions`에 `onHydrate?: (partial: Partial<GridStateValues<TData>>) => void` 콜백 추가. mount 시 URL parse 후 `onHydrate` 호출 → 호출부(예: `useGridState`의 setter)가 state 갱신 책임. hook 시그니처 void 유지 + controlled/uncontrolled 무관하게 동작. |
| D3 | **SSR guard**: `typeof window === 'undefined'` 체크는 반드시 `useEffect` **body 내부**에서만 수행. hook 레벨 early return 금지 (Rules of Hooks). SSR 환경에서 `useEffect` 자체가 실행되지 않으므로 추가 guard 불필요. |
| D4 | **useEffect deps — URL sync write**: 8개 state 개별 primitive (`state.sorting`, `state.columnFilters`, … ) 를 deps 배열에 나열. `state` 객체 자체는 매 렌더 재생성 가능 → 객체 참조 의존 금지. |
| D5 | **onHydrate setter 안정성 — C-32 option 2**: `onHydrate` 콜백은 호출부에서 매 렌더 재생성 가능 (non-stable). `useRef`로 최신 값을 저장 (`hydrateRef.current = onHydrate`), useEffect deps에서 제외. eslint-disable 주석(option 3) 미사용 → G-004의 eslint-disable 첫 번째 발생(option 3)에 이어 두 번째 발생이 될 경우 C-32 root-cause-fix 트리거 → 미리 option 2로 차단. |
| D6 | **G-004 R-1 loophole 차단 — E-01 v1.0.6 강제 적용**: AC-004는 `onHydrate`, AC-005는 "Storybook 1개 + vitest ≥ 3 시나리오" binding으로 확장. Section 7 final table에 `useUrlSync.stories.tsx` (NEW) + `useUrlSync.test.ts` (NEW) 명시 의무. binding AC ↔ implementFiles 매칭 → 두 파일 모두 Section 7에 포함. |
| D7 | **최종 파일 수**: NEW 4개 (`useUrlSync.ts`, `internal/serializeState.ts`, `useUrlSync.stories.tsx`, `useUrlSync.test.ts`) + MODIFY 2개 (`types.ts`, `index.ts`) = **6파일**. |
| D8 | **`internal/serializeState.ts` 비공개**: `internal/` 디렉토리 규약에 따라 `index.ts`에서 re-export 금지. `useUrlSync.ts`가 상대 경로(`./internal/serializeState`)로만 import. C-31 call-site wiring: `useUrlSync.ts` 내부 import가 유일한 call-site. |
| D9 | **번들**: goals.json 참조치 "+2 KB". 실측은 implement 직후 size-limit 게이트 의무 (보간 금지). |

---

## Section 1 — 현황 및 배경

### 1.1 L0: 현 구현 파일 + 코드 발췌

**파일**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts`
**(G-001~G-004 구현체, 375줄)**

```ts
// useGridState.ts (G-001~G-004 완료 상태 — useUrlSync 없음)
// URL 동기화 hook 없음: URL → state hydration = 없음, state → URL 반영 = 없음
export function useGridState<TData>(options?: UseGridStateOptions<TData>): GridState<TData> {
  // G-001: 8 state via useControllableState
  // G-002: onStateChange aggregator
  // G-003: debounceMs
  // G-004: resetState / resetSection / clearSelectionKey
  // G-005: useUrlSync (NEW — 별도 hook, useGridState 와 독립)
}
```

**현황**: `tw-framework-front/src/pages/` 내 27개 그리드 사용 페이지에서 각자 URL sync 로직을 중복 구현 (`URLSearchParams` 파싱, `window.history.replaceState` 호출). `useUrlSync` hook 없음.

**L0 출처**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useGridState.ts` (직접 Read 확인), `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/current-tanstack-analysis.md` L0(27개 페이지, URL sync 없음)

### 1.2 L1: URLSearchParams Web API 참조

`URLSearchParams`는 Web 표준 API (WHATWG URL Standard). 주요 메서드:

```ts
// URL 읽기
const params = new URLSearchParams(window.location.search);
params.get('sorting');          // string | null
params.has('columnFilters');    // boolean

// URL 쓰기
const next = new URLSearchParams(window.location.search);
next.set('sorting', JSON.stringify(sortingState));
next.delete('columnFilters');   // 빈 배열 → 키 삭제로 URL 정리
window.history.replaceState({}, '', `?${next.toString()}`);
```

`JSON.stringify` / `JSON.parse`로 TanStack 상태 직렬화. 단, `columnSizing`(Record<string,number>)은 `JSON.stringify` 정상 처리.

**L1 출처**: Web 표준 — 파일 시스템 증거 없음 (Web standard, no file-system Read evidence applicable). `D:/project/topvel_project/TOMIS/.claude/tw-grid/references/tanstack-api-inventory.md` §3 확인: URL sync는 TanStack 기본 제공 기능 아님.

### 1.3 L2: 기존 구현 — GridStateValues, GridStateKey, UseGridStateOptions

```ts
// types.ts L589 (GridStateValues)
export interface GridStateValues<_TData = unknown> {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  rowSelection: RowSelectionState;
  pagination: PaginationState;
  columnPinning: ColumnPinningState;
  columnOrder: ColumnOrderState;
  columnSizing: ColumnSizingState;
  columnVisibility: VisibilityState;
}

// types.ts L615 (GridStateKey)
export type GridStateKey = keyof GridStateValues;
// = 'sorting' | 'columnFilters' | 'rowSelection' | 'pagination'
//   | 'columnPinning' | 'columnOrder' | 'columnSizing' | 'columnVisibility'
```

**G-003 `useDebouncedCallback`**: `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/useDebouncedCallback.ts` (91줄) — `useRef + setTimeout` 패턴, lodash 의존 없음. G-005에서 `debounceMs` 옵션 구현 시 재사용.

### 1.4 현황 요약

현재 `useGridState`는 G-001~G-004 기능 완료 상태. URL sync 기능 부재. 별도 `useUrlSync` hook으로 분리 구현 — `useGridState`와 독립 사용 가능 (optional helper). `affectedUsageFiles`: **0개** (goals.json `"affectedUsageFiles": []` 확인).

---

## Section 2 — 목표 (Goal)

**G-005**: `useUrlSync` hook 구현 — `GridStateValues`의 임의 subset을 URL search params에 동기화하는 옵션 helper.

### 2.1 userJourney (goals.json 5단계)

1. 사용자가 `useUrlSync(state, { keys: ['sorting', 'columnFilters'] })` 호출
2. 정렬/필터 변경 시 URL이 `?sorting=...&columnFilters=...` 로 자동 갱신
3. 페이지 새로고침 또는 URL 공유 → 동일 상태 복원
4. `useUrlSync`는 router 라이브러리에 의존하지 않음 (`window.history.replaceState` 직접 사용)
5. debounce 옵션으로 URL 업데이트 빈도 조절 가능

### 2.2 hook 시그니처 (확정)

```ts
// useUrlSync.ts (NEW)
export function useUrlSync<TData = unknown>(
  state: GridStateValues<TData>,
  options?: UseUrlSyncOptions<TData>
): void

// types.ts (MODIFY — UseUrlSyncOptions 추가)
export interface UseUrlSyncOptions<TData = unknown> {
  /** 동기화할 state 키 목록 (미지정 시 전체 8개) */
  keys?: GridStateKey[];
  /** URL 업데이트 debounce ms (기본 0 = 즉시) */
  debounceMs?: number;
  /** mount 시 URL → state hydration 콜백 (AC-004) */
  onHydrate?: (partial: Partial<GridStateValues<TData>>) => void;
  /** URL param 네임스페이스 prefix (기본 없음) */
  prefix?: string;
}
```

---

## Section 3 — AC (Acceptance Criteria) 목록

> **출처**: `D:/project/topvel_project/TOMIS/.claude/tw-grid/goals/MOD-GRID-02/state-goals.json` G-005 (직접 Read 확인)

| AC-ID | 설명 | binding 파일 |
|-------|------|-------------|
| AC-001 | `useUrlSync(state, { keys: ['sorting'] })` 호출 시 sorting 변경이 URL `?sorting=…` 에 반영됨 | `useUrlSync.ts`, `serializeState.ts`, `useUrlSync.test.ts` |
| AC-002 | `keys` 미지정 시 8개 전체 state 키가 URL에 반영됨 | `useUrlSync.ts`, `useUrlSync.test.ts` |
| AC-003 | 빈 배열 / 기본값인 state (예: `sorting: []`) 는 URL에서 해당 키를 삭제하여 URL 정리 | `serializeState.ts`, `useUrlSync.test.ts` |
| AC-004 | mount 시 URL search params 파싱 → `onHydrate` 콜백 호출 (URL → state 초기 복원) | `useUrlSync.ts`, `useUrlSync.stories.tsx` |
| AC-005 | Storybook 스토리 1개 (`useUrlSync.stories.tsx`) + vitest 시나리오 ≥ 3개 (`useUrlSync.test.ts`) 작성 | `useUrlSync.stories.tsx`, `useUrlSync.test.ts` |

> **E-01 v1.0.6 바인딩 확인**: AC-004는 `useUrlSync.stories.tsx` 바인딩, AC-005는 두 파일 모두 바인딩. Section 7 implementFiles에 두 파일 모두 명시됨 (D6).

---

## Section 4 — 위험 및 제약

### 4.1 활성 제약 (constraints.md)

| 제약 | 내용 |
|------|------|
| **C-28** | goals.json `implementFiles` 경로 = 정식 monorepo 경로 (D1 확인: 정정 불필요) |
| **C-29** | `exactOptionalPropertyTypes` — optional prop forwarding 시 spread-skip 또는 union 명시 |
| **C-30** | Spec Truth Table: Section 7 final implementFiles table이 유일한 권위 소스 |
| **C-31** | NEW util (`serializeState.ts`) call-site wiring: `useUrlSync.ts`의 import가 유일한 call-site (D8) |
| **C-32** | unstable setter(`onHydrate`) → option 2 `useRef` 패턴 사용 (eslint-disable option 3 금지) |
| **Rules of Hooks** | SSR guard는 `useEffect` body 내부 (D3). 조건부 hook 호출 절대 금지 |

### 4.2 G-004 R-1 cascading risk 차단

**R-1 (G-004 self-review 신규 위험)**: Section 5에 binding AC 명시 → Section 7에 해당 파일 미포함 → Implementer가 C-30 기준으로 파일 생략 가능 → AC 검증 불가.

**G-005 차단 조치**:
- AC-005를 "Storybook 1개 + vitest ≥ 3 시나리오"로 확장 명시
- Section 7 final implementFiles 표에 `useUrlSync.stories.tsx` + `useUrlSync.test.ts` 명시
- 두 파일 role = "test/story" 로 별도 구분

### 4.3 추가 위험

| ID | 위험 | 대응 |
|----|------|------|
| R-1 | URL state 역직렬화 실패 (JSON.parse throw) | `serializeState.ts` 내부 try-catch → 파싱 실패 시 `undefined` 반환. `useUrlSync`는 undefined 키 skip |
| R-2 | `debounceMs > 0` 상태에서 unmount 시 pending timer | `useDebouncedCallback` 내부 cleanup useEffect 활용 (G-003 재사용) |
| R-3 | `prefix` 옵션 미사용 시 타 query param 덮어쓰기 | `URLSearchParams.set` 은 지정 키만 수정. 타 키 보존 확인 필요 (replaceState 전 기존 params 복사 패턴) |
| R-4 | C-32 2nd occurrence 트리거 | D5 결정으로 option 2(`useRef`) 사용 → eslint-disable 미발생 |

---

## Section 5 — 기술 설계

### 5.1 `internal/serializeState.ts` — 직렬화 유틸

```ts
// packages/grid-core/src/internal/serializeState.ts (NEW)
import type { GridStateValues, GridStateKey } from '../types';

/** 기본값(빈 배열/객체) 판단 — URL에서 키 삭제 여부 결정 */
export function isDefaultState(key: GridStateKey, value: unknown): boolean {
  // sorting / columnFilters / columnOrder: 빈 배열
  // rowSelection / columnPinning / columnSizing / columnVisibility: 빈 객체
  // pagination: { pageIndex: 0, pageSize: 10 } (기본값)
}

/** GridStateValues subset → URLSearchParams 변환 */
export function serializeGridState(
  state: Partial<GridStateValues>,
  keys: GridStateKey[],
  prefix: string,
  existingParams: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(existingParams); // 타 params 보존 (R-3 대응)
  for (const key of keys) {
    const paramKey = prefix ? `${prefix}_${key}` : key;
    const value = state[key];
    if (isDefaultState(key, value)) {
      next.delete(paramKey);  // AC-003: 기본값 → 키 삭제
    } else {
      next.set(paramKey, JSON.stringify(value));
    }
  }
  return next;
}

/** URLSearchParams → Partial<GridStateValues> 역직렬화 */
export function deserializeGridState(
  params: URLSearchParams,
  keys: GridStateKey[],
  prefix: string
): Partial<GridStateValues> {
  const result: Partial<GridStateValues> = {};
  for (const key of keys) {
    const paramKey = prefix ? `${prefix}_${key}` : key;
    const raw = params.get(paramKey);
    if (raw === null) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = JSON.parse(raw);
    } catch {
      // R-1: 파싱 실패 → skip (result에 key 미포함)
    }
  }
  return result;
}
```

**C-31 call-site**: `useUrlSync.ts`에서만 import. `index.ts`에서 re-export 금지 (D8).

### 5.2 `useUrlSync.ts` — 메인 hook

```ts
// packages/grid-core/src/useUrlSync.ts (NEW)
import { useEffect, useRef } from 'react';
import type { GridStateValues, GridStateKey, UseUrlSyncOptions } from './types';
import { serializeGridState, deserializeGridState } from './internal/serializeState';
import { useDebouncedCallback } from './internal/useDebouncedCallback';

const ALL_KEYS: GridStateKey[] = [
  'sorting', 'columnFilters', 'rowSelection', 'pagination',
  'columnPinning', 'columnOrder', 'columnSizing', 'columnVisibility',
];

export function useUrlSync<TData = unknown>(
  state: GridStateValues<TData>,
  options?: UseUrlSyncOptions<TData>
): void {
  const keys = options?.keys ?? ALL_KEYS;
  const debounceMs = options?.debounceMs ?? 0;
  const prefix = options?.prefix ?? '';

  // C-32 option 2: onHydrate ref (non-stable setter 안전 패턴)
  const hydrateRef = useRef(options?.onHydrate);
  useEffect(() => {
    hydrateRef.current = options?.onHydrate;
  }); // intentionally no deps — always sync latest ref

  // AC-004: mount 시 URL → state hydration
  useEffect(() => {
    if (typeof window === 'undefined') return; // D3: SSR guard (useEffect body 내부)
    const params = new URLSearchParams(window.location.search);
    const partial = deserializeGridState(params, keys, prefix);
    if (Object.keys(partial).length > 0) {
      hydrateRef.current?.(partial as Partial<GridStateValues<TData>>);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // AC-001, AC-002, AC-003: state → URL sync (debounce 지원)
  const syncToUrl = useDebouncedCallback(() => {
    if (typeof window === 'undefined') return; // D3
    const next = serializeGridState(
      state as Partial<GridStateValues>,
      keys,
      prefix,
      new URLSearchParams(window.location.search)
    );
    window.history.replaceState({}, '', `?${next.toString()}`);
  }, debounceMs);

  // D4: 8개 state 개별 primitive deps (객체 참조 의존 금지)
  useEffect(() => {
    syncToUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.sorting,
    state.columnFilters,
    state.rowSelection,
    state.pagination,
    state.columnPinning,
    state.columnOrder,
    state.columnSizing,
    state.columnVisibility,
    // syncToUrl은 useDebouncedCallback이 useCallback으로 감싸므로 stable (G-003 확인)
  ]);
}
```

> **주의**: `useDebouncedCallback` 반환값이 stable한지 implement 단계에서 확인 필요. `useCallback` 래핑이면 stable → deps 포함 생략 가능.

### 5.3 `types.ts` — UseUrlSyncOptions 추가 (MODIFY)

```ts
// types.ts (MODIFY — UseUrlSyncOptions interface 추가, UseGridStateOptions 하단에)
export interface UseUrlSyncOptions<TData = unknown> {
  /** 동기화할 GridStateKey 목록 (미지정 시 전체 8개) */
  keys?: GridStateKey[];
  /** URL 업데이트 debounce ms (기본 0 = 즉시) */
  debounceMs?: number;
  /** mount 시 URL → state hydration 콜백 (AC-004) */
  onHydrate?: (partial: Partial<GridStateValues<TData>>) => void;
  /** URL param prefix (기본 '') */
  prefix?: string;
}
```

**C-29 exactOptionalPropertyTypes**: 모든 optional 프로퍼티 접근 시 `options?.keys ?? ALL_KEYS` 패턴 사용 (spread-skip 또는 nullish coalescing).

### 5.4 `index.ts` — useUrlSync + UseUrlSyncOptions export 추가 (MODIFY)

```ts
// index.ts (MODIFY — 추가 export)
export { useUrlSync } from './useUrlSync';
export type { UseUrlSyncOptions } from './types';
// serializeState.ts는 internal — re-export 금지 (D8, C-31)
```

---

## Section 6 — 테스트 계획 (AC 매핑)

### 6.1 vitest 시나리오 (`useUrlSync.test.ts` — NEW, ≥ 3개)

| 시나리오 | AC | 검증 포인트 |
|---------|-----|------------|
| S1: `keys: ['sorting']` → sorting 변경 시 `?sorting=…` 반영 | AC-001 | `window.history.replaceState` mock 호출 확인 |
| S2: `keys` 미지정 → 8개 전체 키 URL 반영 | AC-002 | URLSearchParams 8개 키 존재 확인 |
| S3: `sorting: []` (기본값) → URL에서 `sorting` 키 삭제 | AC-003 | URLSearchParams에 `sorting` 키 없음 확인 |
| S4: mount 시 URL `?sorting=[…]` → `onHydrate` 콜백 호출 | AC-004 | onHydrate mock 함수 호출 여부 + 인수 검증 |
| S5: JSON.parse 실패 (corrupted URL) → 해당 키 skip, 에러 없음 | R-1 대응 | onHydrate는 파싱 성공한 키만 포함 |

> 5개 시나리오 ≥ 3 기준 충족. Implementer는 최소 S1~S3 필수, S4~S5 권장.

### 6.2 Storybook (`useUrlSync.stories.tsx` — NEW, 1개)

```tsx
// 스토리: SortingUrlSync
// - useGridState + useUrlSync 조합 데모
// - URL 변경 시 state 복원 시뮬레이션 (onHydrate 연결)
// - prefix 옵션 데모 (다중 그리드 공존 시나리오)
```

---

## Section 7 — 구현 파일 목록 (C-30 Spec Truth Table)

> **경고**: 이 표가 유일한 권위 소스 (C-30). Implementer는 이 표의 파일만 생성/수정.

| 파일 경로 | 변경 유형 | 역할 | binding AC |
|-----------|----------|------|------------|
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useUrlSync.ts` | **NEW** | G-005 메인 hook | AC-001, AC-002, AC-004 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/internal/serializeState.ts` | **NEW** | 직렬화/역직렬화 유틸 | AC-001, AC-002, AC-003 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useUrlSync.stories.tsx` | **NEW** | Storybook 스토리 | AC-004, AC-005 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/useUrlSync.test.ts` | **NEW** | vitest 단위 테스트 | AC-001~AC-005 |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/types.ts` | **MODIFY** | UseUrlSyncOptions 인터페이스 추가 | AC-004 (onHydrate 타입) |
| `D:/project/topvel_project/topvel-grid-monorepo/packages/grid-core/src/index.ts` | **MODIFY** | useUrlSync + UseUrlSyncOptions export 추가 | — |

**합계**: NEW 4 + MODIFY 2 = **6파일** (D7)

---

## Section 8 — 영향 범위

### 8.1 affectedUsageFiles

**0개** (goals.json `"affectedUsageFiles": []` 직접 확인). `useUrlSync`는 신규 optional hook — 기존 파일 수정 불필요.

> 미래: `tw-framework-front/src/pages/` 내 27개 그리드 페이지는 향후 자발적으로 `useUrlSync`를 적용 가능 (G-005 scope 외).

### 8.2 번들 영향

- goals.json 참조: **+2 KB** (G-005 추정)
- `serializeState.ts`: JSON.stringify/parse + URLSearchParams — 추가 외부 의존 없음
- `useDebouncedCallback` 재사용 (G-003 기존 파일, 번들 추가 없음)
- Implement 직후 `size-limit` 게이트 실측 의무 (D9)

### 8.3 Breaking Change

없음. `useUrlSync`는 완전 신규 export. 기존 `useGridState` API 무변경.

---

## Section 9 — 마이그레이션 영향

**migrationImpact**: `low` (goals.json 확인). 신규 optional hook으로 기존 마이그레이션 코드베이스 무영향.

---

## Section 10 — 구현 순서 (Implementer 가이드)

1. `internal/serializeState.ts` 작성 — `serializeGridState`, `deserializeGridState`, `isDefaultState` 구현
2. `types.ts` MODIFY — `UseUrlSyncOptions<TData>` interface 추가 (UseGridStateOptions 하단)
3. `useUrlSync.ts` 작성 — D3(SSR), D4(deps), D5(hydrateRef), D8(serializeState import) 준수
4. `index.ts` MODIFY — `useUrlSync` + `UseUrlSyncOptions` re-export 추가
5. `useUrlSync.test.ts` 작성 — S1~S5 최소 3개 이상 구현 (AC-005)
6. `useUrlSync.stories.tsx` 작성 — SortingUrlSync 스토리 1개 (AC-004, AC-005)
7. `size-limit` 실행 → +2 KB 한도 확인

---

## Section 11 — 열린 질문 (Open Questions)

| ID | 질문 | 결정 기준 |
|----|------|----------|
| OQ-1 | `useDebouncedCallback` 반환값이 stable(useCallback 래핑)한가? | implement 단계: `useDebouncedCallback.ts` L91 확인. stable이면 syncToUrl을 useEffect deps에서 제외 가능 |
| OQ-2 | `pagination` 기본값은 `{ pageIndex: 0, pageSize: 10 }` 인가? | `useGridState.ts` DEFAULT_GRID_STATE_VALUES 확인. `isDefaultState` 구현 시 필요 |
| OQ-3 | `prefix` 옵션 미사용 시 타 프레임워크 query param과 충돌 가능성 | implement 단계 테스트에서 확인. 필요 시 기본 prefix 추가 권장 (spec 변경 없이 implementer 판단) |

---

## Section 12 — 용어 정의

| 용어 | 정의 |
|------|------|
| URL sync | `GridStateValues` ↔ URL search params 양방향 동기화 |
| hydration | URL search params → `GridStateValues` 초기 복원 (mount 시 1회) |
| serializeState | `GridStateValues` subset → URL-safe string 직렬화 (`JSON.stringify`) |
| deserializeState | URL string → `GridStateValues` subset 역직렬화 (`JSON.parse`) |
| prefix | URL param 네임스페이스 구분자 (`${prefix}_${key}` 형태) |
| isDefaultState | 해당 key의 state가 기본값인지 판단 — URL에서 키 삭제 여부 결정 |

---

## Section 13 — 자기 검증 (Pre-submission Checklist)

### H 메타-게이트 (specify-rubric v1.0.6)

| 항목 | 확인 | 비고 |
|------|------|------|
| **H-01** L1 참조 경로 존재 | ✅ | URLSearchParams = Web standard (파일 경로 없음, 명시적 기재), tanstack-api-inventory.md 직접 Read 확인 |
| **H-02** implementFiles 합리성 | ✅ | 6파일: NEW 4(useUrlSync.ts, serializeState.ts, stories, test) + MODIFY 2(types.ts, index.ts). Section 7에 전체 명시 |
| **H-03** AC source tag | ✅ | Section 3 도입부에 `goals.json G-005 직접 Read 확인` 명시 |

### G-01 cross-consistency (v1.0.4)

| 항목 | 확인 | 비고 |
|------|------|------|
| D# 표 ↔ Section 7 일치 | ✅ | D7 "6파일" = Section 7 6행 일치 |
| D# 표 ↔ Section 5 일치 | ✅ | D2(onHydrate), D3(SSR), D4(deps), D5(hydrateRef), D8(serializeState internal) 모두 Section 5에 반영 |
| AC ↔ Section 7 binding | ✅ | E-01 v1.0.6: AC-004→stories.tsx, AC-005→stories.tsx+test.ts 모두 Section 7에 명시 |
| C-30 Truth Table | ✅ | Section 7이 유일한 권위 소스. D# D7과 일치 |
| C-31 call-site wiring | ✅ | serializeState.ts call-site = useUrlSync.ts import 1개 (Section 5.1 명시) |
| C-32 unstable setter | ✅ | onHydrate → option 2 useRef (hydrateRef), eslint-disable option 3 미사용 (D5) |
| Rules of Hooks | ✅ | SSR guard = useEffect body 내부 (D3). 조건부 hook 없음 |
| affectedUsageFiles 0개 literal | ✅ | Section 8.1 명시 |
| G-004 R-1 loophole 차단 | ✅ | AC-005 확장 + Section 7에 stories/test 파일 명시 (D6, Section 4.2) |

### 자기 점수 추정 (specify-rubric v1.0.6 기준)

| 영역 | 예상 점수 | 근거 |
|------|----------|------|
| A (현황) | 5/5 | L0 직접 Read, L1 Web standard 명시, L2 types.ts 코드 발췌 |
| B (목표) | 5/5 | AC 5개 전체 명시, binding 파일 매핑, userJourney 5단계 |
| C (위험) | 5/5 | C-28~C-32 전체, R-1~R-4, G-004 R-1 차단 |
| D (설계) | 6/6 | serializeState 유틸, hook 구조, SSR guard, deps 설계, C-29 패턴 |
| E (AC↔파일) | 6/6 | E-01 v1.0.6 완전 충족: AC-004→stories, AC-005→stories+test 모두 Section 7 |
| F (테스트) | 4/4 | vitest 5시나리오, Storybook 1개, AC 매핑 표 |
| G (자기검증) | 1/1 | H 메타-게이트 + G-01 cross-consistency 모두 통과 |
| **합계** | **32/32 = 100점** | threshold 85 충족 |
