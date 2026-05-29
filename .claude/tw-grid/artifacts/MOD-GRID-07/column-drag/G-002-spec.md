# G-002 Spec: 컬럼 순서 영속화 (localStorage) + 키보드 단축키 (Alt+← / Alt+→)

**Module**: MOD-GRID-07 (컬럼 드래그 재정렬)  
**Goal**: G-002  
**Priority**: P1  
**migrationImpact**: low  
**Specify threshold**: 90  
**Spec version**: 1.0  
**Spec date**: 2026-05-14  
**Status**: specify → in_progress

---

## D# — 결정 테이블 (Goals.json 보정 포함)

| ID | 결정 | 근거 |
|----|------|------|
| D1 | `persistColumnOrder?: boolean` + `columnOrderStorageKey?: string` prop을 `grid-core/types.ts` `GridProps<TData>`에 추가 | AC-001 이행에 grid-core 수정 필수; goals.json에 grid-core 파일 누락 → C-31 wiring 불가 |
| D2 | `grid-core/Grid.tsx` th 블록에 `tabIndex={0}` + `onKeyDown` + `aria-roledescription` 추가 wiring | AC-003: keyboard focusable th 의무; C-31 dead-code 금지 |
| D3 | goals.json `implementFiles` 3파일 → 7파일로 보정 (grid-core 2개 추가 MODIFY, stories 1개 추가 MODIFY, index.ts 추가 MODIFY) | AC-001 GridProps 추가 + AC-003 th wiring + AC-006 story + index.ts export 이행에 4개 파일 추가 필수 (C-28) |
| D4 | `enableColumnReorder` 단일 flag가 drag(G-001)와 keyboard(G-002) 양쪽 활성화 제어 — 별도 `enableKeyboardMove` prop 없음 | API 표면 최소화; "drag 비활성 + 키보드 활성" 유스케이스 미존재; pinned guard 동일 로직 공유 |
| D5 | `persistColumnOrder` / `columnOrderStorageKey` prop은 기존 `columnPersistence` (G-003 / MOD-GRID-04)와 독립 경량 옵션 (Path A) — 두 옵션 동시 지정 시 각자 별도 storageKey로 localStorage 저장 (key 충돌 없음); mount 시 Grid.tsx hook 선언 순서 상 나중에 실행된 `table.setColumnOrder`가 최종 적용 | AC-001 범위: drag-local 영속화 한정; `columnPersistence` 재사용 시 API 충돌 + G-003 scope 오염 우려; 별도 key 사용으로 저장 데이터 독립; 동시 사용 시 non-deterministic 복원 → 동시 사용 비권장 |
| D6 | `useColumnOrderPersist` hook을 `packages/grid-features/src/column-drag/` 에 신규 생성 — `grid-core/useStoragePersist` 패턴 구조적 미러 (try/catch, SSR guard, QuotaExceededError 처리) | AC-002 try/catch; `grid-core` 수정 최소화; G-001 hook 캡슐화 원칙 연속 |
| D7 | keyboard 핸들러 `getKeyDownHandler(columnId, isPinned)` 를 `useColumnDrag` 반환에 추가 — `useColumnOrderPersist` 분리, `useColumnDrag` 통합 | G-002 기능 2종(persist + keyboard)을 별도 hook 분리보다 `useColumnDrag` 단일 hook에 통합 시 Grid.tsx wiring 단순화; keyboard 핸들러는 drag state(`table.setColumnOrder`)를 공유 |
| D8 | `getKeyDownHandler` 는 focus-scoped th-level `onKeyDown` — `document.addEventListener` 금지 | Alt+←/→ 충돌 방지: `GridPagination.tsx` 의 `enableKeyboardNav` 핸들러는 pagination container div scoped → th focus 시 dispatch되지 않음; document-level 핸들러는 두 개 동시 fire 위험 |
| D9 | `aria-roledescription="draggable column"` — `aria-grabbed` 미사용 | WAI-ARIA 1.1에서 `aria-grabbed` deprecated. `aria-roledescription`으로 역할 설명 + `draggable={true}` 자체 시맨틱으로 충분 |
| D10 | `useColumnOrderPersist` 는 `{ saveOrder }` 콜백 반환 — `useColumnDrag` 내부 `handleColumnOrderChange` 합성 시 호출 | `saveOrder` 는 외부 `onColumnOrderChange` + persist 저장을 합성하는 내부 진입점; Grid.tsx는 `useColumnDrag` 반환만 소비 (Grid.tsx → `useColumnOrderPersist` 직접 접근 없음 — C-31) |

---

## Section 1. 목적 및 범위

G-002는 G-001이 구현한 HTML5 DnD 기반 컬럼 재정렬을 두 방향으로 확장한다.

**핵심 달성 항목:**
- `persistColumnOrder?: boolean` + `columnOrderStorageKey?: string` prop으로 localStorage 영속화 활성화 (AC-001)
- localStorage 접근은 try/catch 래핑 + SSR guard (`typeof window`) + `QuotaExceededError` silent fallback (AC-002)
- 헤더 `<th>`에 `tabIndex={0}` 부여 → 키보드 포커스 가능 (AC-003)
- `aria-roledescription="draggable column"` WAI-ARIA 속성 (`enableColumnReorder=true` 시) (AC-003, D9)
- `Alt+←` → 현재 포커스된 컬럼을 한 칸 왼쪽으로 이동 (AC-003)
- `Alt+→` → 현재 포커스된 컬럼을 한 칸 오른쪽으로 이동 (AC-003)
- pinned 컬럼 위치 불변 — keyboard 이동 시에도 pinned guard 적용 (AC-004)

**범위 외:**
- 터치 이벤트 지원 — 이 Goal 범위 외
- SessionStorage 지원 — `useStoragePersist`(grid-core) 에서 지원하나 G-002는 localStorage만 (AC-001 `columnOrderStorageKey` 한정)
- `columnPersistence` (G-003) 내부 구현 변경 — G-003 scope; G-002는 독립 props 추가만 (D5)

**migrationImpact**: low — `affectedUsageFiles: []`, 기존 사용처 0 영향, 모든 신규 prop은 optional (opt-in)

---

## Section 2. 의존성 및 전제조건

| 의존 Goal | 요구 사항 | 상태 |
|-----------|---------|------|
| MOD-GRID-07/G-001 | `useColumnDrag`, `getDragProps`, `DragThProps`, `UseColumnDragProps`, `UseColumnDragReturn` 존재 + Grid.tsx th wiring 완료 | 완료 |
| MOD-GRID-02/G-001 | `columnOrder` state, `setColumnOrder`, `table.getState().columnOrder` 접근 가능 | 완료 |
| MOD-GRID-04/G-003 | `columnPersistence?: ColumnPersistenceOptions` 이미 GridProps에 존재 — D5 precedence 명문화 필요 | 완료 |

**전제 확인:**
- `grid-features/src/column-drag/useColumnDrag.ts` L24: `useColumnDrag<TData>` 함수 — 존재 확인
- `grid-features/src/column-drag/types.ts` L15: `UseColumnDragProps<TData>` — `enabled`, `onColumnOrderChange?` 포함
- `grid-features/src/column-drag/types.ts` L27: `UseColumnDragReturn` — `getDragProps`, `dragOverId` 포함
- `grid-core/src/Grid.tsx` L163-171: `useColumnDrag` 호출 + C-29 spread-skip 패턴 존재
- `grid-core/src/Grid.tsx` L305-332: `<th>` 블록 — `draggable`, `onDragStart/Over/Leave/Drop/End` 존재; `tabIndex`, `onKeyDown`, `aria-roledescription` 미존재 확인
- `grid-core/src/types.ts` L492: `columnPersistence?: ColumnPersistenceOptions` 존재
- `grid-core/src/useStoragePersist.ts` L55-147: `useStoragePersist` 패턴 — `typeof window` guard L72, try/catch L97-99, QuotaExceededError L118-122 확인
- `grid-core/src/pagination/GridPagination.tsx`: `enableKeyboardNav` → `containerRef`(pagination footer div) scoped `keydown` 리스너 — th-level `onKeyDown`과 scope 충돌 없음 (D8)

**외부 패키지:**
- `@tanstack/react-table@^8.21.3` (peer dep 이미 등록) — `setColumnOrder`, `ColumnOrderState`, `getAllLeafColumns()`, `getIsPinned()` 사용
- Web Storage API `localStorage` — 네이티브 브라우저 API, 추가 dependency 없음
- `KeyboardEvent.altKey` + `KeyboardEvent.key` — 네이티브 DOM API

---

## Section 3. 수용 기준 (AC) 상세화

| AC-ID | 원문 | 구현 상세 | 파일 |
|-------|------|---------|------|
| AC-001 | `persistColumnOrder?: boolean` + `storageKey?: string` prop — localStorage 영속화 (useGridState columnOrder 통합, C-4 타입 명시) | `GridProps`에 `persistColumnOrder?: boolean` + `columnOrderStorageKey?: string` 추가. `useColumnOrderPersist` hook에 연결. `useColumnDrag` 의 `onColumnOrderChange` 로부터 저장 trigger. mount 시 localStorage 복원 → `table.setColumnOrder` 직접 호출. | types.ts (grid-core), Grid.tsx (grid-core), useColumnOrderPersist.ts (NEW) |
| AC-002 | localStorage 접근은 try/catch 래핑 (SSR/private 브라우저 대응) | `useColumnOrderPersist` 내부 모든 `localStorage.setItem/getItem` 에 try/catch 래핑. `typeof window === 'undefined'` SSR guard. `QuotaExceededError` → `console.warn` + silent skip. | useColumnOrderPersist.ts |
| AC-003 | Alt+← / Alt+→ keydown 핸들러 — 헤더 th focusable(tabIndex=0) + 이벤트 attach (접근성 — aria-roledescription 속성 적용) | `useColumnDrag` 반환에 `getKeyDownHandler(columnId, isPinned): (e: KeyboardEvent) => void` 추가. Grid.tsx `<th>`에 `tabIndex={0}` + `onKeyDown={(e) => getKeyDownHandler(header.column.id, isPinned)(e.nativeEvent)}` + `aria-roledescription={enableColumnReorder ? "draggable column" : undefined}` 추가. | useColumnDrag.ts, types.ts (grid-features), Grid.tsx (grid-core) |
| AC-004 | 키보드 이동 시 pinned 컬럼 위치 불변 (G-001 pinned 가드 동일 로직 재사용) | `getKeyDownHandler` 내부: `isPinned=true` → 즉시 return (no-op). 이동 계산 시 `getAllLeafColumns()` 에서 pinned 컬럼 skip → 비-pinned 컬럼만 순서 재계산. | useColumnDrag.ts |
| AC-005 | C-12: tsc --noEmit 0 error | exactOptionalPropertyTypes 준수 + 모든 타입 명시 (C-4, C-29). | 전체 |
| AC-006 | C-25: Storybook story 1개 (persistColumnOrder + 키보드 이동 시나리오) | `useColumnDrag.stories.tsx` 에 `PersistAndKeyboard` story 추가. localStorage mock 시나리오 + Alt+← 이동 안내 포함. | useColumnDrag.stories.tsx |

---

## Section 4. 참조 증거 (L-layer)

### L0 — 현재 코드베이스
- `grid-features/src/column-drag/useColumnDrag.ts` L27: `UseColumnDragReturn` — `getDragProps`, `dragOverId` 만 반환. `getKeyDownHandler` 미존재 → G-002에서 추가
- `grid-features/src/column-drag/types.ts` L15-22: `UseColumnDragProps` — `enabled`, `onColumnOrderChange?`. persist 관련 prop 미존재
- `grid-core/src/Grid.tsx` L305-332: `<th>` — `tabIndex`, `onKeyDown`, `aria-roledescription` 미존재
- `grid-core/src/types.ts` L492: `columnPersistence?: ColumnPersistenceOptions` 존재 (G-003 상위 persist)
- `grid-core/src/useStoragePersist.ts` L55-147: 동일 localStorage 패턴 — SSR guard, try/catch, QuotaExceededError 처리 골든 레퍼런스
- `grid-core/src/pagination/GridPagination.tsx`: `enableKeyboardNav` — `containerRef` div scoped `keydown` 리스너로 Alt+←/→ 처리 (th onKeyDown scope와 무충돌 — D8)
- `grid-features/src/column-drag/useColumnDrag.stories.tsx` L172-184: stories 2개 (`ColumnReorderDrop`, `WithPinnedGuard`) 존재 — G-002에서 3번째 story 추가

### L1 — TanStack Table v8 API + Web API
- `§2.3 ColumnOrdering`: `table.setColumnOrder(order: ColumnOrderState)` — G-002 keyboard 이동 + persist 복원 시 호출
- `table.getAllLeafColumns()` — keyboard 이동 시 전체 컬럼 ID 배열 획득 (pinned 제외 로직)
- `table.getState().columnOrder` — 현재 컬럼 순서
- `column.getIsPinned(): 'left' | 'right' | false` — AC-004 pinned guard
- `localStorage.getItem/setItem/removeItem` — Web Storage API (AC-002)
- `KeyboardEvent.altKey: boolean` + `KeyboardEvent.key: 'ArrowLeft' | 'ArrowRight'` — AC-003 keyboard 판별

### R-A — AG Grid Community 참조
- AG Grid: `applyColumnState({ state: [...], applyOrder: true })` — column order 저장/복원 API
- 우리: `localStorage.setItem(key, JSON.stringify(order))` + `table.setColumnOrder()` (C-7: AG Grid 코드 차용 금지)

### R-W — Wijmo FlexGrid 참조
- Wijmo: `grid.columnLayout` 속성 → JSON 직렬화로 column 순서 저장
- 우리: string array JSON serialize (C-16: Wijmo import 금지)

---

## Section 5. 아키텍처 결정 (ADR)

**ADR 불필요** (C-20):
- localStorage Web Storage API는 네이티브 브라우저 API — 외부 라이브러리 도입 없음
- keyboard handler는 DOM `KeyboardEvent` — 추가 dependency 없음

**핵심 아키텍처 선택:**

1. **`useColumnOrderPersist` 분리 + `useColumnDrag` 통합 전략 (D6, D7)**:
   - `useColumnOrderPersist`: localStorage read/write 전담 hook — `{ saveOrder }` 반환 (D10). mount 시 read → `table.setColumnOrder()`; `saveOrder(order)` 호출 시 localStorage.setItem.
   - `getKeyDownHandler`: `useColumnDrag` 내부에서 구현 + 반환. `table.setColumnOrder` 공유.
   - Grid.tsx: `useColumnDrag` 한 곳에서 두 기능 모두 수신 → `<th>` props 주입.

2. **focus-scoped keyboard handler (D8)**:
   - `<th onKeyDown>` React synthetic event → `.nativeEvent` 추출 후 `getKeyDownHandler()(e)` 호출.
   - `e.altKey && e.key === 'ArrowLeft'` / `ArrowRight` 판별 + `e.preventDefault()`.
   - document-level 핸들러 미사용 — pagination `enableKeyboardNav` Alt+←/→ 충돌 없음.

3. **persist hook 설계 (`useStoragePersist` 미러 — D6)**:
   - mount `useEffect([], [])` — localStorage read → `table.setColumnOrder()`.
   - save trigger: `onColumnOrderChange` 콜백 (외부에서 주입) — debounce 미적용 (drag는 이미 사용자 동작 완료 후 1회 fire; keyboard도 동일).
   - D5 coexistence: `columnPersistence`(G-003)와 동시 사용 시 각자 별도 storageKey로 저장 → key 충돌 없음. mount 순서에 따라 나중에 실행된 `table.setColumnOrder` 가 최종 적용 (non-deterministic — 동시 사용 비권장).

4. **`useColumnDrag` 반환 확장 (`getKeyDownHandler` 추가)**:
   - 기존 `UseColumnDragReturn`: `{ getDragProps, dragOverId }`.
   - G-002 추가: `getKeyDownHandler: (columnId: string, isPinned: boolean) => (e: KeyboardEvent) => void`.
   - `getKeyDownHandler` 반환 함수는 `useCallback` deps에 `[enabled, table, onColumnOrderChange]` 공유.

---

## Section 6. C-17 시각 회귀 체크 (N/A)

**N/A 근거**: `migrationImpact: low` + `affectedUsageFiles: []` (0/23 usages affected) → C-17 시각 회귀 체크 의무 없음.

G-002 변경은 all opt-in (`persistColumnOrder`, `columnOrderStorageKey`, `enableColumnReorder` 없으면 `tabIndex=0` + `aria-roledescription` 는 렌더되나 기존 UI 외관 변경 없음). `tabIndex=0`은 시각적 변화 없음.

---

## Section 7. 구현 파일 목록 (확정 — D3 보정 반영)

> Goals.json `implementFiles` 3파일에서 grid-core 2파일 추가 MODIFY + stories 1파일 MODIFY + index.ts 1파일 MODIFY로 7파일 확장 (D3).

| # | 파일 | 액션 | 사유 |
|---|------|------|------|
| 1 | `packages/grid-features/src/column-drag/useColumnOrderPersist.ts` | NEW | localStorage 영속화 hook (AC-001, AC-002) |
| 2 | `packages/grid-features/src/column-drag/types.ts` | MODIFY | `UseColumnDragReturn`에 `getKeyDownHandler` 추가; `UseColumnDragProps`에 persist props 추가 |
| 3 | `packages/grid-features/src/column-drag/useColumnDrag.ts` | MODIFY | `getKeyDownHandler` 구현 + `useColumnOrderPersist` 통합 (AC-003, AC-004, D7) |
| 4 | `packages/grid-features/src/index.ts` | MODIFY | `useColumnOrderPersist` export 추가 |
| 5 | `packages/grid-features/src/column-drag/useColumnDrag.stories.tsx` | MODIFY | `PersistAndKeyboard` story 추가 (AC-006) |
| 6 | `packages/grid-core/src/types.ts` | MODIFY | `GridProps`에 `persistColumnOrder?`, `columnOrderStorageKey?` 추가 (AC-001, D1) |
| 7 | `packages/grid-core/src/Grid.tsx` | MODIFY | th 블록에 `tabIndex`, `onKeyDown`, `aria-roledescription` 추가; `useColumnDrag` 호출에 persist props 전달 (AC-003, D2, C-31) |

**Base path**: `D:/project/topvel_project/topvel-grid-monorepo/`

**NEW count**: 1  
**MODIFY count**: 6  
**Total**: 7

---

## Section 8. 파일별 구현 명세

### 8.1 `packages/grid-features/src/column-drag/useColumnOrderPersist.ts` (NEW)

```ts
/**
 * @tomis/grid-features — useColumnOrderPersist hook.
 *
 * G-002 (MOD-GRID-07): 컬럼 순서 localStorage 영속화.
 *
 * AC-001: persistColumnOrder + columnOrderStorageKey prop 기반 저장/복원.
 * AC-002: localStorage 접근 try/catch + SSR guard + QuotaExceededError 처리.
 *
 * 구조: grid-core/useStoragePersist.ts 미러 (D6 결정).
 */

import { useEffect, useRef } from 'react';
import type { Table } from '@tanstack/react-table';

export interface UseColumnOrderPersistProps<TData> {
  /** TanStack Table v8 인스턴스 */
  table: Table<TData>;
  /** localStorage 영속화 활성 여부 (persistColumnOrder prop) */
  enabled: boolean;
  /** localStorage 키 (columnOrderStorageKey prop) */
  storageKey: string;
}

/**
 * 컬럼 순서를 localStorage에 저장/복원하는 hook (D10).
 *
 * - 반환: `{ saveOrder }` — useColumnDrag 내부 handleColumnOrderChange에서 호출
 * - mount 시: localStorage.getItem → JSON.parse → table.setColumnOrder (AC-001 복원)
 * - save 방법: `saveOrder(order)` 호출 → localStorage.setItem (D10)
 * - 모든 localStorage 접근: try/catch (AC-002)
 * - SSR guard: typeof window (AC-002, D6)
 * - QuotaExceededError: console.warn + silent skip (AC-002)
 *
 * @typeParam TData - 행 데이터 타입
 */
export function useColumnOrderPersist<TData>({
  table,
  enabled,
  storageKey,
}: UseColumnOrderPersistProps<TData>): { saveOrder: (order: string[]) => void } {
  // saveOrder 콜백 — 외부 onColumnOrderChange 에서 호출
  const saveOrder = (order: string[]): void => {
    if (!enabled || typeof window === 'undefined' || !storageKey) return; // AC-002 SSR guard
    try {
      localStorage.setItem(storageKey, JSON.stringify(order));
    } catch (e) {
      // AC-002: QuotaExceededError → silent fallback + console.warn
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn('[useColumnOrderPersist] QuotaExceededError — save skipped', storageKey);
      }
    }
  };

  // saveOrder ref — useEffect deps 없이 최신 함수 참조 유지 (useStoragePersist D2 Option A 패턴)
  const saveRef = useRef(saveOrder);
  useEffect(() => {
    saveRef.current = saveOrder;
  }); // intentionally no deps

  // mount 시 1회 localStorage → table.setColumnOrder 복원 (AC-001, AC-002)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !storageKey) return; // AC-002 SSR guard
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (
        !Array.isArray(parsed) ||
        parsed.some((item) => typeof item !== 'string')
      ) {
        localStorage.removeItem(storageKey); // 손상된 데이터 → 제거
        return;
      }
      const order = parsed as string[];
      if (order.length > 0) {
        table.setColumnOrder(order); // AC-001: TanStack v8 표준 API (C-2)
      }
    } catch {
      // AC-002: JSON.parse 실패 → 제거 후 무시
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // removeItem도 실패 시 무시
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  return { saveOrder };
}
```

**AC 커버리지**:
- AC-001: `table.setColumnOrder(order)` — mount 복원 + `saveOrder` 반환 → drag/keyboard 완료 후 저장
- AC-002: `typeof window` SSR guard + try/catch (getItem, setItem, removeItem) + `QuotaExceededError` console.warn

### 8.2 `packages/grid-features/src/column-drag/types.ts` (MODIFY)

`UseColumnDragProps<TData>`에 추가:
```ts
/** localStorage 영속화 활성 여부 (persistColumnOrder prop — G-002 AC-001) */
persistColumnOrder?: boolean;
/** localStorage 키 (columnOrderStorageKey prop — G-002 AC-001) */
columnOrderStorageKey?: string;
```

`UseColumnDragReturn`에 추가:
```ts
/**
 * 헤더 th onKeyDown에 연결할 핸들러 반환 함수 (G-002 AC-003).
 *
 * @param columnId - 헤더 컬럼 ID
 * @param isPinned - column.getIsPinned() !== false (AC-004 pinned guard)
 * @returns DOM KeyboardEvent 핸들러 (th onKeyDown에서 e.nativeEvent 전달)
 */
getKeyDownHandler: (columnId: string, isPinned: boolean) => (e: KeyboardEvent) => void;
```

전체 수정 후 `types.ts` 결과:

```ts
/**
 * @tomis/grid-features — Column drag-and-drop types.
 *
 * G-001 (MOD-GRID-07): HTML5 Drag and Drop API 기반 컬럼 헤더 드래그 재정렬.
 * G-002 (MOD-GRID-07): localStorage 영속화 + 키보드 단축키 (Alt+← / Alt+→).
 */

import type { Table } from '@tanstack/react-table';

/**
 * `useColumnDrag` hook props.
 *
 * @typeParam TData - 행 데이터 타입.
 */
export interface UseColumnDragProps<TData> {
  /** TanStack Table v8 인스턴스 (`useReactTable` 반환값). */
  table: Table<TData>;
  /** 드래그 재정렬 활성 여부 (`enableColumnReorder` prop 으로부터 전달). */
  enabled: boolean;
  /** 컬럼 순서 변경 완료 후 호출되는 콜백 (G-001 AC-005). */
  onColumnOrderChange?: (order: string[]) => void;
  /** localStorage 영속화 활성 여부 (G-002 AC-001). */
  persistColumnOrder?: boolean;
  /** localStorage 키 (G-002 AC-001). persistColumnOrder=true 시 필수 (빈 문자열 → 저장 skip). */
  columnOrderStorageKey?: string;
}

/**
 * `useColumnDrag` hook 반환값.
 */
export interface UseColumnDragReturn {
  /**
   * 헤더 `<th>` 에 spread할 drag 이벤트 props 반환.
   *
   * @param columnId - 헤더 컬럼 ID.
   * @param isPinned - `column.getIsPinned() !== false` 여부 (AC-004).
   */
  getDragProps: (columnId: string, isPinned: boolean) => DragThProps;
  /**
   * 현재 drop 인디케이터를 표시할 컬럼 ID.
   * `null` = 드래그 비활성 또는 드래그 중이 아님.
   */
  dragOverId: string | null;
  /**
   * 헤더 `<th>` onKeyDown에 연결할 핸들러 반환 함수 (G-002 AC-003).
   * Alt+← / Alt+→ 키 이벤트로 컬럼 좌/우 이동.
   *
   * @param columnId - 헤더 컬럼 ID.
   * @param isPinned - pinned 컬럼 → no-op (AC-004).
   * @returns DOM KeyboardEvent 핸들러. Grid.tsx 에서 `e.nativeEvent` 전달.
   */
  getKeyDownHandler: (columnId: string, isPinned: boolean) => (e: KeyboardEvent) => void;
}

/**
 * 헤더 `<th>` DOM 요소에 전달할 drag props.
 *
 * HTML5 DragEvent 핸들러 (C-20: 외부 라이브러리 미사용).
 * Grid.tsx 에서 React.DragEvent<HTMLTableCellElement> 를 받아
 * `.nativeEvent` 로 DOM DragEvent 추출 후 이 핸들러에 전달.
 */
export interface DragThProps {
  /** pinned=true → false, enabled=true → true (AC-001/AC-004). */
  draggable: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
}
```

### 8.3 `packages/grid-features/src/column-drag/useColumnDrag.ts` (MODIFY)

`useColumnOrderPersist` 통합 + `getKeyDownHandler` 구현 추가.

수정 후 핵심 추가 부분:

```ts
import { useCallback, useRef, useState } from 'react';
import type { UseColumnDragProps, UseColumnDragReturn, DragThProps } from './types';
import { useColumnOrderPersist } from './useColumnOrderPersist';

export function useColumnDrag<TData>(
  props: UseColumnDragProps<TData>,
): UseColumnDragReturn {
  const { table, enabled, onColumnOrderChange, persistColumnOrder, columnOrderStorageKey } = props;

  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceId = useRef<string | null>(null);

  // G-002 AC-001/AC-002: localStorage 영속화 hook — { saveOrder } 반환 (D10)
  const { saveOrder } = useColumnOrderPersist({
    table,
    enabled: persistColumnOrder === true,
    storageKey: columnOrderStorageKey ?? '',
  });

  // G-002 내부 onColumnOrderChange — 외부 콜백 + persist save 합성
  const handleColumnOrderChange = useCallback(
    (order: string[]) => {
      onColumnOrderChange?.(order);
      saveOrder(order); // AC-001: drag 완료 후 저장
    },
    [onColumnOrderChange, saveOrder],
  );

  // ... (기존 getDragProps — onColumnOrderChange 를 handleColumnOrderChange 로 교체) ...

  // G-002 AC-003: Alt+← / Alt+→ 키보드 이동 핸들러 (focus-scoped, D8)
  const getKeyDownHandler = useCallback(
    (columnId: string, isPinned: boolean) =>
      (e: KeyboardEvent): void => {
        // AC-004: pinned 컬럼 → no-op
        if (!enabled || isPinned) return;
        if (!e.altKey) return;
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        e.preventDefault(); // 브라우저 기본 동작 방지 (D8 focus-scope 의도 명시)

        // 현재 컬럼 순서 획득 (G-001 onDrop 동일 패턴)
        const currentOrder = table.getState().columnOrder;
        const allColumns = table.getAllLeafColumns().map((c) => c.id);
        const baseOrder: string[] = currentOrder.length > 0 ? currentOrder : allColumns;

        const currentIndex = baseOrder.indexOf(columnId);
        if (currentIndex === -1) return;

        const direction = e.key === 'ArrowLeft' ? -1 : 1;
        let targetIndex = currentIndex + direction;

        // AC-004: pinned 컬럼 건너뜀 — 비-pinned 컬럼만 이동 대상
        while (
          targetIndex >= 0 &&
          targetIndex < baseOrder.length
        ) {
          const targetColId = baseOrder[targetIndex];
          if (targetColId === undefined) break;
          const targetCol = table.getColumn(targetColId);
          if (targetCol?.getIsPinned() === false) break; // 비-pinned 대상 발견
          targetIndex += direction; // pinned → 계속 건너뜀
        }

        if (targetIndex < 0 || targetIndex >= baseOrder.length) return; // 범위 초과

        // 이동 계산: source 제거 후 target 위치 삽입 (G-001 onDrop 동일 알고리즘)
        const newOrder = [...baseOrder];
        newOrder.splice(currentIndex, 1);
        const insertIndex = newOrder.indexOf(baseOrder[targetIndex]!);
        if (insertIndex === -1) return;
        const finalIndex = direction === 1 ? insertIndex + 1 : insertIndex;
        newOrder.splice(finalIndex, 0, columnId);

        table.setColumnOrder(newOrder); // AC-003: TanStack v8 표준 API (C-2)
        handleColumnOrderChange(newOrder); // AC-001: persist 저장 포함
      },
    [enabled, table, handleColumnOrderChange],
  );

  const getDragProps = useCallback(
    (columnId: string, isPinned: boolean): DragThProps => {
      if (!enabled || isPinned) {
        return {
          draggable: false,
          onDragStart: () => undefined,
          onDragOver: () => undefined,
          onDragLeave: () => undefined,
          onDrop: () => undefined,
          onDragEnd: () => undefined,
        };
      }
      return {
        draggable: true,
        onDragStart: (e: DragEvent) => {
          dragSourceId.current = columnId;
          e.dataTransfer?.setData('columnId', columnId);
        },
        onDragOver: (e: DragEvent) => {
          e.preventDefault();
          if (isPinned) return;
          setDragOverId(columnId);
        },
        onDragLeave: (_e: DragEvent) => {
          setDragOverId(null);
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          if (isPinned) { setDragOverId(null); return; }
          const sourceId = e.dataTransfer?.getData('columnId') ?? dragSourceId.current;
          if (!sourceId || sourceId === columnId) { setDragOverId(null); return; }
          const currentOrder = table.getState().columnOrder;
          const allColumns = table.getAllLeafColumns().map((c) => c.id);
          const baseOrder: string[] = currentOrder.length > 0 ? currentOrder : allColumns;
          const newOrder = baseOrder.filter((id) => id !== sourceId);
          const targetIndex = newOrder.indexOf(columnId);
          if (targetIndex === -1) { setDragOverId(null); return; }
          newOrder.splice(targetIndex, 0, sourceId);
          table.setColumnOrder(newOrder);
          handleColumnOrderChange(newOrder); // G-002: persist 저장 포함
          dragSourceId.current = null;
          setDragOverId(null);
        },
        onDragEnd: (_e: DragEvent) => {
          dragSourceId.current = null;
          setDragOverId(null);
        },
      };
    },
    [enabled, table, handleColumnOrderChange],
  );

  return { getDragProps, dragOverId, getKeyDownHandler };
}
```

**AC 커버리지**:
- AC-003: `getKeyDownHandler` + `e.altKey` + `e.key` 판별 + `e.preventDefault()`
- AC-004: `isPinned=true` → 즉시 return; 이동 계산 시 pinned 컬럼 skip loop
- D8: th-level `onKeyDown` 속성에 attach — document-level 미사용

### 8.4 `packages/grid-features/src/index.ts` (MODIFY)

기존 exports 유지 + `useColumnOrderPersist` 추가:

```ts
// G-002 (MOD-GRID-07): column order persistence export
export { useColumnOrderPersist } from './column-drag/useColumnOrderPersist';
export type { UseColumnOrderPersistProps } from './column-drag/useColumnOrderPersist';
```

### 8.5 `packages/grid-features/src/column-drag/useColumnDrag.stories.tsx` (MODIFY)

기존 2 stories(`ColumnReorderDrop`, `WithPinnedGuard`) 유지 + 3번째 story 추가:

```tsx
/**
 * G-002: persistColumnOrder + 키보드 이동 시나리오 (AC-006).
 * localStorage mock 사용 (window.localStorage 직접 조작).
 * Alt+← / Alt+→ 키 동작 안내 포함.
 */
export const PersistAndKeyboard: Story = {
  name: '영속화 + 키보드 이동 (Alt+← / Alt+→)',
  args: {},
  render: () => <PersistKeyboardDemo />,
};
```

`PersistKeyboardDemo` 컴포넌트: `useColumnOrderPersist`를 사용하는 `useColumnDrag` 래퍼 — `persistColumnOrder={true}` + `columnOrderStorageKey="story-column-order"`. 리프레시 안내 문구 + 현재 localStorage 값 표시.

### 8.6 `packages/grid-core/src/types.ts` (MODIFY)

`GridProps<TData>` interface에 G-001 드래그 재정렬 섹션 이후 추가:

```ts
// ─── G-002 (MOD-GRID-07): 컬럼 순서 localStorage 영속화 ───
/**
 * 컬럼 순서 localStorage 영속화 활성 (G-002).
 *
 * `true` + `columnOrderStorageKey` 지정 시 drag/keyboard 완료 후 localStorage 저장.
 * mount 시 저장된 순서 복원 (`table.setColumnOrder`).
 *
 * @remarks
 * D5: `columnPersistence` (G-003) 가 `columnOrder` 를 persist 목록에 포함하면
 * G-003 쪽이 별도 storageKey 로 독립 저장 — key 충돌 없음.
 * 두 옵션 동시 지정 시 mount 순서에 따라 나중에 실행된 `table.setColumnOrder` 가 최종 적용
 * (non-deterministic — 동시 사용 비권장).
 */
persistColumnOrder?: boolean;

/**
 * `persistColumnOrder=true` 시 사용할 localStorage 키.
 *
 * 빈 문자열(`''`) 전달 시 localStorage 접근 없음 (EC-003).
 * 미지정 시 `persistColumnOrder=true` 라도 저장 skip.
 */
columnOrderStorageKey?: string;
```

**C-29 exactOptionalPropertyTypes 준수**: `?:` 표기. `undefined` 할당 없음.

### 8.7 `packages/grid-core/src/Grid.tsx` (MODIFY)

Section 11 (Before/After 상세) 참조.

---

## Section 9. 타입 정의 명세

### `GridProps<TData>` 추가 props (grid-core/types.ts)

```ts
persistColumnOrder?: boolean;
columnOrderStorageKey?: string;
```

### `UseColumnDragProps<TData>` 추가 props (grid-features/column-drag/types.ts)

```ts
persistColumnOrder?: boolean;
columnOrderStorageKey?: string;
```

### `UseColumnDragReturn` 추가 (grid-features/column-drag/types.ts)

```ts
getKeyDownHandler: (columnId: string, isPinned: boolean) => (e: KeyboardEvent) => void;
```

### `UseColumnOrderPersistProps<TData>` (grid-features/column-drag/useColumnOrderPersist.ts — NEW)

```ts
interface UseColumnOrderPersistProps<TData> {
  table: Table<TData>;
  enabled: boolean;
  storageKey: string;
}
```

**C-29 주의**: `persistColumnOrder?` / `columnOrderStorageKey?` 를 `UseColumnDragProps`에서 `useColumnOrderPersist`로 전달 시 조건부 spread 없이 단순 값 전달:
```ts
useColumnOrderPersist({
  table,
  enabled: persistColumnOrder === true,
  storageKey: columnOrderStorageKey ?? '',
});
```
`?? ''` fallback으로 `string` 타입 보장 — optional → required 안전 변환.

---

## Section 10. 엣지 케이스 및 가드 조건

| 시나리오 | 처리 방법 |
|---------|---------|
| `persistColumnOrder=true` + `columnOrderStorageKey` 미지정 | `storageKey = ''` → `!storageKey` guard → localStorage 접근 없음 (EC-001) |
| `persistColumnOrder=false` (또는 미전달) | `useColumnOrderPersist` `enabled=false` → mount 복원 + save 모두 skip (EC-002) |
| localStorage 미지원 환경 (SSR / private 브라우저) | `typeof window === 'undefined'` guard + try/catch → silent skip (AC-002) |
| `localStorage.getItem` 반환값이 비-배열 JSON | `Array.isArray` + `typeof item !== 'string'` 검증 실패 → `removeItem` 후 무시 (AC-002) |
| `localStorage.setItem` QuotaExceededError | `console.warn` + silent skip (AC-002, useStoragePersist 동일 패턴) |
| `columnPersistence` + `persistColumnOrder` 동시 사용 | 별도 storageKey 사용 → key 충돌 없음; mount 순서에 따라 나중 setColumnOrder 적용 (D5) |
| Alt+← 최좌측 컬럼에서 호출 | `targetIndex < 0` → return (이동 없음) |
| Alt+→ 최우측 컬럼에서 호출 | `targetIndex >= baseOrder.length` → return (이동 없음) |
| 인접 컬럼이 모두 pinned (이동 불가) | pinned skip loop 후 범위 초과 → return (이동 없음, AC-004) |
| `enableColumnReorder=false` 시 keyboard 핸들러 | `enabled=false` → `getKeyDownHandler` 내부 즉시 return (no-op) |
| `columnOrder` 빈 배열 (초기 상태) | `table.getAllLeafColumns().map(c => c.id)` fallback — drag와 동일 패턴 |
| `tabIndex=0` 시 포커스 outline | 브라우저 기본 focus outline (CSS reset 없음) — 시각적 접근성 보장 |
| keyboard 핸들러 fire 시 다른 이벤트 핸들러 충돌 | `onKeyDown` th-level scoped + `e.preventDefault()` — click/sort 핸들러 trigger 없음 |

---

## Section 11. Grid.tsx 통합 명세 (C-31 wiring 의무)

### 11.1 `useColumnDrag` 호출 수정 (Grid.tsx ~L163 — Before/After)

**Before** (현재 G-001 적용 상태):
```tsx
// G-001 (MOD-GRID-07): 컬럼 드래그 재정렬 — HTML5 DnD (C-20, AC-001~AC-006).
// C-29 exactOptionalPropertyTypes: onColumnOrderChange 조건부 spread.
const { getDragProps, dragOverId } = useColumnDrag<TData>({
  table,
  enabled: props.enableColumnReorder === true,
  ...(props.onColumnOrderChange !== undefined
    ? { onColumnOrderChange: props.onColumnOrderChange }
    : {}),
});
```

**After** (G-002 통합):
```tsx
// G-001 (MOD-GRID-07): 컬럼 드래그 재정렬 — HTML5 DnD (C-20, AC-001~AC-006).
// G-002 (MOD-GRID-07): localStorage 영속화 + 키보드 단축키 (AC-001~AC-004).
// C-29 exactOptionalPropertyTypes: optional props 조건부 spread.
const { getDragProps, dragOverId, getKeyDownHandler } = useColumnDrag<TData>({
  table,
  enabled: props.enableColumnReorder === true,
  ...(props.onColumnOrderChange !== undefined
    ? { onColumnOrderChange: props.onColumnOrderChange }
    : {}),
  ...(props.persistColumnOrder !== undefined
    ? { persistColumnOrder: props.persistColumnOrder }
    : {}),
  ...(props.columnOrderStorageKey !== undefined
    ? { columnOrderStorageKey: props.columnOrderStorageKey }
    : {}),
});
```

**C-29 준수**: `persistColumnOrder`, `columnOrderStorageKey` 모두 조건부 spread-skip 패턴.

### 11.2 `<th>` render block 수정 (Grid.tsx ~L305 — Before/After)

**Before** (현재 G-001 적용 상태):
```tsx
const isPinned = header.column.getIsPinned() !== false;
const dragProps = getDragProps(header.column.id, isPinned);
// ...
return (
  <th
    key={header.id}
    colSpan={header.colSpan}
    className={`relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${
      canSort ? 'cursor-pointer hover:bg-gray-100' : ''
    } ${pinned.className}`}
    style={combinedStyle}
    onClick={handleHeaderClick}
    draggable={dragProps.draggable}
    onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
    onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
    onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
    onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
    onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
  >
    {/* G-001 (MOD-GRID-07): drop 위치 시각 인디케이터 (AC-003, C-5 Tailwind). */}
    <DropIndicator dragOverId={dragOverId} columnId={header.column.id} />
    ...
  </th>
);
```

**After** (G-002 추가):
```tsx
const isPinned = header.column.getIsPinned() !== false;
const dragProps = getDragProps(header.column.id, isPinned);
// G-002 (MOD-GRID-07): keyboard handler per-header (AC-003, D8 focus-scoped).
const keyDownHandler = getKeyDownHandler(header.column.id, isPinned);

return (
  <th
    key={header.id}
    colSpan={header.colSpan}
    className={`relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap select-none ${
      canSort ? 'cursor-pointer hover:bg-gray-100' : ''
    } ${pinned.className}`}
    style={combinedStyle}
    onClick={handleHeaderClick}
    draggable={dragProps.draggable}
    onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
    onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
    onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
    onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
    onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
    tabIndex={0}
    onKeyDown={(e) => keyDownHandler(e.nativeEvent)}
    aria-roledescription={props.enableColumnReorder === true ? 'draggable column' : undefined}
  >
    {/* G-001 (MOD-GRID-07): drop 위치 시각 인디케이터 (AC-003, C-5 Tailwind). */}
    <DropIndicator dragOverId={dragOverId} columnId={header.column.id} />
    ...
  </th>
);
```

**추가 props 설명**:
- `tabIndex={0}`: th focusable — AC-003 keyboard 접근성 필수
- `onKeyDown={(e) => keyDownHandler(e.nativeEvent)}`: React synthetic event → DOM `KeyboardEvent` 변환 (G-001 drag와 동일 패턴)
- `aria-roledescription={...}`: `enableColumnReorder=true` 시만 렌더 — `undefined` 전달 시 React가 attr 미렌더 (C-29 exactOptionalPropertyTypes 안전)

### 11.3 구현 순서 (의존성 고려)

1. **Step 1** — `packages/grid-features/src/column-drag/useColumnOrderPersist.ts` NEW 생성
2. **Step 2** — `packages/grid-features/src/column-drag/types.ts` MODIFY (`UseColumnDragProps` + `UseColumnDragReturn` 확장)
3. **Step 3** — `packages/grid-features/src/column-drag/useColumnDrag.ts` MODIFY (import 추가 + `getKeyDownHandler` 구현 + `handleColumnOrderChange` 합성)
4. **Step 4** — `packages/grid-features/src/index.ts` MODIFY (`useColumnOrderPersist` export 추가)
5. **Step 5** — `packages/grid-features/src/column-drag/useColumnDrag.stories.tsx` MODIFY (`PersistAndKeyboard` story 추가)
6. **Step 6** — `packages/grid-core/src/types.ts` MODIFY (`GridProps` 신규 props 추가)
7. **Step 7** — `packages/grid-core/src/Grid.tsx` MODIFY (`useColumnDrag` 호출 props 확장 + th 블록 확장)

---

## Section 12. 검증 계획 (Verify Stage 입력)

### 12.1 TypeScript 컴파일 (AC-005)
```bash
npx tsc --noEmit -p packages/grid-core/tsconfig.json
npx tsc --noEmit -p packages/grid-features/tsconfig.json
```
**기대**: 0 errors

### 12.2 기능 검증 항목

| 검증 항목 | 방법 | 기대 결과 |
|---------|------|---------|
| `persistColumnOrder=true` + `columnOrderStorageKey` 설정 후 drag | Storybook | localStorage에 JSON array 저장 |
| 페이지 재방문 (mount) | Storybook 리프레시 | `table.setColumnOrder(savedOrder)` 호출 → 순서 복원 |
| `localStorage` 미지원 환경 | SSR guard 코드 검토 | try/catch + `typeof window` guard 확인 |
| `QuotaExceededError` | mock throw | `console.warn` + 상태 변경 없음 |
| `Alt+←` 호출 (비-pinned 컬럼) | Storybook / keyboard 시뮬레이션 | 컬럼 한 칸 왼쪽 이동 |
| `Alt+→` 호출 (비-pinned 컬럼) | Storybook | 컬럼 한 칸 오른쪽 이동 |
| `Alt+←` 최좌측 컬럼 | Storybook | 순서 변경 없음 |
| `Alt+→` 최우측 컬럼 | Storybook | 순서 변경 없음 |
| pinned 컬럼에서 Alt+← / Alt+→ | Storybook | no-op (AC-004) |
| pinned 컬럼 인접 이동 시 skip | Storybook | pinned 컬럼 건너뜀 확인 |
| `tabIndex=0` th | DOM inspection | `tabIndex="0"` on all `<th>` |
| `aria-roledescription` | DOM inspection | `enableColumnReorder=true` 시만 존재 |
| `tsc --noEmit` | CI | 0 errors |

### 12.3 Storybook Story (AC-006, C-25)

**파일**: `packages/grid-features/src/column-drag/useColumnDrag.stories.tsx`

기존 2 stories + 신규 1 story (`PersistAndKeyboard`):
- 제목: `'영속화 + 키보드 이동 (Alt+← / Alt+→)'`
- `persistColumnOrder={true}` + `columnOrderStorageKey="story-column-order"` 설정
- localStorage 저장값 display 패널 포함
- 키보드 사용 안내 문구: "헤더 셀을 탭으로 선택 후 Alt+← / Alt+→ 로 이동하세요."
- Storybook 앱 미설정 상태 — G-001-storybook-bootstrap.md 동일 deviation 적용 (story 파일 작성 완료 = C-25 만족)

---

## Section 13. 번들 영향 분석

| 항목 | 내용 |
|------|------|
| 예상 번들 증가 | +2 KB (`useColumnOrderPersist` ~1 KB + keyboard handler ~0.5 KB + types/Grid 수정 ~0.5 KB) |
| 패키지 | `@tomis/grid-features` (keyboard handler + persist hook); `@tomis/grid-core` MODIFY (types.ts, Grid.tsx — 기존 패키지 내) |
| 누적 | G-001 +3 KB + G-002 +2 KB = 누적 ~5 KB (`.size-limit.json` `@tomis/grid-features` 20 KB brotli 한도 내) |
| tree-shakeable | `useColumnOrderPersist` named export — 미사용 시 0 KB |
| 외부 dependency 추가 | 없음 (C-20, localStorage = 네이티브 브라우저 API) |
| 버전 범프 | `grid-features` `0.1.0` → `0.2.0` (minor bump — 신규 feature export, C-23) |

---

## Section N/A 목록

이하 항목은 본 Goal에서 N/A 처리됨 (점수 분모에서 제외):

| 항목 | 근거 |
|------|------|
| A-03 (마이그레이션 리스크) | migrationImpact: low + affectedUsageFiles: 0 → 마이그레이션 리스크 없음 |
| A-04 (C-17 시각 회귀) | migrationImpact: low + affectedUsageFiles: 0 → C-17 의무 미해당 (Section 6) |
| B-05 (ref API + imperative handle) | 선언적 hook — `useImperativeHandle` 미사용 |
| B-06 (AC 산문 ↔ Section 8 className 정합성) | G-002 spec은 Tailwind className을 AC 산문에 시각 사양으로 인용하지 않음 — keyboard 포커스는 브라우저 기본 outline (Tailwind 클래스 불명시), persist는 UI 없음, DropIndicator className은 G-001에서 확정된 기존 컴포넌트 (수정 없음) → "Tailwind {class-list}" 패턴 narrative 없음 |
| C-05 (AC 호환성 검증 항목) | affectedUsageFiles: 0 (신규 opt-in prop) → N/A. AC-005 tsc 0 errors는 기술적 호환성 검증 |
| D-02 (기존 변형 대응표) | 신규 영역 — 대응할 variant 없음 (affectedUsageFiles: 0) |
| D-04 (Deprecation 전략) | Breaking change 없음 (신규 optional prop) |
| D-05 (롤백 전략) | low tier + 사용처 0 |
| F-02 (라이선스 검증) | MIT 패키지 |

---

## Section 사용 예시 (B-02 보강)

### 기본 사용 (drag + persist + keyboard)

```tsx
import { Grid } from '@tomis/grid-core';

function MyPage() {
  return (
    <Grid
      data={rows}
      columns={columns}
      enableColumnReorder
      persistColumnOrder
      columnOrderStorageKey="my-grid-column-order-v1"
      onColumnOrderChange={(order) => console.log('order changed:', order)}
    />
  );
}
```

### 고급 사용 — `useColumnDrag` 직접 + `useColumnOrderPersist` 조합

```tsx
import { useColumnDrag, useColumnOrderPersist } from '@tomis/grid-features';

function CustomTable() {
  const table = useReactTable({ ... });
  const { getDragProps, dragOverId, getKeyDownHandler } = useColumnDrag({
    table,
    enabled: true,
    persistColumnOrder: true,
    columnOrderStorageKey: 'custom-table-order',
    onColumnOrderChange: (order) => externalSync(order),
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map(hg => (
          <tr key={hg.id}>
            {hg.headers.map(header => {
              const isPinned = header.column.getIsPinned() !== false;
              const dragProps = getDragProps(header.column.id, isPinned);
              const keyDownHandler = getKeyDownHandler(header.column.id, isPinned);
              return (
                <th
                  key={header.id}
                  tabIndex={0}
                  draggable={dragProps.draggable}
                  onDragStart={(e) => dragProps.onDragStart(e.nativeEvent)}
                  onDragOver={(e) => dragProps.onDragOver(e.nativeEvent)}
                  onDragLeave={(e) => dragProps.onDragLeave(e.nativeEvent)}
                  onDrop={(e) => dragProps.onDrop(e.nativeEvent)}
                  onDragEnd={(e) => dragProps.onDragEnd(e.nativeEvent)}
                  onKeyDown={(e) => keyDownHandler(e.nativeEvent)}
                  aria-roledescription="draggable column"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
    </table>
  );
}
```

---

## 이상 기록 (Anomaly Notes)

1. **Goals.json implementFiles 보정 (D3)**: goals.json에 3파일(`useColumnDrag.ts`, `useColumnOrderPersist.ts`, `types.ts`)만 명시. C-31 wiring 의무 이행 및 AC-001/AC-003/AC-006 완전 이행을 위해 7파일로 확장. 이 spec이 canonical implementFiles 정의.

2. **`aria-grabbed` deprecated — `aria-roledescription` 채택 (D9)**: goals.json AC-003에 "aria-grabbed 속성 선택 적용" 명시되나, WAI-ARIA 1.1에서 `aria-grabbed` deprecated. G-002 spec은 `aria-roledescription="draggable column"` 채택 (동등 접근성, 비-deprecated). goals.json 원문과 spec 결정 간 미세 deviation — spec이 canonical (C-27).

3. **Alt+←/→ 충돌 없음 확인 (D8)**: `GridPagination.tsx`의 `enableKeyboardNav` 핸들러가 동일 키를 사용하나, pagination container div에 scoped됨 → th-level `onKeyDown`과 scope 분리. 공존 안전.

4. **`columnPersistence` coexistence (D5)**: G-003 `columnPersistence`와 G-002 `persistColumnOrder` 동시 사용 시, 두 hook이 각자 별도 storageKey로 localStorage에 저장 → key 충돌 없음. mount 순서 상 나중에 실행된 `table.setColumnOrder`가 최종 적용 (non-deterministic — 동시 사용 비권장). 이 spec에 명문화 완료.

5. **`storageKey` prop 이름 → `columnOrderStorageKey` 로 변경 (C-27 deviation)**: goals.json AC-001 및 `userJourneySteps` step 1에서 prop 이름을 `storageKey?: string` / `storageKey='my-grid-columns'` 로 명시. G-002 spec은 `columnOrderStorageKey?: string` 으로 변경 채택. 근거: `grid-core/types.ts` L492에 G-003의 `columnPersistence.storageKey` 가 이미 존재 — `GridProps` 최상위에 `storageKey` 추가 시 시맨틱 충돌 + 혼란 유발. `columnOrderStorageKey` 는 역할을 명시하고 네임스페이스 충돌을 제거. 내부 `UseColumnOrderPersistProps.storageKey` 는 hook-local 이므로 단명 유지 (충돌 없음). 이 spec이 canonical (C-27).
